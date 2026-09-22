# ============================================================================
# SAHAY Platform - Multi-Stage Production Dockerfile
# Node.js 24 Alpine (includes native node:sqlite DatabaseSync)
# ============================================================================

# --- Stage 1: Build & Dependencies ---
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp if any, and build tools
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package*.json ./

# Clean install all dependencies (including devDependencies for Astro build)
RUN npm ci

# Copy full application source code
COPY . .

# Build the Astro SSR application (standalone Node server in ./dist)
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Install libc compatibility for Alpine
RUN apk add --no-cache libc6-compat

# Copy production package descriptors & install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built server assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Create data directory for sahay.db SQLite database.
# Persistence comes from the host platform, not a Dockerfile VOLUME:
#   - Railway: attach a Railway Volume mounted at /app/data (Railway rejects VOLUME).
#   - Docker Compose: ./data:/app/data bind mount in docker-compose.yml.
# DATA_DIR overrides the location if the volume is mounted elsewhere.
RUN mkdir -p /app/data && chown -R node:node /app/data

# Run as non-privileged node user for security.
# Railway mounts volumes as root; set RAILWAY_RUN_UID=0 on the service if the
# app cannot write to /app/data.
USER node

EXPOSE 4321

# Launch the standalone Astro Node SSR entrypoint
CMD ["node", "./dist/server/entry.mjs"]
