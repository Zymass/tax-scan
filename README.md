# Налоговый калькулятор 2026

Веб-приложение для расчета налоговой нагрузки для российских малого и среднего бизнеса с учетом изменений в налоговом законодательстве 2026 года.

## Запуск на удаленном сервере

См. [DEPLOY.md](./DEPLOY.md) для подробных инструкций по деплою на сервер.

## Структура проекта

```
tax-calculator/
├── backend/          # Express API
│   ├── src/
│   │   ├── api/      # Роуты
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/        # Схема БД
├── frontend/         # React приложение
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── utils/
└── docs/             # Документация
```

## Основные возможности

- ✅ Расчет налоговой нагрузки на 2025-2028 годы
- ✅ Сравнение различных режимов налогообложения
- ✅ Учет изменений в НДС и взносах с 2026 года
- ✅ Генерация PDF отчетов
- ✅ План действий для налогового планирования
- ✅ Сценарии "что если"

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

### Calculations
- `POST /api/calculations` - Создать расчет
- `GET /api/calculations` - Список расчетов
- `GET /api/calculations/:id` - Получить расчет
- `PUT /api/calculations/:id/step1-4` - Сохранить шаг
- `POST /api/calculations/:id/calculate` - Рассчитать
- `GET /api/calculations/:id/pdf` - Скачать PDF

## Лицензия

MIT
