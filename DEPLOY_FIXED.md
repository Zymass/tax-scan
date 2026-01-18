# 🚀 Исправленная инструкция деплоя

## Проблема: директория не существует на сервере

## Решение: создайте директорию сначала

### Шаг 1: Создание директорий на сервере

```bash
# Подключитесь к серверу (пароль: 12345678)
ssh root@94.131.110.30 "mkdir -p /var/www/taxcalculator/backend /var/www/taxcalculator/frontend /var/log/pm2"
```

### Шаг 2: Загрузка файлов

```bash
cd /Users/iliafiliaev/Develop/TaxCalculator

# Загрузка бэкенда (пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/

# Загрузка фронтенда (пароль: 12345678)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/

# Загрузка конфигураций (пароль: 12345678)
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf
scp server-setup.sh root@94.131.110.30:/tmp/server-setup.sh
```

### Шаг 3: Настройка на сервере

```bash
# Выполните настройку (пароль: 12345678)
ssh root@94.131.110.30 'bash /tmp/server-setup.sh'
```

---

## Или все в одной команде:

```bash
cd /Users/iliafiliaev/Develop/TaxCalculator

# Создание директорий и загрузка файлов
ssh root@94.131.110.30 "mkdir -p /var/www/taxcalculator/backend /var/www/taxcalculator/frontend /var/log/pm2" && \
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./backend/ root@94.131.110.30:/var/www/taxcalculator/backend/ && \
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
  ./frontend/ root@94.131.110.30:/var/www/taxcalculator/frontend/ && \
scp backend/ecosystem.config.js root@94.131.110.30:/var/www/taxcalculator/backend/ && \
scp nginx.conf root@94.131.110.30:/tmp/nginx-taxcalculator.conf && \
scp server-setup.sh root@94.131.110.30:/tmp/server-setup.sh && \
ssh root@94.131.110.30 'bash /tmp/server-setup.sh'
```
