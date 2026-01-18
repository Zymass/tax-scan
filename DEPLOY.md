# Инструкция по деплою TaxCalculator на VPS

## Информация о сервере
- **IP**: 94.131.110.30
- **Домен**: vm3937869.example.com
- **Пользователь**: root
- **Пароль**: 12345678

## Быстрый деплой (автоматический)

### Вариант 1: Использование скрипта деплоя

```bash
# Сделайте скрипт исполняемым
chmod +x deploy.sh

# Запустите деплой
./deploy.sh
```

### Вариант 2: Ручной деплой

## Шаг 1: Подключение к серверу

```bash
ssh root@94.131.110.30
# Пароль: 12345678
```

## Шаг 2: Подготовка сервера

```bash
# Обновление системы
apt-get update && apt-get upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Установка PM2
npm install -g pm2

# Установка Nginx
apt-get install -y nginx

# Создание директорий
mkdir -p /var/www/taxcalculator
mkdir -p /var/log/pm2
```

## Шаг 3: Загрузка проекта

### С локального компьютера:

```bash
# Из директории проекта
cd /Users/iliafiliaev/Develop/TaxCalculator

# Загрузка бэкенда
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

# Загрузка фронтенда
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# Загрузка конфигурационных файлов
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
```

## Шаг 4: Настройка на сервере

### На сервере выполните:

```bash
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

# Сборка TypeScript
npm run build

# Настройка фронтенда
cd ../frontend
npm install
npm run build
```

## Шаг 5: Настройка PM2

```bash
# Переместите конфигурацию
mv /var/www/taxcalculator/ecosystem.config.js /var/www/taxcalculator/backend/

# Запуск приложения
cd /var/www/taxcalculator/backend
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
# Выполните команду, которую выведет PM2
```

## Шаг 6: Настройка Nginx

```bash
# Копирование конфигурации
cp /tmp/nginx-taxcalculator.conf /etc/nginx/sites-available/taxcalculator

# Создание симлинка
ln -s /etc/nginx/sites-available/taxcalculator /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезапуск Nginx
systemctl restart nginx
systemctl enable nginx
```

## Шаг 7: Настройка файрвола (если нужно)

```bash
# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

## Проверка работы

1. **Проверка бэкенда:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Проверка PM2:**
   ```bash
   pm2 status
   pm2 logs taxcalculator-backend
   ```

3. **Проверка Nginx:**
   ```bash
   systemctl status nginx
   ```

4. **Откройте в браузере:**
   ```
   http://vm3937869.example.com
   ```

## Полезные команды

### PM2
```bash
pm2 status              # Статус приложений
pm2 logs                # Логи
pm2 restart all         # Перезапуск
pm2 stop all            # Остановка
pm2 delete all          # Удаление
```

### Nginx
```bash
nginx -t                # Проверка конфигурации
systemctl restart nginx # Перезапуск
systemctl status nginx  # Статус
tail -f /var/log/nginx/taxcalculator-error.log  # Логи ошибок
```

### Обновление проекта
```bash
# На локальном компьютере
./deploy.sh

# Или вручную:
rsync -avz --exclude 'node_modules' ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/
rsync -avz --exclude 'node_modules' ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# На сервере
cd /var/www/taxcalculator/backend
npm install --production
npm run build
pm2 restart taxcalculator-backend

cd ../frontend
npm install
npm run build
```

## Решение проблем

### Проблема: Приложение не запускается
```bash
# Проверьте логи
pm2 logs taxcalculator-backend --lines 50

# Проверьте .env файл
cat /var/www/taxcalculator/backend/.env

# Проверьте порт
netstat -tulpn | grep 3000
```

### Проблема: Nginx не работает
```bash
# Проверьте конфигурацию
nginx -t

# Проверьте логи
tail -f /var/log/nginx/error.log
```

### Проблема: База данных
```bash
cd /var/www/taxcalculator/backend
npx prisma migrate reset
npx prisma migrate deploy
```

## Безопасность

⚠️ **Важно:** После деплоя:
1. Смените пароль root
2. Настройте SSH ключи вместо пароля
3. Настройте SSL сертификат (Let's Encrypt)
4. Настройте регулярные бэкапы базы данных

### Настройка SSL (Let's Encrypt)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d vm3937869.example.com
```

## Мониторинг

```bash
# Мониторинг ресурсов
pm2 monit

# Статистика
pm2 list
```
