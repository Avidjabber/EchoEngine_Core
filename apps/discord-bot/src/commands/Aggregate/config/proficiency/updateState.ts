export interface ProficiencyUpdateState {
    guildId:          string;
    originalCodeName: string;
    name:             string;
    codeName:         string;
    stat:             string;
    description:      string;
    statOptions:      string[];
}

const stateMap = new Map<string, ProficiencyUpdateState>();

export function getUpdateState(userId: string, guildId: string): ProficiencyUpdateState | undefined {
    return stateMap.get(`${userId}_${guildId}`);
}

export function setUpdateState(userId: string, guildId: string, s: ProficiencyUpdateState): void {
    stateMap.set(`${userId}_${guildId}`, s);
}

export function clearUpdateState(userId: string, guildId: string): void {
    stateMap.delete(`${userId}_${guildId}`);
}
