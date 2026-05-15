# Build context must be the repo root:
#   docker build -f apps/api/Dockerfile .
# Or use the root docker-compose.yml which sets context automatically.

FROM node:24-alpine
WORKDIR /app

# Copy prisma schemas and config (needed for generation)
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.base.json ./

# Copy workspace root manifests
COPY package.json ./

# Copy shared package manifest and source (local workspace dep — not on npm)
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/ ./packages/shared/

# Copy API package manifest and install dependencies
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=apps/api

# Copy source (before prisma generate so generated files land inside src/)
COPY apps/api/ ./apps/api/

# Generate Prisma client into apps/api/src/generated/prisma-primary/
# Must run after source copy so it is not overwritten
RUN npx prisma generate --schema=prisma/primary/schema.prisma

WORKDIR /app/apps/api
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
