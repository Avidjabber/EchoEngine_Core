import { ButtonInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { getCachedProficiencyList, invalidateProficiencyListCache } from './listCache';
import { buildProficiencyListComponents, buildProficiencyListInfoComponents } from './listComponents';
import { fetchProficiencyByCodeName } from '../../../../services/model/proficiencyPackService';

const EXPIRED_MSG = 'List expired — please run `/config proficiency list` again.';

// customId: prof_list_page:{page}
export async function handleProfListPage(interaction: ButtonInteraction): Promise<void> {
    const page  = parseInt(interaction.customId.split(':')[1], 10);
    const items = getCachedProficiencyList(interaction.guildId!);

    await interaction.deferUpdate();

    if (!items) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
        } as never);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildProficiencyListComponents(items, page) as never,
    });
}

// customId: prof_list_info:{fromPage}:{codeName}
export async function handleProfListInfo(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const fromPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');
    const guildId  = interaction.guildId!;

    await interaction.deferUpdate();

    const cached = getCachedProficiencyList(guildId);
    const prof   = cached?.find(p => p.codeName === codeName)
                ?? (await fetchProficiencyByCodeName(guildId, codeName)).value
                ?? null;

    if (!prof) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildProficiencyListInfoComponents(prof, fromPage) as never,
    });
}

// customId: prof_list_back:{page}
export async function handleProfListBack(interaction: ButtonInteraction): Promise<void> {
    const page  = parseInt(interaction.customId.split(':')[1], 10);
    const items = getCachedProficiencyList(interaction.guildId!);

    await interaction.deferUpdate();

    if (!items) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
        } as never);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildProficiencyListComponents(items, page) as never,
    });
}

// customId: prof_list_done
export async function handleProfListDone(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    invalidateProficiencyListCache(interaction.guildId!);
    await interaction.deleteReply();
}
