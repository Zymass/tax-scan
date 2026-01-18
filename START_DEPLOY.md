# 🚀 Быстрый старт деплоя

## Выполните команды по порядку в вашем терминале:

### 1️⃣ Загрузка файлов на сервер

```bash
cd /Users/iliafiliaev/Develop/TaxCalculator

# Загрузка бэкенда (введите пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

# Загрузка фронтенда (введите пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# Загрузка конфигураций (введите пароль: 12345678)
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
scp server-setup.sh root@94.131.110.30:/tmp/server-setup.sh
```

### 2️⃣ Настройка на сервере

```bash
# Подключение к серверу (введите пароль: 12345678)
ssh root@94.131.110.30

# На сервере выполните:
bash /tmp/server-setup.sh
```

### 3️⃣ Готово! 🎉

Откройте в браузере: **http://vm3937869.example.com**

---

## Альтернатива: Все в одной команде

Если хотите выполнить все команды на сервере сразу:

```bash
ssh root@94.131.110.30 'bash -s' < server-setup.sh
```

(Но сначала нужно загрузить файлы через rsync)

---

## Проверка работы

```bash
# Проверка бэкенда
ssh root@94.131.110.30 'curl http://localhost:3000/health'

# Статус PM2
ssh root@94.131.110.30 'pm2 status'

# Логи
ssh root@94.131.110.30 'pm2 logs taxcalculator-backend --lines 20'
```

---

## Если что-то пошло не так

```bash
# Перезапуск приложения
ssh root@94.131.110.30 'cd /var/www/taxcalculator/backend && pm2 restart taxcalculator-backend'

# Перезапуск Nginx
ssh root@94.131.110.30 'systemctl restart nginx'

# Проверка логов
ssh root@94.131.110.30 'tail -f /var/log/pm2/taxcalculator-backend-error.log'
```
