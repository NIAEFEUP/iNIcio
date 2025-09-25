# Base image
FROM node:22.12.0-alpine AS base
WORKDIR /app
RUN npm install -g corepack@latest

# ----------------------------------------
# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json ./ 
COPY package-lock.json ./
RUN npm ci --include=dev

# ----------------------------------------
# Development stage
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ----------------------------------------
# Build stage with content vars (GH secrets)
FROM base AS prod-build-with-content-vars
ARG INICIO_VARS_CONTENT
RUN echo "${INICIO_VARS_CONTENT}" | base64 -d > .env

FROM prod-build-with-content-vars AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ----------------------------------------
# Production runtime
FROM base AS prod
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
