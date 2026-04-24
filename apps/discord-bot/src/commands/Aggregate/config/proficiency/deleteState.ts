export interface ProficiencyDeleteState {
    guildId:  string;
    codeName: string;
    name:     string;
}

const stateMap = new Map<string, ProficiencyDeleteState>();

export function getDeleteState(userId: string, guildId: string): ProficiencyDeleteState | undefined {
    return stateMap.get(`${userId}_${guildId}`);
}

export function setDeleteState(userId: string, guildId: string, s: ProficiencyDeleteState): void {
    stateMap.set(`${userId}_${guildId}`, s);
}

export function clearDeleteState(userId: string, guildId: string): void {
    stateMap.delete(`${userId}_${guildId}`);
}
