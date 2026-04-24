import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

// Extend the Client type to include our commands collection
declare module 'discord.js' {
    interface Client {
        commands: Map<string, CommandModule>;
    }
}

export interface CommandModule {
    data: { name: string; toJSON?: () => object };
    execute: (interaction: unknown) => Promise<void>;
    autocomplete?: (interaction: unknown) => Promise<void>;
    usesModal?: boolean;
    modalSubcommands?: Set<string>;
    publicSubcommands?: Set<string>;
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
    ],
});
