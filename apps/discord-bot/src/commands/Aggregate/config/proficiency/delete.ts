import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyLoading } from '../../../../core/reply';
import { colors } from '../../../../core/colors';
import { checkDeleteProficiency } from '../../../../services/model/proficiencyPackService';
import { setDeleteState } from './deleteState';
import { buildDeleteConfirmCard } from './deleteComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.invalidPerms }] }],
        } as never);
        return;
    }

    const guildId  = interaction.guildId!;
    const userId   = interaction.user.id;
    const codeName = interaction.options.getString('codename', true);

    const checkResult = await checkDeleteProficiency(guildId, codeName);

    if (!checkResult.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
        return;
    }

    const check = checkResult.value!;

    if (check.status === 'not_found') {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `\`${codeName}\` is not a recognised proficiency codeName.` }] }],
        } as never);
        return;
    }

    if (check.status === 'has_dependencies') {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: `**${check.name}** (\`${codeName}\`) is still in use and cannot be deleted.\n-# Remove all references to this proficiency first.` }],
            }],
        } as never);
        return;
    }

    const state = { guildId, codeName, name: check.name };
    setDeleteState(userId, guildId, state);

    await interaction.editReply(buildDeleteConfirmCard(state, userId) as never);
}
