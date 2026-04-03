import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'discord.js';
import { loadCommands } from '../handlers/loadCommands';
import { deployCommands } from '../handlers/deploy';
import { setBotPresence } from '../core/presence';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function onReady(client: Client): Promise<void> {
    console.log(`Logged in as ${client.user!.tag}`);

    const commandsDir = path.join(__dirname, '..', 'commands');
    const commands = await loadCommands(commandsDir, client);

    if (process.env.DEPLOY === 'true') {
        await deployCommands(
            commands,
            process.env.DEBUG === 'true',
            process.env.CLIENT_ID!,
            process.env.GUILD_ID,
        );
    }

    setBotPresence(client, {
        status: process.env.BOT_STATUS,
        activity: process.env.BOT_ACTIVITY_TEXT,
        type: process.env.BOT_ACTIVITY_TYPE,
    });
}
