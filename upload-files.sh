#!/bin/bash

# Скрипт для загрузки файлов через scp
# Использование: ./upload-files.sh

SERVER="root@94.131.110.30"
APP_DIR="/var/www/taxcalculator"

echo "📤 Загрузка файлов на сервер..."
echo "Пароль: 12345678"
echo ""

# Создание директорий на сервере
ssh $SERVER "mkdir -p $APP_DIR/backend $APP_DIR/frontend"

# Загрузка бэкенда через tar (более надежно)
echo "📦 Загрузка бэкенда..."
cd backend
tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf - . | \
  ssh $SERVER "cd $APP_DIR/backend && tar -xzf -"
cd ..

# Загрузка фронтенда через tar
echo "📦 Загрузка фронтенда..."
cd frontend
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' -czf - . | \
  ssh $SERVER "cd $APP_DIR/frontend && tar -xzf -"
cd ..

# Загрузка конфигураций
echo "📦 Загрузка конфигураций..."
scp backend/ecosystem.config.js $SERVER:$APP_DIR/backend/ 2>/dev/null || echo "⚠️  ecosystem.config.js не найден"
scp nginx.conf $SERVER:/tmp/nginx-taxcalculator.conf 2>/dev/null || echo "⚠️  nginx.conf не найден"

echo ""
echo "✅ Файлы загружены!"
