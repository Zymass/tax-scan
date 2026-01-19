# Настройка Google OAuth

## Требования

Для работы Google OAuth необходимо:

1. Установить зависимости:
```bash
cd backend
npm install passport passport-google-oauth20 @types/passport @types/passport-google-oauth20
```

2. Создать проект в Google Cloud Console:
   - Перейдите на https://console.cloud.google.com/
   - Создайте новый проект или выберите существующий
   - Включите Google+ API
   - Перейдите в "Credentials" → "Create Credentials" → "OAuth client ID"
   - Выберите "Web application"
   - Добавьте Authorized redirect URIs:
     - Для разработки: `http://localhost:3000/api/auth/google/callback`
     - Для продакшена: `https://yourdomain.com/api/auth/google/callback`

3. Добавить переменные окружения в `.env` файл backend:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

Для продакшена:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
BACKEND_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

4. Выполнить миграцию базы данных:

```bash
cd backend
npx prisma migrate dev --name add_google_oauth
```

Или для продакшена:
```bash
npx prisma migrate deploy
```

## Изменения в схеме базы данных

- `password_hash` теперь опциональный (для OAuth пользователей)
- Добавлено поле `google_id` (уникальный идентификатор Google)
- Добавлено поле `auth_provider` (по умолчанию "email", может быть "google")

## Как это работает

1. Пользователь нажимает "Войти через Google" на странице входа
2. Происходит редирект на Google для авторизации
3. После успешной авторизации Google перенаправляет на `/api/auth/google/callback`
4. Backend создает или находит пользователя и генерирует JWT токен
5. Пользователь перенаправляется на frontend с токеном в URL
6. Frontend сохраняет токен и перенаправляет на главную страницу

## Защищенные роуты

Все роуты `/api/calculations` и `/api/*` теперь требуют авторизации. 
Неавторизованные запросы вернут 401 ошибку.

## Frontend

Страницы `/calculator`, `/results/:id` и `/history` теперь защищены и требуют авторизации.
Неавторизованные пользователи будут перенаправлены на `/login`.
