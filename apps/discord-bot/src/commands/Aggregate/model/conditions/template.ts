import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchConditionTemplateData } from '../../../../services/model/conditionPackService';
import { generateConditionTemplate } from '../../../../utils/generators/conditionTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchConditionTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateConditionTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'conditions-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your condition pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: colors.info,
                components:   [{
                    type:    10,
                    content: [
                        '## Condition Pack Template',
                        'Fill in the **conditions** sheet first — all other sheets reference conditions by `code_name`.',
                        '-# `stat_effects` — flat stat buffs/debuffs while active',
                        '-# `prof_effects` — proficiency modifier or disadvantage while active',
                        '-# `combat_effects` — skill-derived magnitude effects in combat',
                        '-# `combat_stat_effects` — combat stat effect defs applied while active',
                        '-# `damage_modifiers` — resistance or immunity to a damage type',
                        '-# `env_rules` — how env conditions affect recovery rolls',
                        '-# `symptom_tags` — observable symptoms (used for discovery)',
                        '-# `granted_items` — items granted on condition application',
                        '-# `links` — block / recover / worsen / spawn relationships between conditions',
                        '-# `behavior_effects` — AI combat behaviour modifications (redirect, restrict, bias)',
                        '-# Engine-owned conditions (global defaults) cannot be modified via upload.',
                    ].join('\n'),
                }],
            },
        ],
    } as never);
}
