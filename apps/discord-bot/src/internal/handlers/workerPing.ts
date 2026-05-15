import { Client, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { apiClient } from '../../services/api/apiClient';
import { colors } from '../../core/colors';

interface EchoDen {
    channelId:    string;
    allowWorldSim: boolean;
}

export async function handleWorkerPing(client: Client): Promise<void> {
    const guildId = process.env.GUILD_ID?.trim();
    if (!guildId) return;

    const result = await apiClient.get<EchoDen[]>('/server/dens', { guildId });
    if (!result.success || !result.value) return;

    const den = result.value.find(d => d.allowWorldSim);
    if (!den) return;

    const channel = await client.channels.fetch(den.channelId);
    if (!channel?.isSendable()) return;

    const container = new ContainerBuilder()
        .setAccentColor(colors.success)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('Worker started successfully.'),
        );

    await channel.send({
        flags:      MessageFlags.IsComponentsV2,
        components: [container],
    });
}
