import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchAllWeatherPatterns, fetchWeatherPatternTemplateData } from '../../../../services/model/weatherPatternPackService';
import { generateWeatherPatternDownload } from '../../../../utils/generators/weatherPatternTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;

    const [patternsResult, templateResult] = await Promise.all([
        fetchAllWeatherPatterns(guildId),
        fetchWeatherPatternTemplateData(guildId),
    ]);

    if (!patternsResult.success || !templateResult.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const patterns     = patternsResult.value!;
    const templateData = templateResult.value!;

    let buffer: Buffer;
    try {
        buffer = await generateWeatherPatternDownload(patterns, templateData);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'weather-patterns.xlsx' });

    const patternCount = patterns.length;
    const stepCount    = patterns.reduce((sum, p) => sum + p.steps.length, 0);
    const severeCount  = patterns.filter(p => p.isSevere).length;

    const summary = patternCount === 0
        ? 'No weather patterns are configured for this guild yet.'
        : [
            `## Weather Pattern Config Export`,
            `-# ${patternCount} weather pattern${patternCount !== 1 ? 's' : ''}`,
            `-# ${severeCount} severe`,
            `-# ${stepCount} step${stepCount !== 1 ? 's' : ''} total`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current weather pattern config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: patternCount === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
