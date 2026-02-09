FROM node:25-alpine3.22

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --frozen-lockfile

COPY backend ./backend
WORKDIR /app/backend

EXPOSE 3000
CMD ["pnpm", "dev"]