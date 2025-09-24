FROM node:22.12.0-alpine AS base

WORKDIR /app

RUN npm install -g corepack@latest

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json . 

COPY package-lock.json* .

RUN npm install

# Development environment run
FROM base AS dev

COPY --from=deps /app/node_modules ./node_modules

COPY . .

EXPOSE 3000

RUN npm run dev

# Build using GH secrets (for registry)
FROM base AS prod-build-with-content-vars

ARG INICIO_VARS_CONTENT
RUN echo "${INICIO_VARS_CONTENT}" | base64 -d > .env

# Build source code for production
FROM prod-build-with-content-vars AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS prod 
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/drizzle.config.json ./drizzle.config.json

USER nextjs
EXPOSE 3000
CMD npx drizzle-kit push && HOSTNAME="0.0.0.0" node server.js

