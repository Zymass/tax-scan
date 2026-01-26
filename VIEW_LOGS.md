# 📊 Просмотр логов использования

## 1. Аналитика через веб-интерфейс (рекомендуется)

Откройте в браузере:
```
http://your-domain.com/analytics
```

Или через IP:
```
http://your-server-ip/analytics
```

На странице аналитики вы увидите:
- Общее количество пользователей
- Новых пользователей за период
- Общее количество расчетов
- Новых расчетов за период
- Завершенных расчетов
- Графики расчетов по дням
- Графики новых пользователей по дням
- Расчеты по статусам
- Расчеты по налоговым режимам

Можно фильтровать по датам (начало/конец периода).

## 2. Аналитика через API

```bash
# На сервере или с локального компьютера
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-server-ip:3000/api/analytics/stats

# С фильтром по датам
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://your-server-ip:3000/api/analytics/stats?startDate=2026-01-01&endDate=2026-01-31"
```

## 3. PM2 логи приложения

### Просмотр всех логов
```bash
pm2 logs taxcalculator-backend
```

### Последние 100 строк
```bash
pm2 logs taxcalculator-backend --lines 100
```

### Только ошибки
```bash
pm2 logs taxcalculator-backend --err --lines 50
```

### Только успешные запросы
```bash
pm2 logs taxcalculator-backend --out --lines 50
```

### Поиск по логам
```bash
# Поиск PDF генерации
pm2 logs taxcalculator-backend --lines 200 | grep -E "\[PDF|Puppeteer"

# Поиск ошибок
pm2 logs taxcalculator-backend --lines 200 | grep -i error

# Поиск регистраций
pm2 logs taxcalculator-backend --lines 200 | grep -i register

# Поиск входов
pm2 logs taxcalculator-backend --lines 200 | grep -i login
```

### Просмотр логов из файлов
```bash
# Логи успешных операций
tail -f /var/log/pm2/taxcalculator-backend-out.log

# Логи ошибок
tail -f /var/log/pm2/taxcalculator-backend-error.log

# Последние 100 строк
tail -n 100 /var/log/pm2/taxcalculator-backend-out.log
```

## 4. Nginx логи доступа (для подсчета всех посетителей)

### Логи доступа
```bash
# Просмотр логов доступа
tail -f /var/log/nginx/access.log

# Последние 100 запросов
tail -n 100 /var/log/nginx/access.log

# Поиск по IP
grep "IP_ADDRESS" /var/log/nginx/access.log

# Подсчет запросов
grep "GET /api" /var/log/nginx/access.log | wc -l
```

### Подсчет уникальных посетителей

```bash
# Уникальные IP адреса за все время
awk '{print $1}' /var/log/nginx/access.log | sort -u | wc -l

# Уникальные посетители за сегодня
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $1}' | sort -u | wc -l

# Уникальные посетители за конкретную дату (например, 26/Jan/2026)
grep "26/Jan/2026" /var/log/nginx/access.log | awk '{print $1}' | sort -u | wc -l

# Уникальные посетители за последние 7 дней
for i in {0..6}; do
  date=$(date -d "$i days ago" +%d/%b/%Y)
  count=$(grep "$date" /var/log/nginx/access.log 2>/dev/null | awk '{print $1}' | sort -u | wc -l)
  echo "$date: $count уникальных посетителей"
done

# Уникальные посетители за последние 30 дней
for i in {0..29}; do
  date=$(date -d "$i days ago" +%d/%b/%Y)
  count=$(grep "$date" /var/log/nginx/access.log 2>/dev/null | awk '{print $1}' | sort -u | wc -l)
  echo "$date: $count уникальных посетителей"
done

# Топ 10 самых активных IP адресов
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Количество посещений главной страницы (не API)
grep "GET / " /var/log/nginx/access.log | wc -l

# Количество посещений калькулятора
grep "GET /calculator" /var/log/nginx/access.log | wc -l

# Уникальные посетители калькулятора за сегодня
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | grep "GET /calculator" | awk '{print $1}' | sort -u | wc -l
```

### Логи ошибок Nginx
```bash
tail -f /var/log/nginx/error.log
```

## 5. Прямой запрос к базе данных

```bash
cd /var/www/taxcalculator/tax-scan/backend

# Подсчет пользователей
npx prisma studio
# Откроется веб-интерфейс для просмотра БД

# Или через SQLite напрямую
sqlite3 prisma/prod.db "SELECT COUNT(*) FROM User WHERE deleted_at IS NULL;"

# Подсчет расчетов
sqlite3 prisma/prod.db "SELECT COUNT(*) FROM Calculation WHERE deleted_at IS NULL;"

# Новые пользователи за сегодня
sqlite3 prisma/prod.db "SELECT COUNT(*) FROM User WHERE DATE(created_at) = DATE('now');"

# Новые расчеты за сегодня
sqlite3 prisma/prod.db "SELECT COUNT(*) FROM Calculation WHERE DATE(created_at) = DATE('now');"
```

## 6. Мониторинг в реальном времени

### PM2 мониторинг
```bash
# Интерактивный мониторинг
pm2 monit

# Статус приложения
pm2 status

# Детальная информация
pm2 show taxcalculator-backend
```

### Просмотр логов в реальном времени
```bash
# PM2 логи
pm2 logs taxcalculator-backend --lines 0

# Nginx логи
tail -f /var/log/nginx/access.log
```

## 7. Полезные команды для анализа

```bash
# Количество уникальных IP за сегодня
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $1}' | sort -u | wc -l

# Топ 10 самых активных IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Количество запросов к API за сегодня
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | grep "/api" | wc -l

# Статистика по методам HTTP
awk '{print $6}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Общая статистика посещений
echo "=== Статистика посещений ==="
echo "Всего уникальных посетителей: $(awk '{print $1}' /var/log/nginx/access.log | sort -u | wc -l)"
echo "Посетителей за сегодня: $(grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $1}' | sort -u | wc -l)"
echo "Всего запросов: $(wc -l < /var/log/nginx/access.log)"
echo "Запросов за сегодня: $(grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | wc -l)"
```

## 8. Экспорт логов

```bash
# Экспорт PM2 логов в файл
pm2 logs taxcalculator-backend --lines 1000 --nostream > /tmp/backend-logs.txt

# Экспорт Nginx логов за сегодня
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log > /tmp/nginx-today.log
```
