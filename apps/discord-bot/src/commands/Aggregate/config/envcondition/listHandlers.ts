import { ButtonInteraction, MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionModifiers } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionModifiers, setCachedEnvConditionModifiers, invalidateEnvConditionModifiersCache } from './listCache';
import { buildEnvConditionListComponents, ModifierFilter } from './listComponents';

async function resolveData(interaction: ButtonInteraction | StringSelectMenuInteraction) {
    const guildId = interaction.guildId!;
    const cached  = getCachedEnvConditionModifiers(guildId);
    if (cached) return cached;

    const result = await fetchEnvConditionModifiers(guildId);
    if (!result.success) return null;

    setCachedEnvConditionModifiers(guildId, result.value!);
    return result.value!;
}

async function replyFetchError(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.error,
            components:   [{ type: 10, content: messages.errorGeneric }],
        }],
    } as never);
}

// customId: ec_list_page:{page}:{filter}
export async function handleEcListPage(interaction: ButtonInteraction): Promise<void> {
    const parts   = interaction.customId.split(':');
    const page    = parseInt(parts[1], 10);
    const filter  = parts[2] as ModifierFilter;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionListComponents(data, page, filter, isAdmin) as never,
    });
}

// customId: ec_list_filter  (selected value is the filter)
export async function handleEcListFilter(interaction: StringSelectMenuInteraction): Promise<void> {
    const filter  = interaction.values[0] as ModifierFilter;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionListComponents(data, 0, filter, isAdmin) as never,
    });
}

// customId: ec_list_done
export async function handleEcListDone(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    invalidateEnvConditionModifiersCache(interaction.guildId!);
    await interaction.deleteReply();
}
