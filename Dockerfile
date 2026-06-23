FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl python3 make g++

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY apps/api/ ./apps/api/

RUN cd apps/api && npx prisma generate --schema=./prisma/schema.prisma

RUN cd node_modules/.pnpm/bcrypt@5.1.1_encoding@0.1.13/node_modules/bcrypt && npm rebuild bcrypt --build-from-source 2>/dev/null || npx node-pre-gyp install --fallback-to-build

WORKDIR /app/apps/api

RUN npx nest build

EXPOSE 3000

CMD ["node", "dist/main.js"]
