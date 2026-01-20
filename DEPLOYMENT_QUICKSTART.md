# 🚀 БЫСТРЫЙ СТАРТ - ДЕПЛОЙ НА СЕРВЕР

## 📋 Информация о сервере
- **IP**: 141.98.188.75
- **ОС**: Ubuntu 24.04

---

## ⚡ БЫСТРЫЙ ДЕПЛОЙ (5 минут)

### 1. Подключение к серверу
```bash
ssh root@141.98.188.75
```

### 2. Установка зависимостей
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
```

### 3. Загрузка проекта

**Вариант A: Через Git**
```bash
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator
git clone https://github.com/Zymass/tax-scan.git
cd tax-scan  # Переходим в директорию проекта
```

**Вариант B: Через SCP (с локального компьютера)**
```bash
# На вашем компьютере:
cd /Users/iliafiliaev/Develop/TaxCalculator
tar -czf taxcalculator.tar.gz --exclude='node_modules' --exclude='.git' --exclude='backend/dist' --exclude='frontend/dist' --exclude='backend/prisma/dev.db' backend/ frontend/
scp taxcalculator.tar.gz root@141.98.188.75:/tmp/

# На сервере:
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator
tar -xzf /tmp/taxcalculator.tar.gz
```

### 4. Настройка Backend
```bash
cd /var/www/taxcalculator/tax-scan/backend

# Создаем .env
cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="production"
PORT=3000
BACKEND_URL="http://141.98.188.75:3000"
FRONTEND_URL="http://141.98.188.75"
JWT_SECRET="$(openssl rand -base64 32)"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://141.98.188.75/api/auth/google/callback"
EOF

npm install  # Устанавливаем все зависимости (включая dev для сборки TypeScript)
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/app.js --name taxcalculator-backend
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2
```

### 5. Настройка Frontend
```bash
cd /var/www/taxcalculator/tax-scan/frontend

# Создаем .env
echo 'VITE_API_URL=http://141.98.188.75:3000/api' > .env

npm install
npm run build
```

### 6. Настройка Nginx
```bash
cat > /etc/nginx/sites-available/taxcalculator << 'EOF'
server {
    listen 80;
    server_name 141.98.188.75;

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

ln -s /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 7. Настройка Firewall
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 8. Проверка
```bash
# Проверка backend
curl http://localhost:3000/health

# Проверка PM2
pm2 status

# Проверка nginx
systemctl status nginx
```

Откройте в браузере: **http://141.98.188.75**

---

## 🔄 ОБНОВЛЕНИЕ ПРОЕКТА

```bash
cd /var/www/taxcalculator/tax-scan

# Если используете Git:
git pull origin main

# Обновляем backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart taxcalculator-backend

# Обновляем frontend
cd ../frontend
npm install
npm run build
```

---

## 📊 УПРАВЛЕНИЕ

```bash
# Просмотр логов backend
pm2 logs taxcalculator-backend

# Перезапуск backend
pm2 restart taxcalculator-backend

# Остановка backend
pm2 stop taxcalculator-backend

# Перезагрузка nginx
systemctl reload nginx

# Просмотр логов nginx
tail -f /var/log/nginx/error.log
```

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### Backend не запускается
```bash
pm2 logs taxcalculator-backend
cd /var/www/taxcalculator/tax-scan/backend
cat .env  # Проверьте переменные окружения
```

### Ошибка сборки TypeScript (отсутствуют типы)
```bash
cd /var/www/taxcalculator/tax-scan/backend
npm install  # Убедитесь, что установлены все зависимости включая devDependencies
npm install --save-dev @types/cors  # Если конкретно не хватает @types/cors
npm run build
```

### Frontend не загружается
```bash
ls -la /var/www/taxcalculator/tax-scan/frontend/dist/  # Проверьте сборку
tail -f /var/log/nginx/error.log  # Проверьте логи nginx
```

### Порт занят
```bash
lsof -ti:3000  # Найти процесс
kill -9 $(lsof -ti:3000)  # Убить процесс
```

---

## 📚 ПОЛНАЯ ДОКУМЕНТАЦИЯ

Подробное руководство: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
