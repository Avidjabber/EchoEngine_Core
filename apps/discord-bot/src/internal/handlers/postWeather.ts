import { Client, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { colors } from '../../core/colors';

interface WeatherState {
    codeName:      string;
    name:          string;
    isSevere:      boolean;
    envConditions: string[];
}

export interface PostWeatherPayload {
    channelId:           string;
    guildId:             string;
    currentWeatherState: WeatherState | null;
}

function formatConditionList(conditions: string[]): string {
    if (conditions.length === 1) return `**${conditions[0]}**`;
    if (conditions.length === 2) return `**${conditions[0]}** and **${conditions[1]}**`;
    const head = conditions.slice(0, -1).map(c => `**${c}**`).join(', ');
    return `${head}, and **${conditions[conditions.length - 1]}**`;
}

export async function handlePostWeather(client: Client, payload: PostWeatherPayload): Promise<void> {
    const channel = await client.channels.fetch(payload.channelId);
    if (!channel?.isSendable()) return;

    const curr = payload.currentWeatherState;
    const lines: string[] = [];

    lines.push(`The weather is now **${curr?.name ?? 'Clear'}**.`);

    if (curr && curr.envConditions.length > 0) {
        lines.push(`It is ${formatConditionList(curr.envConditions)}.`);
    }

    const container = new ContainerBuilder()
        .setAccentColor(curr?.isSevere ? colors.warning : colors.info)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join('\n')),
        );

    await channel.send({
        flags:      MessageFlags.IsComponentsV2,
        components: [container],
    });
}
