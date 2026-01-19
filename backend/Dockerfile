FROM node:18-alpine

WORKDIR /app

# Копируем конфиги
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код
COPY . .

# Генерируем клиент Prisma
RUN npx prisma generate

# Собираем (если есть TS) или просто оставляем для запуска
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]