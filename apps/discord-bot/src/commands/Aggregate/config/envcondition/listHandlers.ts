import { ButtonInteraction, MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionModifiers } from '../../../../services/model/envConditionPackService';
import { buildEnvConditionListComponents, ModifierFilter } from './listComponents';

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
    const parts  = interaction.customId.split(':');
    const page   = parseInt(parts[1], 10);
    const filter = parts[2] as ModifierFilter;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    await interaction.deferUpdate();

    const result = await fetchEnvConditionModifiers(interaction.guildId!);
    if (!result.success) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionListComponents(result.value!, page, filter, isAdmin) as never,
    });
}

// customId: ec_list_filter  (selected value is the filter)
export async function handleEcListFilter(interaction: StringSelectMenuInteraction): Promise<void> {
    const filter  = interaction.values[0] as ModifierFilter;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    await interaction.deferUpdate();

    const result = await fetchEnvConditionModifiers(interaction.guildId!);
    if (!result.success) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionListComponents(result.value!, 0, filter, isAdmin) as never,
    });
}
