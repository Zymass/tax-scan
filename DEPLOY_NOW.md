# 🚀 Деплой прямо сейчас

## Выполните эти команды в вашем терминале:

### Шаг 1: Подготовка SSH

```bash
cd /Users/iliafiliaev/Develop/TaxCalculator

# Добавьте сервер в known_hosts
ssh-keyscan -H 94.131.110.30 >> ~/.ssh/known_hosts 2>/dev/null || true
```

### Шаг 2: Загрузка файлов

```bash
# Загрузка бэкенда (пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

# Загрузка фронтенда (пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# Загрузка конфигураций (пароль: 12345678)
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
```

### Шаг 3: Настройка на сервере

```bash
# Подключение к серверу (пароль: 12345678)
ssh root@94.131.110.30
```

### Шаг 4: На сервере выполните:

```bash
# Установка зависимостей системы
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
apt-get update && apt-get install -y nginx

# Создание директорий
mkdir -p /var/www/taxcalculator
mkdir -p /var/log/pm2

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

# База данных
npx prisma migrate deploy || npx prisma migrate dev --name init

# Сборка
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# PM2
cd ../backend
pm2 delete taxcalculator-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2

# Nginx
cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator
ln -sf /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# Проверка
pm2 status
curl http://localhost:3000/health
```

### Готово! 🎉

Откройте: **http://vm3937869.example.com**

---

## Или используйте одну команду (если установлен sshpass):

```bash
# Установка sshpass (если нужно)
brew install hudochenkov/sshpass/sshpass  # macOS

# Затем запустите:
./deploy-interactive.sh
```
