import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchWeatherPatternTemplateData } from '../../../../services/model/weatherPatternPackService';
import { generateWeatherPatternTemplate } from '../../../../utils/generators/weatherPatternTemplate';

function buildGuideComponents(): object[] {
    const guide = [
        `## How to Fill In Your Weather Pattern Template`,
        ``,
        `**patterns** — Define named weather sequences for this guild`,
        `-# \`code_name\` — Unique snake_case slug (e.g. \`stormy_day\`, \`gentle_thaw\`). This is the permanent identifier — changing it creates a new pattern`,
        `-# \`name\` — Display name shown in the UI`,
        `-# \`is_severe\` — \`TRUE\` or \`FALSE\`. Severe patterns are admin-triggered only and skipped during normal daily weather selection`,
        `-# \`cooldown_days\` — Minimum days before this pattern can be selected again (0 = no cooldown)`,
        ``,
        `**steps** — Ordered weather states that play out over the day`,
        `-# \`pattern\` — Must match a \`code_name\` from the patterns sheet`,
        `-# \`step_order\` — Positive integer. Determines playback order (1, 2, 3…)`,
        `-# \`weather_state\` — Weather state \`code_name\` for this step (see reference sheet). Leave blank to use the season's default weather state`,
        `-# \`duration_hours\` — How long this step lasts in hours (positive integer). Steps can sum to any total — patterns shorter than 24h hold their final step until midnight; patterns longer than 24h continue across multiple days`,
        ``,
        `**season_weights** — Which seasons can select this pattern and how often`,
        `-# \`pattern\` — Must match a \`code_name\` from the patterns sheet`,
        `-# \`season\` — Season name (see reference sheet). Omit a season to exclude the pattern from it`,
        `-# \`weight\` — Rarity tier: \`common\`, \`uncommon\`, \`rare\`, or \`very rare\` (see reference sheet). Controls how often this pattern is picked relative to others in that season`,
    ].join('\n');

    const notes = [
        `## Notes`,
        ``,
        `- \`code_name\` is the unique key — uploading a pattern with an existing \`code_name\` replaces its name, severity, cooldown, steps, and season weights`,
        `- \`is_severe\` accepts \`TRUE\`/\`FALSE\`, \`yes\`/\`no\`, or \`1\`/\`0\` (case-insensitive)`,
        `- A pattern with no season weights is saved but will never be picked during normal daily selection`,
        `- A pattern with no steps is valid — it produces a blank day (or a single "use season default" step)`,
        `- Valid rows are saved even if other rows in the same file have errors`,
        `- Use \`/model weatherpattern upload\` to submit your completed file`,
    ].join('\n');

    return [
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: guide }] },
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: notes }] },
    ];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchWeatherPatternTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateWeatherPatternTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'weather-patterns-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your weather pattern pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: buildGuideComponents() as never,
    } as never);
}
