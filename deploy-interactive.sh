#!/bin/bash

# Интерактивный деплой с вводом пароля
# Использование: ./deploy-interactive.sh

SERVER="root@94.131.110.30"
APP_DIR="/var/www/taxcalculator"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

echo "🚀 Интерактивный деплой TaxCalculator..."
echo "📝 Пароль для сервера: 12345678"
echo ""

# Добавляем сервер в known_hosts
ssh-keygen -R 94.131.110.30 2>/dev/null || true

# Загрузка файлов
echo "📤 Загрузка файлов на сервер..."
echo "   (Введите пароль когда попросит)"
rsync -avz $SSH_OPTS --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ $SERVER:$APP_DIR/backend/

rsync -avz $SSH_OPTS --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ $SERVER:$APP_DIR/frontend/

# Загрузка конфигураций
echo "📤 Загрузка конфигураций..."
scp $SSH_OPTS backend/ecosystem.config.js $SERVER:$APP_DIR/backend/ 2>/dev/null || echo "⚠️  ecosystem.config.js не найден, будет создан на сервере"
scp $SSH_OPTS nginx.conf $SERVER:/tmp/nginx-taxcalculator.conf 2>/dev/null || echo "⚠️  nginx.conf не найден"

# Выполнение команд на сервере
echo ""
echo "🔧 Настройка на сервере..."
echo "   (Введите пароль когда попросит)"
ssh $SSH_OPTS $SERVER << 'ENDSSH'
set -e

APP_DIR="/var/www/taxcalculator"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "📦 Проверка зависимостей..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
fi

# Nginx
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
npm install --production || npm install
npx prisma generate

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

echo "🗄️  Настройка базы данных..."
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init

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

pm2 delete taxcalculator-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Nginx
if [ -f /tmp/nginx-taxcalculator.conf ]; then
    echo "🌐 Настройка Nginx..."
    cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator
    ln -sf /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
fi

echo ""
echo "✅ Готово!"
echo "📊 Статус приложения:"
pm2 status
ENDSSH

echo ""
echo "✅ Деплой завершен!"
echo "🌐 Откройте: http://vm3937869.example.com"
echo ""
echo "📝 Полезные команды:"
echo "   ssh root@94.131.110.30 'pm2 logs taxcalculator-backend'"
echo "   ssh root@94.131.110.30 'pm2 status'"
