import { apiClient } from '../api';

export interface DisciplineLevelCap {
    guildId:         string;
    disciplineDefId: number;
    levelCap:        number;
    disciplineDef:   { id: number; codeName: string; name: string };
}

export interface GuildSettings {
    id:      number;
    guildId: string;

    defaultDailyEnergy:      number;
    doubleAgeMaxThreshold:   number;
    maxCombatRounds:         number;
    defaultProficiencyBonus: number;
    disciplineLevelCap:      number | null;
    factionRepDecayRate:     number;

    farmingSoilDegradationFilth: number;
    farmingSoilDegradationToxic: number;
    farmingCompostIncrement:     number;

    worldSimEnabled:    boolean;
    conditionsEnabled:  boolean;
    combatEnabled:      boolean;
    activitiesEnabled:  boolean;
    eventsEnabled:      boolean;
    craftingEnabled:    boolean;
    progressionEnabled: boolean;
    socialEnabled:      boolean;

    disciplineLevelCaps: DisciplineLevelCap[];

    createdAt: string;
    updatedAt: string;
}

export type SettingsNumberKey =
    | 'defaultDailyEnergy'
    | 'doubleAgeMaxThreshold'
    | 'maxCombatRounds'
    | 'defaultProficiencyBonus'
    | 'disciplineLevelCap'
    | 'factionRepDecayRate';

export async function getGuildSettings(guildId: string) {
    return apiClient.get<GuildSettings>(`/server/settings?guildId=${encodeURIComponent(guildId)}`);
}

export interface GuildSettingsUpdate {
    defaultDailyEnergy?:      number;
    doubleAgeMaxThreshold?:   number;
    maxCombatRounds?:         number;
    defaultProficiencyBonus?: number;
    disciplineLevelCap?:      number | null;
    factionRepDecayRate?:     number;
    farmingSoilDegradationFilth?: number;
    farmingSoilDegradationToxic?: number;
    farmingCompostIncrement?:     number;
    worldSimEnabled?:    boolean;
    conditionsEnabled?:  boolean;
    combatEnabled?:      boolean;
    activitiesEnabled?:  boolean;
    eventsEnabled?:      boolean;
    craftingEnabled?:    boolean;
    progressionEnabled?: boolean;
    socialEnabled?:      boolean;
}

export async function updateGuildSettings(guildId: string, data: GuildSettingsUpdate) {
    return apiClient.patch<GuildSettings>('/server/settings', { guildId, ...data });
}

export async function resetGuildSettings(guildId: string) {
    return apiClient.post<GuildSettings>('/server/settings/reset', { guildId });
}
