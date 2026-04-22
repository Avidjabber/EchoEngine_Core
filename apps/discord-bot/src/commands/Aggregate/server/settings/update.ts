import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { getGuildSettings } from '../../../../services/server/settingsService';
import { setState } from './settingsState';
import { buildGuildSettingsComponents } from './updateComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId   = interaction.guildId!;
    const guildName = interaction.guild!.name;

    const result = await getGuildSettings(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const settings = result.value!;

    setState(interaction.user.id, guildId, {
        guildId,
        defaultDailyEnergy:          settings.defaultDailyEnergy,
        doubleAgeMaxThreshold:       settings.doubleAgeMaxThreshold,
        maxCombatRounds:             settings.maxCombatRounds,
        defaultProficiencyBonus:     settings.defaultProficiencyBonus,
        disciplineLevelCap:          settings.disciplineLevelCap,
        factionRepDecayRate:         settings.factionRepDecayRate,
        farmingSoilDegradationFilth: settings.farmingSoilDegradationFilth,
        farmingSoilDegradationToxic: settings.farmingSoilDegradationToxic,
        farmingCompostIncrement:     settings.farmingCompostIncrement,
        worldSimEnabled:    settings.worldSimEnabled,
        conditionsEnabled:  settings.conditionsEnabled,
        combatEnabled:      settings.combatEnabled,
        activitiesEnabled:  settings.activitiesEnabled,
        eventsEnabled:      settings.eventsEnabled,
        craftingEnabled:    settings.craftingEnabled,
        progressionEnabled: settings.progressionEnabled,
        socialEnabled:      settings.socialEnabled,
    });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildGuildSettingsComponents(
            { guildId, ...settings },
            guildName,
        ) as never,
    });
}
