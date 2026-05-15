import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { resetGuildSettings } from '../../../../services/server/settingsService';
import { setCachedInfo } from './infoState';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;

    const placeholder = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(messages.guildSettingsResetting),
        );

    await interaction.reply({
        flags:      MessageFlags.IsComponentsV2,
        components: [placeholder],
    });

    const result = await resetGuildSettings(guildId);

    if (!result.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.errorGeneric),
                    ),
            ],
        });
        return;
    }

    const s = result.value!;
    setCachedInfo(guildId, {
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
    });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [
            new ContainerBuilder()
                .setAccentColor(colors.success)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        messages.guildSettingsReset(interaction.user.id),
                    ),
                ),
        ],
    });
}
