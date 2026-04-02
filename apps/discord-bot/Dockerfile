# Build context must be the repo root:
#   docker build -f apps/discord-bot/Dockerfile .
# Or use the root docker-compose.yml which sets context automatically.

FROM node:24-alpine
WORKDIR /app

# Copy prisma schemas (needed for type generation)
COPY prisma/ ./prisma/

# Copy workspace root manifests
COPY package.json ./

# Copy bot package manifest and install dependencies
COPY apps/discord-bot/package.json ./apps/discord-bot/
RUN npm install --workspace=apps/discord-bot

# Generate Prisma client (types only — no DB connection at runtime)
RUN npx prisma generate --schema=prisma/primary/schema.prisma

# Copy source
COPY apps/discord-bot/ ./apps/discord-bot/

ENV NODE_ENV=production
WORKDIR /app/apps/discord-bot

CMD ["npx", "tsx", "src/index.ts"]
