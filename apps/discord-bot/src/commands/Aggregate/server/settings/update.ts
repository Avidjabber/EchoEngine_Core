import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { getGuildSettings } from '../../../../services/server/settingsService';
import { setState } from './settingsState';
import { getCachedInfo, setCachedInfo } from './infoState';
import { buildGuildSettingsComponents } from './updateComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId   = interaction.guildId!;
    const guildName = interaction.guild!.name;

    let state = getCachedInfo(guildId);

    if (!state) {
        const result = await getGuildSettings(guildId);

        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }

        const s = result.value!;
        state = {
            guildId,
            defaultDailyEnergy:          s.defaultDailyEnergy,
            doubleAgeMaxThreshold:       s.doubleAgeMaxThreshold,
            maxCombatRounds:             s.maxCombatRounds,
            defaultProficiencyBonus:     s.defaultProficiencyBonus,
            disciplineLevelCap:          s.disciplineLevelCap,
            factionRepDecayRate:         s.factionRepDecayRate,
            farmingSoilDegradationFilth: s.farmingSoilDegradationFilth,
            farmingSoilDegradationToxic: s.farmingSoilDegradationToxic,
            farmingCompostIncrement:     s.farmingCompostIncrement,
            worldSimEnabled:    s.worldSimEnabled,
            conditionsEnabled:  s.conditionsEnabled,
            combatEnabled:      s.combatEnabled,
            activitiesEnabled:  s.activitiesEnabled,
            eventsEnabled:      s.eventsEnabled,
            craftingEnabled:    s.craftingEnabled,
            progressionEnabled: s.progressionEnabled,
            socialEnabled:      s.socialEnabled,
            timezoneOffset:     s.timezoneOffset,
        };
        setCachedInfo(guildId, state);
    }

    setState(interaction.user.id, guildId, state);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildGuildSettingsComponents(state, guildName) as never,
    });
}
