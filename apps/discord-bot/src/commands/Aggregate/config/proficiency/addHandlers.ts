import { ButtonInteraction, MessageFlags, ModalSubmitInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { getAddState, setAddState, clearAddState } from './addState';
import { buildPreviewCard } from './addComponents';
import { uploadProficiencyPack } from '../../../../services/model/proficiencyPackService';

function extractField(interaction: ModalSubmitInteraction, customId: string): string {
    const rawComponents: any[] = (interaction as any).data?.components ?? [];

    function search(comps: any[]): string | undefined {
        for (const comp of comps) {
            if (comp.custom_id === customId) {
                // Text inputs use .value; Radio/Checkbox use .values (array)
                if (comp.value !== undefined) return String(comp.value);
                if (Array.isArray(comp.values) && comp.values.length > 0) return String(comp.values[0]);
            }
            if (Array.isArray(comp.components)) {
                const v = search(comp.components);
                if (v !== undefined) return v;
            }
            if (comp.component?.custom_id === customId) {
                if (comp.component.value !== undefined) return String(comp.component.value);
                if (Array.isArray(comp.component.values) && comp.component.values.length > 0) return String(comp.component.values[0]);
            }
        }
    }

    const raw = search(rawComponents);
    if (raw !== undefined) return raw;

    try { return interaction.fields.getTextInputValue(customId); } catch { return ''; }
}

// customId: prof_add_modal
export async function handleProfAddModal(interaction: ModalSubmitInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;

    const name        = extractField(interaction, 'name').trim();
    const codeName    = extractField(interaction, 'code_name').trim();
    const stat        = extractField(interaction, 'stat').trim();
    const description = extractField(interaction, 'description').trim();

    if (!name || !codeName || !stat) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'Name, code name, and stat are all required.' }] }],
        } as never);
        return;
    }

    const state = { guildId, name, codeName, stat, description };
    setAddState(userId, guildId, state);

    await interaction.reply(buildPreviewCard(state, userId) as never);
}

// customId: prof_add_cancel
export async function handleProfAddCancel(interaction: ButtonInteraction): Promise<void> {
    clearAddState(interaction.user.id, interaction.guildId!);
    await interaction.deferUpdate();
    await interaction.deleteReply();
}

// customId: prof_add_finalize
export async function handleProfAddFinalize(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;

    const state = getAddState(userId, guildId);
    if (!state) {
        await interaction.deferUpdate();
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'Session expired — please run `/config proficiency add` again.' }] }],
        } as never);
        return;
    }

    await interaction.deferUpdate();

    const result = await uploadProficiencyPack(guildId, [{
        row:         1,
        codeName:    state.codeName,
        name:        state.name,
        stat:        state.stat,
        description: state.description || null,
    }]);

    if (!result.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
        return;
    }

    const { saved, errors, overwrites } = result.value!;

    if (errors.length > 0) {
        const errorText = errors.map(e => `-# ${e.message}`).join('\n');
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `Failed to save:\n${errorText}` }] }],
        } as never);
        return;
    }

    clearAddState(userId, guildId);

    const overwrite = overwrites[0];
    const item      = saved[0];

    let content: string;
    let accentColor: number;

    if (overwrite) {
        const nameChanged = overwrite.oldName !== overwrite.newName;
        const statChanged = overwrite.oldStat !== overwrite.newStat;
        const detail = [
            nameChanged ? `name: ${overwrite.oldName} → ${overwrite.newName}` : null,
            statChanged ? `stat: ${overwrite.oldStat} → ${overwrite.newStat}` : null,
        ].filter(Boolean).join(', ') || 'description updated';
        content     = `## Proficiency Updated\nUpdated by <@${userId}>\n\n-# ${overwrite.codeName} — ${detail}`;
        accentColor = colors.special;
    } else {
        content     = `## Proficiency Added\nAdded by <@${userId}>\n\n-# ${item.codeName} | ${item.name} | ${item.stat}`;
        accentColor = colors.success;
    }

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: accentColor, components: [{ type: 10, content }] }],
    } as never);

    await interaction.deleteReply();
}
