#!/bin/bash

# Быстрый деплой - все в одной команде
# Использование: ./quick-deploy.sh

SERVER="root@94.131.110.30"
APP_DIR="/var/www/taxcalculator"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"

echo "🚀 Быстрый деплой TaxCalculator..."

# Добавляем сервер в known_hosts (если нужно)
echo "🔑 Настройка SSH..."
ssh-keygen -R 94.131.110.30 2>/dev/null || true

# Загрузка файлов
echo "📤 Загрузка файлов..."
echo "⚠️  Вам будет предложено ввести пароль: 12345678"
rsync -avz $SSH_OPTS --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ $SERVER:$APP_DIR/backend/
rsync -avz $SSH_OPTS --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ $SERVER:$APP_DIR/frontend/

# Выполнение команд на сервере
echo "🔧 Настройка на сервере..."
echo "⚠️  Вам будет предложено ввести пароль: 12345678"
ssh $SSH_OPTS $SERVER << 'ENDSSH'
set -e

APP_DIR="/var/www/taxcalculator"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Backend
echo "📦 Настройка бэкенда..."
cd $BACKEND_DIR
npm install --production || npm install
npx prisma generate
if [ ! -f .env ]; then
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://vm3937869.example.com
EOF
fi
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init
npm run build

# Frontend
echo "📦 Настройка фронтенда..."
cd $FRONTEND_DIR
npm install
npm run build

# PM2
echo "🚀 Запуск через PM2..."
cd $BACKEND_DIR
if [ -f ecosystem.config.js ]; then
    pm2 delete taxcalculator-backend 2>/dev/null || true
    pm2 start ecosystem.config.js
else
    pm2 delete taxcalculator-backend 2>/dev/null || true
    pm2 start dist/app.js --name taxcalculator-backend
fi
pm2 save

echo "✅ Готово!"
ENDSSH

echo "✅ Деплой завершен!"
echo "🌐 Откройте: http://vm3937869.example.com"
