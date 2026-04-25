import { ButtonInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { getDeleteState, clearDeleteState } from './deleteState';
import { deleteProficiency } from '../../../../services/model/proficiencyPackService';

// customId: prof_del_cancel
export async function handleProfDelCancel(interaction: ButtonInteraction): Promise<void> {
    clearDeleteState(interaction.user.id, interaction.guildId!);
    await interaction.deferUpdate();
    await interaction.deleteReply();
}

// customId: prof_del_confirm
export async function handleProfDelConfirm(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;

    const state = getDeleteState(userId, guildId);
    if (!state) {
        await interaction.deferUpdate();
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'Session expired — please run `/config proficiency delete` again.' }] }],
        } as never);
        return;
    }

    await interaction.deferUpdate();

    const result = await deleteProficiency(guildId, state.codeName);

    clearDeleteState(userId, guildId);
    await interaction.deleteReply();

    if (!result.success || !result.value!.deleted) {
        await interaction.followUp({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: `<@${userId}> Failed to delete **${state.name}** — it may still be in use.\n-# ${messages.errorGeneric}` }],
            }],
        } as never);
        return;
    }

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.success,
            components:   [{ type: 10, content: `## Proficiency Deleted\nDeleted by <@${userId}>\n\n-# ${state.codeName} | ${state.name}` }],
        }],
    } as never);
}
