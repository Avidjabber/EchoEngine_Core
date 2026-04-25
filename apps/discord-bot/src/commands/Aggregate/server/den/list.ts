import {
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { getDens } from '../../../../services/server/denService';
import { getCachedDens, setCachedDens } from '../../../../services/server/denCache';
import { buildDenListComponents } from './listComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;

    let dens = getCachedDens(guildId);

    if (!dens) {
        const result = await getDens(guildId);
        if (!result.success) {
            await replyError(interaction, messages.apiError(result.error!));
            return;
        }
        dens = result.value ?? [];
        setCachedDens(guildId, dens);
    }

    if (!dens.length) {
        await replyError(interaction, messages.noDens);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildDenListComponents(dens, 0) as never,
    });
}
