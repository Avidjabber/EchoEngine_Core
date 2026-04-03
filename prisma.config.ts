import { defineConfig } from 'prisma/config'
import { resolve } from 'path'

// Load .env for local dev; silently skipped if dotenv isn't available (e.g. Docker build stage)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: resolve(process.cwd(), 'apps/api/.env') })
} catch {}

export default defineConfig({
  schema: 'prisma/primary/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL_PRIMARY!,
  },
})
