# Команды для выполнения на сервере

## Шаг 1: Проверка наличия файлов

```bash
# Проверьте, есть ли директория проекта
ls -la /var/www/taxcalculator/

# Если директории нет или она пустая, нужно загрузить файлы с локального компьютера
```

## Шаг 2: Если файлов нет - загрузите их

**В новом окне терминала на вашем компьютере** выполните:

```bash
cd /Users/iliafiliaev/Develop/TaxCalculator

# Загрузка файлов (пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
```

## Шаг 3: Настройка на сервере

**В терминале, где вы подключены к серверу**, выполните:

```bash
# Установка Node.js (если не установлен)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Установка PM2 (если не установлен)
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Установка Nginx (если не установлен)
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Создание директорий
mkdir -p /var/www/taxcalculator
mkdir -p /var/log/pm2

# Переход в директорию бэкенда
cd /var/www/taxcalculator/backend

# Установка зависимостей
npm install --production

# Генерация Prisma клиента
npx prisma generate

# Создание .env файла
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://vm3937869.example.com
EOF

# Миграция базы данных
npx prisma migrate deploy || npx prisma migrate dev --name init

# Сборка бэкенда
npm run build

# Настройка фронтенда
cd ../frontend
npm install
npm run build

# Запуск через PM2
cd ../backend

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

# Запуск приложения
pm2 delete taxcalculator-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Настройка автозапуска
pm2 startup
# Выполните команду, которую выведет PM2 (обычно что-то вроде: sudo env PATH=... pm2 startup systemd -u root --hp /root)

# Настройка Nginx
if [ -f /tmp/nginx-taxcalculator.conf ]; then
    cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator
    ln -sf /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
fi

# Проверка статуса
pm2 status
curl http://localhost:3000/health
```

## Готово! 🎉

Откройте: **http://vm3937869.example.com**
