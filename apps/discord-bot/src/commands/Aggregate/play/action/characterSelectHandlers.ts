import { ButtonInteraction, MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import { getCachedCharacters } from './characterSelectCache';
import { buildCharacterSelectComponents } from './characterSelectComponents';
import { buildActionSelectComponents } from './actionSelectComponents';
import type { ActionCategory } from './defs';

const EXPIRED_MSG = 'Session expired — please run the command again.';

function expiredReply(interaction: ButtonInteraction): Promise<void> {
    return interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
    } as never);
}

// customId: pa_char_page:{category}:{page}
export async function handlePaCharPage(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const category = parts[1] as ActionCategory;
    const page     = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const chars = getCachedCharacters(interaction.guildId!, interaction.user.id);
    if (!chars) { await expiredReply(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildCharacterSelectComponents(chars, category, page) as never,
    });
}

// customId: pa_char_pick:{category}:{fromPage}:{entityId}
export async function handlePaCharPick(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const category = parts[1] as ActionCategory;
    const fromPage = parseInt(parts[2], 10);
    const entityId = parseInt(parts[3], 10);

    await interaction.deferUpdate();

    const chars = getCachedCharacters(interaction.guildId!, interaction.user.id);
    const char  = chars?.find(c => c.id === entityId);

    if (!char) { await expiredReply(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildActionSelectComponents(category, char, fromPage) as never,
    });
}

// customId: pa_char_cancel
export async function handlePaCharCancel(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await interaction.deleteReply();
}
