import { ButtonInteraction, MessageFlags, TextChannel } from 'discord.js';
import { colors } from '../../../../core/colors';
import { getCachedCharacters } from './characterSelectCache';
import { buildCharacterSelectComponents } from './characterSelectComponents';
import { createSetup, addTeam } from './combat/setupState';
import { buildTeamComponents, buildControlComponents } from './combat/setupComponents';
import type { ActionCategory } from './defs';

const EXPIRED_MSG = 'Session expired — please run the command again.';

// customId: pa_action_back:{category}:{fromPage}
export async function handlePaActionBack(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const category = parts[1] as ActionCategory;
    const fromPage = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const chars = getCachedCharacters(interaction.guildId!, interaction.user.id);
    if (!chars) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
        } as never);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildCharacterSelectComponents(chars, category, fromPage) as never,
    });
}

// customId: pa_action_pick:{category}:{entityId}:{actionCode}
export async function handlePaActionPick(interaction: ButtonInteraction): Promise<void> {
    const parts      = interaction.customId.split(':');
    const entityId   = parseInt(parts[2], 10);
    const actionCode = parts[3];

    // ── Combat actions ──────────────────────────────────────────────────────────
    if (actionCode === 'spar_invite' || actionCode === 'spar_open' ||
        actionCode === 'fight_invite' || actionCode === 'fight_open') {

        const [typeStr, modeStr] = actionCode.split('_') as ['spar' | 'fight', 'invite' | 'open'];

        const chars = getCachedCharacters(interaction.guildId!, interaction.user.id);
        const char  = chars?.find(c => c.id === entityId);

        if (!char) {
            await interaction.reply({
                flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
            } as never);
            return;
        }

        await interaction.deferUpdate();

        const setup = createSetup({
            guildId:            interaction.guildId!,
            channelId:          interaction.channelId,
            type:               typeStr,
            mode:               modeStr,
            initiatorUserId:    interaction.user.id,
            initiatorEntityId:  entityId,
            initiatorFactionId: char.factionId,
        });

        const channel = interaction.channel as TextChannel;

        // Post Team 1 with the initiator's character pre-added
        const teamMsg = await channel.send({ components: [] as never });
        const team    = addTeam(setup.setupId, teamMsg.id)!;
        team.entities.push({ entityId, entityName: char.name, userId: interaction.user.id });
        await teamMsg.edit({ components: buildTeamComponents(setup, team) as never });

        // Post control bar
        const controlMsg = await channel.send({ components: buildControlComponents(setup) as never });
        setup.controlMessageId = controlMsg.id;

        // Dismiss the ephemeral action select
        await interaction.deleteReply();
        return;
    }

    // ── Other action codes (training, etc.) — stubs ─────────────────────────────
    await interaction.deferUpdate();
}
