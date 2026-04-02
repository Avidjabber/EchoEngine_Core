import { ChannelType, Guild, PermissionsBitField, TextChannel } from 'discord.js';
import { messages } from '../core/messages';

export default async function onGuildCreate(guild: Guild): Promise<void> {
    try {
        const channel = resolveWelcomeChannel(guild);
        if (!channel) {
            console.log(`Joined guild ${guild.id} but found no sendable channel for welcome message.`);
            return;
        }
        await channel.send(messages.guildWelcome);
    } catch (err) {
        console.error(`Error sending welcome message to guild ${guild.id}:`, err);
    }
}

function resolveWelcomeChannel(guild: Guild): TextChannel | null {
    const sys = guild.systemChannel;
    if (sys && canSend(guild, sys)) return sys;

    return (
        guild.channels.cache
            .filter(
                (c): c is TextChannel =>
                    c.type === ChannelType.GuildText && canSend(guild, c as TextChannel),
            )
            .sort((a, b) => a.position - b.position)
            .first() ?? null
    );
}

function canSend(guild: Guild, channel: TextChannel): boolean {
    return (
        channel.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages) ??
        false
    );
}
