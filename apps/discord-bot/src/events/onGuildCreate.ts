import {
    ChannelType,
    ContainerBuilder,
    Guild,
    MessageFlags,
    PermissionsBitField,
    TextChannel,
    TextDisplayBuilder,
} from 'discord.js';

export default async function onGuildCreate(guild: Guild): Promise<void> {
    try {
        const channel = resolveWelcomeChannel(guild);
        if (!channel) {
            console.log(`Joined guild ${guild.id} but found no sendable channel for welcome message.`);
            return;
        }

        const welcome = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Hi, I'm Echo\n\nI handle activity logs, events, and updates for your server.\n\nTo get started, an admin should run **/server den set** in any channel to choose where I'm allowed to post.`,
            ),
        );

        await channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [welcome],
        });
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
