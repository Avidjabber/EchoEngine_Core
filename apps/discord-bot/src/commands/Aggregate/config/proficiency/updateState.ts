export interface ProficiencyUpdateState {
    guildId:          string;
    originalCodeName: string;
    name:             string;
    codeName:         string;
    stat:             string;
    description:      string;
    statOptions:      string[];
}

const TTL_MS = 20 * 60 * 1000;

interface Entry {
    data:      ProficiencyUpdateState;
    expiresAt: number;
}

const stateMap = new Map<string, Entry>();

export function getUpdateState(userId: string, guildId: string): ProficiencyUpdateState | undefined {
    const entry = stateMap.get(`${userId}_${guildId}`);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        stateMap.delete(`${userId}_${guildId}`);
        return undefined;
    }
    return entry.data;
}

export function setUpdateState(userId: string, guildId: string, s: ProficiencyUpdateState): void {
    stateMap.set(`${userId}_${guildId}`, { data: s, expiresAt: Date.now() + TTL_MS });
}

export function clearUpdateState(userId: string, guildId: string): void {
    stateMap.delete(`${userId}_${guildId}`);
}
