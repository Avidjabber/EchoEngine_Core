import 'dotenv/config';
import { client } from './core/client';
import interactionCreate from './events/interactionCreate';
import onReady from './events/onReady';
import onGuildCreate from './events/onGuildCreate';
import { startInternalServer } from './internal/server';
import { apiClient } from './services/api/apiClient';

// ── Timestamps on all console output ──────────────────────────────────────────
const timestamp = () => new Date().toISOString();
const _log = console.log.bind(console);
const _error = console.error.bind(console);
console.log = (...args: unknown[]) => _log(`[${timestamp()}]`, ...args);
console.error = (...args: unknown[]) => _error(`[${timestamp()}]`, ...args);

// ── Commands collection ────────────────────────────────────────────────────────
client.commands = new Map();

// ── Events ────────────────────────────────────────────────────────────────────
client.once('clientReady', () => {
    onReady(client).catch(err => console.error('Error in onReady:', err));
    startInternalServer(client, Number(process.env.INTERNAL_PORT ?? 4000));
});

client.on('guildCreate', guild =>
    onGuildCreate(guild).catch(err => console.error('Error in onGuildCreate:', err)),
);

client.on('interactionCreate', async interaction => {
    try {
        await interactionCreate(interaction, client);
    } catch (err) {
        console.error('Unhandled error in interactionCreate:', err);
    }
});

// ── Startup auth check ────────────────────────────────────────────────────────
console.log('[startup] Authenticating with API...');
apiClient.authenticate().then(() => {
    console.log('[startup] Authenticated successfully.');
    // ── Login ─────────────────────────────────────────────────────────────────
    client.login(process.env.BOT_TOKEN);
}).catch(err => {
    console.error('[startup] Authentication failed — check BOT_CLIENT_ID and BOT_CLIENT_SECRET in .env');
    console.error(err);
    process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    client.destroy();
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
