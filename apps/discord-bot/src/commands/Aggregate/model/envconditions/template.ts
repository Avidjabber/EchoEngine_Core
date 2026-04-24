import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { fetchEnvConditionTemplateData, EnvConditionTemplateData } from '../../../../services/model/envConditionPackService';
import { generateEnvConditionTemplate } from '../../../../utils/generators/envConditionTemplate';

function buildGuideComponents(data: EnvConditionTemplateData): object[] {
    const effectList = data.effectTypes.join(', ') || '(none configured)';
    const relationList = data.relations.join(', ')  || '(none configured)';

    const guide = [
        `## How to Fill In Your Pack Template`,
        ``,
        `**world_modifiers** — World-level effects triggered by an env condition`,
        `-# \`condition\` — Env condition codeName (see **reference** sheet)`,
        `-# \`effect_type\` — Valid values: ${effectList}`,
        `-# \`relation\` — Valid values: ${relationList}`,
        `-# \`value\` — Decimal between **0.0 and 5.0** (magnitude only). The relation (increase/decrease) sets the direction. Leave blank when relation is **block**.`,
        ``,
        `**stat_modifiers** — Flat stat adjustments per condition stack`,
        `-# \`condition\` — Env condition codeName (see **reference** sheet)`,
        `-# \`stat\` — Stat name (see **reference** sheet)`,
        `-# \`value\` — Amount per stack; negative values subtract`,
        ``,
        `**proficiency_modifiers** — Proficiency roll adjustments`,
        `-# \`condition\` — Env condition codeName (see **reference** sheet)`,
        `-# \`proficiency\` — Guild proficiency codeName (see **reference** sheet)`,
        `-# \`value\` — Flat roll modifier per stack (default: 0)`,
        `-# \`has_disadvantage\` — TRUE or FALSE (default: FALSE)`,
        `-# \`has_advantage\` — TRUE or FALSE (default: FALSE)`,
        `-# ⚠️ Set only one of **value**, **has_disadvantage**, or **has_advantage**`,
    ].join('\n');

    const notes = [
        `## Notes`,
        ``,
        `- Only include sheets you want to affect — missing sheets are ignored`,
        `- All codenames are **case-insensitive**`,
        `- Uploading a pack **upserts** existing rows — matching records are overwritten, others are untouched`,
        `- Valid rows are saved even if other rows in the same file have errors`,
        `- Use \`/model envconditions upload\` to submit your completed file`,
    ].join('\n');

    return [
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: guide }] },
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: notes }] },
    ];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId!;
    const result  = await fetchEnvConditionTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateEnvConditionTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'env-conditions-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your env condition modifier pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: buildGuideComponents(result.value!) as never,
    } as never);
}
