# Build context must be the repo root:
#   docker build -f apps/api/Dockerfile .
# Or use the root docker-compose.yml which sets context automatically.

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Copy prisma schemas (needed for generation)
COPY prisma/ ./prisma/

# Copy workspace root manifests
COPY package.json ./

# Copy API package manifest and install dependencies
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=apps/api

# Generate Prisma client
RUN npx prisma generate --schema=prisma/primary/schema.prisma

# Copy API source and build
COPY apps/api/ ./apps/api/
WORKDIR /app/apps/api
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules_root

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/main"]
