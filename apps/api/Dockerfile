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

# Copy API package manifest and install dependencies
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=apps/api

# Generate Prisma client
RUN npx prisma generate --schema=prisma/primary/schema.prisma

# Copy source
COPY apps/api/ ./apps/api/

ENV NODE_ENV=production
WORKDIR /app/apps/api

CMD ["npx", "tsx", "src/main.ts"]
