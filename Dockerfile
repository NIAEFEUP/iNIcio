# ----------------------------------------
# Base image
# ----------------------------------------
FROM node:22.12.0-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ----------------------------------------
# Dependencies stage
# ----------------------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------------------
# Development stage
# ----------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ----------------------------------------
# Builder stage
# ----------------------------------------
FROM deps AS builder
ARG INICIO_VARS_CONTENT
RUN if [ -n "$INICIO_VARS_CONTENT" ]; then echo "${INICIO_VARS_CONTENT}" | base64 -d > .env; fi

COPY . .
RUN npm run build
RUN npm run db:migrate:bundle

# ----------------------------------------
# Production runtime
# ----------------------------------------
FROM base AS prod
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist/migrate.cjs ./migrate.cjs
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000

CMD node migrate.cjs && node server.js
