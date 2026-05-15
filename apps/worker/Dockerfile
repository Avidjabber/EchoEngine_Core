# Build context must be the repo root:
#   docker build -f apps/worker/Dockerfile .
# Or use the root docker-compose.yml which sets context automatically.

FROM node:24-alpine
WORKDIR /app

COPY tsconfig.base.json ./

# Copy workspace root manifests
COPY package.json ./

# Copy worker package manifest and install dependencies
COPY apps/worker/package.json ./apps/worker/
RUN npm install --workspace=apps/worker

# Copy source
COPY apps/worker/ ./apps/worker/

WORKDIR /app/apps/worker
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
