# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules if required
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for prisma CLI)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Prune development dependencies
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl/wget for container healthchecks
RUN apk add --no-cache curl wget

# Copy dependencies and generated prisma artifacts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Copy application source code
COPY --chown=node:node . .

# Run as non-root node user
USER node

EXPOSE 5000

# Container Healthcheck Probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/liveness || exit 1

CMD ["node", "src/server.js"]
