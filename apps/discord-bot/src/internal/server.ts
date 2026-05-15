import { createServer, type IncomingMessage } from 'node:http';
import * as crypto from 'node:crypto';
import type { Client } from 'discord.js';
import { handlePostWeather, type PostWeatherPayload } from './handlers/postWeather';
import { handleWorkerPing } from './handlers/workerPing';

function readBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString()));
            } catch {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

export function startInternalServer(client: Client, port: number): void {
    const secret = process.env.BOT_INTERNAL_SECRET ?? '';

    const server = createServer(async (req, res) => {
        if (req.method?.toUpperCase() === 'GET' && req.url?.split('?')[0] === '/health') {
            res.writeHead(200).end();
            return;
        }

        const auth     = req.headers['authorization'] ?? '';
        const expected = Buffer.from(`Bearer ${secret}`);
        const provided = Buffer.from(auth);
        const valid    = secret.length > 0 && provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
        if (!valid) {
            res.writeHead(401).end();
            return;
        }

        const method = req.method?.toUpperCase();
        const path   = req.url?.split('?')[0];

        try {
            if (method === 'POST' && path === '/internal/post-weather') {
                const body = await readBody(req);
                await handlePostWeather(client, body as PostWeatherPayload);
                res.writeHead(200).end();
                return;
            }

            if (method === 'POST' && path === '/internal/worker-ping') {
                await handleWorkerPing(client);
                res.writeHead(200).end();
                return;
            }

            res.writeHead(404).end();
        } catch (err) {
            console.error('[internal] Error handling request:', err);
            res.writeHead(500).end();
        }
    });

    server.listen(port, () => {
        console.log(`Internal server listening on port ${port}`);
    });
}
