import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchActionTemplateData } from '../../../../services/model/actionPackService';
import { generateActionTemplate } from '../../../../utils/generators/actionTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchActionTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateActionTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'actions-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your action pack template.',
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
                        '## Action Pack Template',
                        'Action types are system-defined — you can only configure existing actions, not create new ones.',
                        '-# `base_configs` — energy cost, entity limits, and duration per action',
                        '-# `discipline_rewards` — XP granted per discipline on completion',
                        '-# `step_configs` — which proficiency or stat governs each resolution step',
                        '-# `discipline_requirements` — minimum discipline levels required to start an action',
                        '-# See the **reference** tab for valid action types, steps, disciplines, and scopes.',
                    ].join('\n'),
                }],
            },
        ],
    } as never);
}
