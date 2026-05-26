FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx tsc --project tsconfig.json

FROM node:20-alpine AS production
RUN apk add --no-cache openssl
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/
RUN npm ci --only=production
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --chown=node:node docker/entrypoint.sh ./entrypoint.sh
RUN npx prisma generate
EXPOSE 3333
ENTRYPOINT ["sh", "./entrypoint.sh"]