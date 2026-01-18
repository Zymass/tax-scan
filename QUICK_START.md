# 🚀 Быстрый старт деплоя

## Вариант 1: Автоматический деплой (рекомендуется)

```bash
# Из корневой директории проекта
./quick-deploy.sh
```

Этот скрипт:
- ✅ Загрузит все файлы на сервер
- ✅ Установит зависимости
- ✅ Соберет проект
- ✅ Запустит через PM2
- ✅ Настроит базу данных

## Вариант 2: Пошаговый деплой

### 1. Подключитесь к серверу
```bash
ssh root@94.131.110.30
# Пароль: 12345678
```

### 2. На сервере выполните:

```bash
# Установка Node.js и PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
apt-get install -y nginx

# Создание директорий
mkdir -p /var/www/taxcalculator
mkdir -p /var/log/pm2
```

### 3. С локального компьютера загрузите проект:

```bash
# Из директории проекта
cd /Users/iliafiliaev/Develop/TaxCalculator

# Загрузка файлов
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# Загрузка конфигураций
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
```

### 4. На сервере настройте и запустите:

```bash
# Backend
cd /var/www/taxcalculator/backend
npm install --production
npx prisma generate

# Создание .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://vm3937869.example.com
EOF

npx prisma migrate deploy || npx prisma migrate dev --name init
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# PM2
cd ../backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2

# Nginx
cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator
ln -s /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl restart nginx
```

## ✅ Готово!

Откройте в браузере: **http://vm3937869.example.com**

## 📝 Полезные команды

```bash
# Логи приложения
pm2 logs taxcalculator-backend

# Перезапуск
pm2 restart taxcalculator-backend

# Статус
pm2 status

# Логи Nginx
tail -f /var/log/nginx/taxcalculator-error.log
```

## 🔒 Безопасность (важно!)

После деплоя обязательно:
1. Смените пароль root
2. Настройте SSH ключи
3. Установите SSL сертификат (Let's Encrypt)

```bash
# SSL сертификат
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d vm3937869.example.com
```
