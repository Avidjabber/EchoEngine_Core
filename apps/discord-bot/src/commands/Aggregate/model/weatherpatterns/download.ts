import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { downloadWeatherPatternPack, fetchAllWeatherPatterns } from '../../../../services/model/weatherPatternPackService';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;

    const [bufferResult, patternsResult] = await Promise.all([
        downloadWeatherPatternPack(guildId),
        fetchAllWeatherPatterns(guildId),
    ]);

    if (!bufferResult.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const attachment = new AttachmentBuilder(bufferResult.value!, { name: 'weather-patterns.xlsx' });

    const patterns    = patternsResult.success ? patternsResult.value! : [];
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
