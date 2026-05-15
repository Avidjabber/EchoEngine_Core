import 'dotenv/config';
import { api } from './services/api.js';

async function main() {
  console.log('[startup] Authenticating with API...');
  try {
    await api.authenticate();
    console.log('[startup] Authenticated successfully.');
    try {
      await api.post('/worker/ping');
      console.log('[startup] Pipeline ping sent.');
    } catch {
      console.warn('[startup] Pipeline ping failed — bot may not be up yet.');
    }
  } catch (err) {
    console.error('[startup] Authentication failed — check WORKER_CLIENT_ID and WORKER_CLIENT_SECRET in .env');
    console.error(err);
    process.exit(1);
  }

  await import('./core/ticker.js');
}

main();
