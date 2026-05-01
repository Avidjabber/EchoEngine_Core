import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchWeatherStateTemplateData } from '../../../../services/model/weatherStatePackService';
import { generateWeatherStateTemplate } from '../../../../utils/generators/weatherStateTemplate';

function buildGuideComponents(): object[] {
    const guide = [
        `## How to Fill In Your Weather State Template`,
        ``,
        `**weather_states** — Define named weather conditions for this guild`,
        `-# \`code_name\` — Unique snake_case slug (e.g. \`heavy_rain\`, \`blizzard\`). This is the permanent identifier — changing it creates a new state`,
        `-# \`name\` — Display name shown in the UI`,
        `-# \`is_severe\` — \`TRUE\` or \`FALSE\`. Severe states are admin-triggered only and skipped during normal daily weather selection`,
        ``,
        `**env_conditions** — Link env conditions to each weather state`,
        `-# \`weather_state\` — Must match a \`code_name\` from the weather_states sheet`,
        `-# \`env_condition\` — Must match a valid env condition codeName (see reference sheet)`,
        `-# Add one row per linked condition. When a state is active, each linked condition contributes 1 stack`,
        `-# Uploading a state's env conditions fully replaces its existing links`,
    ].join('\n');

    const notes = [
        `## Notes`,
        ``,
        `- \`code_name\` is the unique key — uploading a row with an existing \`code_name\` overwrites its name, severity, and env conditions`,
        `- \`is_severe\` accepts \`TRUE\`/\`FALSE\`, \`yes\`/\`no\`, or \`1\`/\`0\` (case-insensitive)`,
        `- Valid rows are saved even if other rows in the same file have errors`,
        `- Use \`/model weatherstate upload\` to submit your completed file`,
    ].join('\n');

    return [
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: guide }] },
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: notes }] },
    ];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchWeatherStateTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateWeatherStateTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'weather-states-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your weather state pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: buildGuideComponents() as never,
    } as never);
}
