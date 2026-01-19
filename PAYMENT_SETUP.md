# Настройка онлайн-кассы (ЮKassa)

## Требования

Для работы платежной системы необходимо:

1. Установить зависимости:
```bash
cd backend
npm install @yookassa/sdk
```

2. Зарегистрироваться в ЮKassa:
   - Перейдите на https://yookassa.ru/
   - Создайте магазин
   - Получите Shop ID и Secret Key

3. Добавить переменные окружения в `backend/.env`:

```env
# YooKassa (Яндекс.Касса)
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Цена за расчет (в рублях)
PRICE_PER_CALCULATION=100

# URL для возврата после оплаты
FRONTEND_URL=http://localhost:5173
```

4. Настроить Webhook в личном кабинете ЮKassa:
   - URL: `https://yourdomain.com/api/payment/webhook`
   - События: `payment.succeeded`, `payment.canceled`

5. Выполнить миграцию базы данных:

```bash
cd backend
npx prisma migrate dev --name add_payments
```

## Как это работает

1. Пользователь нажимает "Купить расчеты" в личном кабинете
2. Выбирает количество расчетов (5, 10 или 20)
3. Создается платеж в ЮKassa
4. Пользователь перенаправляется на страницу оплаты ЮKassa
5. После успешной оплаты ЮKassa отправляет webhook на сервер
6. Сервер увеличивает лимит расчетов пользователя
7. Пользователь возвращается на сайт с обновленным лимитом

## Модель Payment

- `id` - внутренний ID платежа
- `payment_id` - ID платежа в ЮKassa
- `user_id` - ID пользователя
- `amount` - сумма платежа
- `status` - статус (pending, succeeded, canceled, failed)
- `calculations_added` - количество расчетов, добавленных после оплаты
- `paid_at` - дата оплаты

## API Endpoints

- `POST /api/payment/create` - создание платежа (требует авторизации)
- `POST /api/payment/webhook` - обработка webhook от ЮKassa
- `GET /api/payment/status/:paymentId` - проверка статуса платежа
- `GET /api/payment/history` - история платежей пользователя

## Тестовый режим

Если YooKassa не настроен, система работает в тестовом режиме:
- Платежи создаются, но не обрабатываются
- Лимит расчетов не увеличивается
- Показывается предупреждение пользователю

## Безопасность

- Webhook должен проверять подпись от ЮKassa (рекомендуется добавить)
- Все платежные операции требуют авторизации
- Рекомендуется добавить rate limiting для webhook
