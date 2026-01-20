#!/bin/bash

# Скрипт для автоматического деплоя на сервер
# Использование: ./deploy.sh root@141.98.188.75

set -e  # Остановка при ошибке

SERVER=$1
if [ -z "$SERVER" ]; then
    echo "Использование: ./deploy.sh user@server-ip"
    echo "Пример: ./deploy.sh root@141.98.188.75"
    exit 1
fi

echo "🚀 Начинаем деплой на $SERVER..."

# Создаем временную директорию
TEMP_DIR=$(mktemp -d)
echo "📦 Создана временная директория: $TEMP_DIR"

# Копируем проект (исключая ненужные файлы)
echo "📂 Копируем файлы проекта..."
rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backend/dist' \
  --exclude='frontend/dist' \
  --exclude='backend/prisma/dev.db' \
  --exclude='backend/prisma/dev.db-journal' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  ./ "$TEMP_DIR/taxcalculator/"

# Создаем архив
echo "📦 Создаем архив..."
cd "$TEMP_DIR"
tar -czf taxcalculator.tar.gz taxcalculator/

# Загружаем на сервер
echo "⬆️  Загружаем на сервер..."
scp taxcalculator.tar.gz "$SERVER:/tmp/"

# Выполняем команды на сервере
echo "🔧 Устанавливаем на сервере..."
ssh "$SERVER" << 'ENDSSH'
set -e

# Создаем директорию
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator

# Распаковываем архив
echo "📦 Распаковываем архив..."
tar -xzf /tmp/taxcalculator.tar.gz --strip-components=1

# Устанавливаем backend зависимости (включая dev для сборки TypeScript)
echo "📦 Устанавливаем backend зависимости..."
cd backend
npm install

# Генерируем Prisma Client
echo "🔧 Генерируем Prisma Client..."
npx prisma generate

# Запускаем миграции
echo "🗄️  Запускаем миграции..."
npx prisma migrate deploy || echo "⚠️  Миграции уже применены или база не существует"

# Собираем backend
echo "🔨 Собираем backend..."
npm run build

# Устанавливаем frontend зависимости
echo "📦 Устанавливаем frontend зависимости..."
cd ../frontend
npm install

# Собираем frontend
echo "🔨 Собираем frontend..."
npm run build

# Перезапускаем PM2
echo "🔄 Перезапускаем backend..."
cd ../backend
pm2 restart taxcalculator-backend || pm2 start dist/app.js --name taxcalculator-backend

# Сохраняем PM2 конфигурацию
pm2 save

echo "✅ Деплой завершен!"
echo "📝 Не забудьте проверить .env файлы в backend/ и frontend/"
ENDSSH

# Очищаем временные файлы
echo "🧹 Очищаем временные файлы..."
rm -rf "$TEMP_DIR"

echo "✅ Готово! Проект развернут на $SERVER"
echo "🌐 Откройте http://$(echo $SERVER | cut -d'@' -f2) в браузере"
