# 🚀 Запуск проекта на удаленном сервере

## Быстрый деплой

### 1. Подключение к серверу
```bash
ssh root@your-server-ip
```

### 2. Установка зависимостей системы
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
```

### 3. Загрузка проекта

**Вариант A: Через Git (рекомендуется)**

**Первая установка:**
```bash
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator
git clone https://github.com/Zymass/tax-scan.git
cd tax-scan
```

**Если проект уже установлен, обновите через git pull:**
```bash
cd /var/www/taxcalculator/tax-scan
git pull origin main
```

**Вариант B: Через SCP (с локального компьютера)**
```bash
# На вашем компьютере:
cd /Users/iliafiliaev/Develop/TaxCalculator
tar -czf taxcalculator.tar.gz --exclude='node_modules' --exclude='.git' --exclude='backend/dist' --exclude='frontend/dist' --exclude='backend/prisma/dev.db' backend/ frontend/
scp taxcalculator.tar.gz root@your-server-ip:/tmp/

# На сервере:
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator
tar -xzf /tmp/taxcalculator.tar.gz
mv backend tax-scan/backend
mv frontend tax-scan/frontend
cd tax-scan
```

### 4. Автоматическая настройка (рекомендуется)

```bash
# Скопируйте server-setup.sh на сервер
scp server-setup.sh root@your-server-ip:/tmp/

# На сервере выполните:
bash /tmp/server-setup.sh
```

### 5. Ручная настройка

#### 5.1. Установка системных зависимостей для Puppeteer
```bash
apt update
apt install -y \
  ca-certificates \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  wget \
  xdg-utils

# Для Ubuntu 24.04+ установите libasound2t64
apt install -y libasound2t64 || apt install -y libasound2 || true
```

#### 5.2. Настройка Backend
```bash
cd /var/www/taxcalculator/tax-scan/backend

# Создаем .env
cat > .env << EOF
DATABASE_URL="file:./prisma/prod.db"
NODE_ENV="production"
PORT=3000
FRONTEND_URL="http://your-domain.com"
JWT_SECRET="$(openssl rand -base64 32)"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://your-domain.com/api/auth/google/callback"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EOF

# Установка зависимостей
npm install

# Генерация Prisma Client
npx prisma generate

# Миграция базы данных
npx prisma migrate deploy

# Сборка
npm run build

# Запуск через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5.3. Настройка Frontend
```bash
cd /var/www/taxcalculator/tax-scan/frontend

# Создаем .env
echo 'VITE_API_URL=/api' > .env

# Установка зависимостей
npm install

# Сборка
npm run build
```

#### 5.4. Настройка Nginx
```bash
cat > /etc/nginx/sites-available/taxcalculator << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/taxcalculator/tax-scan/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Активация конфигурации
ln -sf /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск
nginx -t
systemctl restart nginx
systemctl enable nginx
```

## Полезные команды

```bash
# Просмотр логов
pm2 logs taxcalculator-backend

# Перезапуск приложения
pm2 restart taxcalculator-backend

# Статус приложения
pm2 status

# Остановка приложения
pm2 stop taxcalculator-backend

# Удаление из PM2
pm2 delete taxcalculator-backend
```

## Просмотр логов использования

Подробные инструкции по просмотру логов и аналитики см. в [VIEW_LOGS.md](./VIEW_LOGS.md)

**Быстрый доступ:**
- **Веб-аналитика:** `http://your-domain.com/analytics`
- **PM2 логи:** `pm2 logs taxcalculator-backend`
- **Nginx логи:** `tail -f /var/log/nginx/access.log`

## Обновление проекта

### Быстрое обновление через git pull

```bash
cd /var/www/taxcalculator/tax-scan

# Получить последние изменения из репозитория
git pull origin main

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart taxcalculator-backend

# Frontend
cd ../frontend
npm install
npm run build
systemctl reload nginx
```

### Если git pull требует аутентификации

**Настройка через Personal Access Token:**
```bash
# На сервере
cd /var/www/taxcalculator/tax-scan

# Установите токен в URL (замените YOUR_TOKEN на ваш токен)
git remote set-url origin https://Zymass:YOUR_TOKEN@github.com/Zymass/tax-scan.git

# Теперь можно делать pull без ввода пароля
git pull origin main
```

**Или используйте SSH (рекомендуется):**
```bash
# На сервере
cd /var/www/taxcalculator/tax-scan

# Измените remote на SSH
git remote set-url origin git@github.com:Zymass/tax-scan.git

# Проверьте подключение
ssh -T git@github.com

# Теперь можно делать pull
git pull origin main
```
