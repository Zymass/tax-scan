#!/bin/bash

# Скрипт для выполнения на сервере
# Использование: скопируйте этот файл на сервер и выполните: bash server-setup.sh

set -e

APP_DIR="/var/www/taxcalculator"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "🚀 Настройка TaxCalculator на сервере..."

# Установка Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Установка PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
fi

# Установка Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Установка Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Создание директорий
mkdir -p $APP_DIR
mkdir -p /var/log/pm2

# Backend
echo "📦 Настройка бэкенда..."
cd $BACKEND_DIR

# Установка зависимостей
npm install --production || npm install

# Генерация Prisma клиента
npx prisma generate

# Создание .env файла
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://vm3937869.example.com
EOF
fi

# Миграция базы данных
echo "🗄️  Настройка базы данных..."
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init

# Сборка
echo "🔨 Сборка бэкенда..."
npm run build

# Frontend
echo "📦 Настройка фронтенда..."
cd $FRONTEND_DIR
npm install
npm run build

# PM2
echo "🚀 Запуск через PM2..."
cd $BACKEND_DIR

# Создание ecosystem.config.js если его нет
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'taxcalculator-backend',
    script: './dist/app.js',
    cwd: '/var/www/taxcalculator/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/taxcalculator-backend-error.log',
    out_file: '/var/log/pm2/taxcalculator-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
ECOSYSTEM
fi

# Запуск PM2
pm2 delete taxcalculator-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Настройка автозапуска
echo "⚙️  Настройка автозапуска PM2..."
pm2 startup | grep -v "PM2" | bash || echo "⚠️  Выполните команду автозапуска вручную: pm2 startup"

# Nginx
if [ -f /tmp/nginx-taxcalculator.conf ]; then
    echo "🌐 Настройка Nginx..."
    cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator
    ln -sf /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Проверка и перезапуск
    if nginx -t; then
        systemctl restart nginx
        systemctl enable nginx
        echo "✅ Nginx настроен и запущен"
    else
        echo "⚠️  Ошибка в конфигурации Nginx"
    fi
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📊 Статус приложения:"
pm2 status
echo ""
echo "🌐 Откройте: http://vm3937869.example.com"
echo ""
echo "📝 Полезные команды:"
echo "   pm2 logs taxcalculator-backend    # Логи приложения"
echo "   pm2 restart taxcalculator-backend # Перезапуск"
echo "   pm2 status                         # Статус"
