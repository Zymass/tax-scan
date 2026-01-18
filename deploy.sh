#!/bin/bash

# Скрипт деплоя TaxCalculator на VPS
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем деплой TaxCalculator..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Параметры сервера
SERVER_IP="94.131.110.30"
SERVER_USER="root"
SERVER_DOMAIN="vm3937869.example.com"
APP_DIR="/var/www/taxcalculator"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo -e "${YELLOW}📦 Подключение к серверу...${NC}"

# Создаем директорию на сервере
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR"

# Копируем файлы проекта
echo -e "${YELLOW}📤 Копирование файлов на сервер...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ $SERVER_USER@$SERVER_IP:$BACKEND_DIR/
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ $SERVER_USER@$SERVER_IP:$FRONTEND_DIR/

# Выполняем команды на сервере
echo -e "${YELLOW}🔧 Настройка окружения на сервере...${NC}"

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

APP_DIR="/var/www/taxcalculator"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Установка Node.js (если не установлен)
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Установка PM2 (если не установлен)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
fi

# Установка Nginx (если не установлен)
if ! command -v nginx &> /dev/null; then
    echo "📦 Установка Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Backend setup
echo "🔧 Настройка бэкенда..."
cd $BACKEND_DIR

# Установка зависимостей
npm install --production

# Генерация Prisma клиента
npx prisma generate

# Создание .env файла (если не существует)
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
npx prisma migrate deploy || npx prisma migrate dev --name init

# Сборка TypeScript
npm run build

# Frontend setup
echo "🔧 Настройка фронтенда..."
cd $FRONTEND_DIR

# Установка зависимостей
npm install

# Сборка фронтенда
npm run build

echo "✅ Настройка завершена!"
ENDSSH

echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "${YELLOW}📝 Следующие шаги:${NC}"
echo "1. Настройте Nginx конфигурацию"
echo "2. Запустите приложение через PM2: pm2 start ecosystem.config.js"
echo "3. Сохраните PM2 конфигурацию: pm2 save"
