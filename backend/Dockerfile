FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --include=dev
COPY prisma ./prisma
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
