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
    timezoneOffset:     number;
}

const TTL_MS = 20 * 60 * 1000;

interface Entry {
    data:      GuildSettingsState;
    expiresAt: number;
}

const store = new Map<string, Entry>();

function stateKey(userId: string, guildId: string): string {
    return `${userId}_${guildId}`;
}

export function setState(userId: string, guildId: string, state: GuildSettingsState): void {
    store.set(stateKey(userId, guildId), { data: state, expiresAt: Date.now() + TTL_MS });
}

export function getState(userId: string, guildId: string): GuildSettingsState | undefined {
    const entry = store.get(stateKey(userId, guildId));
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        store.delete(stateKey(userId, guildId));
        return undefined;
    }
    return entry.data;
}

export function clearState(userId: string, guildId: string): void {
    store.delete(stateKey(userId, guildId));
}
