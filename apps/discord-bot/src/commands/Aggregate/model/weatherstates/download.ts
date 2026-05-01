import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchAllWeatherStates, fetchWeatherStateTemplateData } from '../../../../services/model/weatherStatePackService';
import { generateWeatherStateDownload } from '../../../../utils/generators/weatherStateTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;

    const [statesResult, templateResult] = await Promise.all([
        fetchAllWeatherStates(guildId),
        fetchWeatherStateTemplateData(guildId),
    ]);

    if (!statesResult.success || !templateResult.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const states       = statesResult.value!;
    const templateData = templateResult.value!;

    let buffer: Buffer;
    try {
        buffer = await generateWeatherStateDownload(states, templateData);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'weather-states.xlsx' });

    const stateCount   = states.length;
    const linkCount    = states.reduce((sum, s) => sum + s.envConditions.length, 0);
    const severeCount  = states.filter(s => s.isSevere).length;

    const summary = stateCount === 0
        ? 'No weather states are configured for this guild yet.'
        : [
            `## Weather State Config Export`,
            `-# ${stateCount} weather state${stateCount !== 1 ? 's' : ''}`,
            `-# ${severeCount} severe`,
            `-# ${linkCount} env condition link${linkCount !== 1 ? 's' : ''}`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current weather state config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: stateCount === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
