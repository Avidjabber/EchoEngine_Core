export interface GuildSettingsState {
    guildId:                 string;
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
}

const store = new Map<string, GuildSettingsState>();

function stateKey(userId: string, guildId: string): string {
    return `${userId}_${guildId}`;
}

export function setState(userId: string, guildId: string, state: GuildSettingsState): void {
    store.set(stateKey(userId, guildId), state);
}

export function getState(userId: string, guildId: string): GuildSettingsState | undefined {
    return store.get(stateKey(userId, guildId));
}

export function clearState(userId: string, guildId: string): void {
    store.delete(stateKey(userId, guildId));
}
