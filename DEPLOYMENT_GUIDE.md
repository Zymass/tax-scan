# РУКОВОДСТВО ПО ДЕПЛОЮ НА СЕРВЕР

## 📋 Информация о сервере

- **IP адрес**: 141.98.188.75
- **ОС**: Ubuntu 24.04
- **Характеристики**: 2 vCPU / 2GB RAM / 40GB

---

## 🚀 ШАГ 1: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ

```bash
# Подключитесь к серверу по SSH
ssh root@141.98.188.75
# или если есть другой пользователь:
# ssh username@141.98.188.75
```

---

## 🔧 ШАГ 2: УСТАНОВКА НЕОБХОДИМЫХ ПАКЕТОВ

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверяем версии
node --version  # Должно быть v20.x.x
npm --version   # Должно быть 10.x.x

# Устанавливаем PM2 для управления процессами
npm install -g pm2

# Устанавливаем nginx (для reverse proxy)
apt install -y nginx

# Устанавливаем git (если еще не установлен)
apt install -y git
```

---

## 📦 ШАГ 3: ЗАГРУЗКА ПРОЕКТА НА СЕРВЕР

### Вариант A: Через Git (рекомендуется)

```bash
# Создаем директорию для проекта
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator

# Клонируем репозиторий (замените на ваш URL)
git clone https://github.com/your-username/TaxCalculator.git .

# Или если репозиторий приватный, используйте SSH ключ
```

### Вариант B: Через SCP (если нет Git)

На вашем локальном компьютере:

```bash
# Создаем архив проекта (исключая node_modules и другие ненужные файлы)
cd /Users/iliafiliaev/Develop/TaxCalculator
tar -czf taxcalculator.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backend/dist' \
  --exclude='frontend/dist' \
  --exclude='backend/prisma/dev.db' \
  --exclude='.env' \
  backend/ frontend/ package.json

# Загружаем на сервер
scp taxcalculator.tar.gz root@141.98.188.75:/var/www/

# На сервере распаковываем
ssh root@141.98.188.75
cd /var/www
mkdir -p taxcalculator
tar -xzf taxcalculator.tar.gz -C taxcalculator
cd taxcalculator
```

---

## ⚙️ ШАГ 4: НАСТРОЙКА BACKEND

```bash
cd /var/www/taxcalculator/backend

# Устанавливаем зависимости
npm install

# Создаем .env файл
nano .env
```

### Содержимое `.env` файла для backend:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
NODE_ENV="production"
PORT=3000
BACKEND_URL="http://141.98.188.75:3000"

# Frontend URL для CORS
FRONTEND_URL="http://141.98.188.75"

# JWT Secret (сгенерируйте случайную строку)
# Можно сгенерировать командой: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Google OAuth (опционально - оставьте пустым, если не используете)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://141.98.188.75/api/auth/google/callback"

# Email (опционально - оставьте пустым, если не используете)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**Важно:** 
- Замените `JWT_SECRET` на случайную строку (можно сгенерировать: `openssl rand -base64 32`)
- Если не используете Google OAuth, можете оставить эти переменные пустыми
- Если не используете email, можете оставить SMTP переменные пустыми

```bash
# Генерируем Prisma Client
npx prisma generate

# Запускаем миграции
npx prisma migrate deploy

# Собираем TypeScript
npm run build
```

---

## 🎨 ШАГ 5: НАСТРОЙКА FRONTEND

```bash
cd /var/www/taxcalculator/frontend

# Устанавливаем зависимости
npm install

# Создаем .env файл
nano .env
```

### Содержимое `.env` файла для frontend:

```env
VITE_API_URL=http://141.98.188.75:3000/api
```

**Примечание:** Если вы используете домен вместо IP, замените `141.98.188.75` на ваш домен.

```bash
# Собираем production версию
npm run build

# Проверяем, что dist папка создана
ls -la dist/
```

---

## 🚀 ШАГ 6: ЗАПУСК ПРИЛОЖЕНИЯ С PM2

### Запуск Backend

```bash
cd /var/www/taxcalculator/backend

# Запускаем backend через PM2
pm2 start dist/app.js --name taxcalculator-backend

# Или если используете tsx в production:
# pm2 start npm --name taxcalculator-backend -- run start

# Сохраняем конфигурацию PM2
pm2 save

# Настраиваем автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

### Запуск Frontend (через nginx, см. шаг 7)

---

## 🌐 ШАГ 7: НАСТРОЙКА NGINX

```bash
# Создаем конфигурацию для nginx
nano /etc/nginx/sites-available/taxcalculator
```

### Содержимое конфигурации nginx:

```nginx
server {
    listen 80;
    server_name 141.98.188.75;

    # Frontend (статичные файлы)
    location / {
        root /var/www/taxcalculator/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
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

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

```bash
# Активируем конфигурацию
ln -s /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию (опционально)
rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию nginx
nginx -t

# Перезапускаем nginx
systemctl restart nginx

# Проверяем статус
systemctl status nginx
```

---

## 🔒 ШАГ 8: НАСТРОЙКА FIREWALL

```bash
# Разрешаем HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Разрешаем SSH (важно!)
ufw allow 22/tcp

# Включаем firewall
ufw enable

# Проверяем статус
ufw status
```

---

## ✅ ШАГ 9: ПРОВЕРКА РАБОТЫ

1. **Проверьте backend**: `http://141.98.188.75/health`
   - Должен вернуть: `{"status":"ok","timestamp":"..."}`

2. **Проверьте frontend**: `http://141.98.188.75`
   - Должна открыться главная страница

3. **Проверьте API**: `http://141.98.188.75/api/health`
   - Должен вернуть тот же ответ

---

## 📊 УПРАВЛЕНИЕ ПРОЦЕССАМИ

```bash
# Просмотр статуса процессов
pm2 status

# Просмотр логов backend
pm2 logs taxcalculator-backend

# Перезапуск backend
pm2 restart taxcalculator-backend

# Остановка backend
pm2 stop taxcalculator-backend

# Удаление из PM2
pm2 delete taxcalculator-backend
```

---

## 🔄 ОБНОВЛЕНИЕ ПРОЕКТА

```bash
# Переходим в директорию проекта
cd /var/www/taxcalculator

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
# Nginx автоматически будет отдавать новые файлы
```

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### Backend не запускается

```bash
# Проверьте логи
pm2 logs taxcalculator-backend

# Проверьте, что порт 3000 свободен
netstat -tulpn | grep 3000

# Проверьте переменные окружения
cd /var/www/taxcalculator/backend
cat .env
```

### Frontend не загружается

```bash
# Проверьте логи nginx
tail -f /var/log/nginx/error.log

# Проверьте, что файлы собраны
ls -la /var/www/taxcalculator/frontend/dist/

# Проверьте права доступа
chown -R www-data:www-data /var/www/taxcalculator/frontend/dist
```

### База данных не работает

```bash
# Проверьте путь к базе данных
cd /var/www/taxcalculator/backend
ls -la prisma/dev.db

# Проверьте права доступа
chmod 664 prisma/dev.db
chown -R $USER:$USER prisma/
```

---

## 🔐 ДОПОЛНИТЕЛЬНАЯ БЕЗОПАСНОСТЬ (опционально)

### Настройка SSL через Let's Encrypt

```bash
# Устанавливаем Certbot
apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат (замените на ваш домен)
certbot --nginx -d yourdomain.com

# Автоматическое обновление сертификата
certbot renew --dry-run
```

### Настройка домена

1. В настройках DNS вашего домена добавьте A-запись:
   - `@` → `141.98.188.75`
   - `www` → `141.98.188.75`

2. Обновите конфигурацию nginx, заменив `141.98.188.75` на ваш домен

---

## 🤖 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ (АЛЬТЕРНАТИВА)

Если у вас настроен SSH доступ к серверу, вы можете использовать скрипт `deploy.sh`:

```bash
# На вашем локальном компьютере
cd /Users/iliafiliaev/Develop/TaxCalculator
./deploy.sh root@141.98.188.75
```

Скрипт автоматически:
- Создает архив проекта (исключая node_modules, .git и т.д.)
- Загружает на сервер
- Устанавливает зависимости
- Собирает проект
- Перезапускает PM2

**Важно:** После автоматического деплоя не забудьте создать `.env` файлы вручную (см. шаги 4 и 5).

---

## 📝 БЫСТРАЯ КОМАНДА ДЛЯ ПЕРВОГО ЗАПУСКА

```bash
# Выполните все команды последовательно:

# 1. Установка зависимостей системы
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2

# 2. Создание директории и загрузка проекта
mkdir -p /var/www/taxcalculator
cd /var/www/taxcalculator
# Загрузите проект (git clone или scp)

# 3. Backend
cd backend
npm install
nano .env  # Создайте .env файл (см. выше)
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/app.js --name taxcalculator-backend
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2

# 4. Frontend
cd ../frontend
npm install
nano .env  # Создайте .env файл (см. выше)
npm run build

# 5. Nginx
nano /etc/nginx/sites-available/taxcalculator  # Создайте конфиг (см. выше)
ln -s /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 6. Firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

---

## ✅ ПРОВЕРКА

После выполнения всех шагов проверьте:

1. ✅ Backend работает: `curl http://localhost:3000/health`
2. ✅ PM2 запущен: `pm2 status`
3. ✅ Nginx работает: `systemctl status nginx`
4. ✅ Сайт доступен: Откройте `http://141.98.188.75` в браузере

---

## 📞 ПОЛЕЗНЫЕ КОМАНДЫ

```bash
# Просмотр всех процессов Node.js
pm2 list

# Мониторинг в реальном времени
pm2 monit

# Просмотр логов всех процессов
pm2 logs

# Перезагрузка nginx
systemctl reload nginx

# Просмотр использования ресурсов
htop
# или
top
```

---

Готово! Ваш проект должен быть доступен по адресу `http://141.98.188.75`
