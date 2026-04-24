export interface ProficiencyAddState {
    guildId:     string;
    name:        string;
    codeName:    string;
    stat:        string;
    description: string;
}

const stateMap = new Map<string, ProficiencyAddState>();

export function getAddState(userId: string, guildId: string): ProficiencyAddState | undefined {
    return stateMap.get(`${userId}_${guildId}`);
}

export function setAddState(userId: string, guildId: string, s: ProficiencyAddState): void {
    stateMap.set(`${userId}_${guildId}`, s);
}

export function clearAddState(userId: string, guildId: string): void {
    stateMap.delete(`${userId}_${guildId}`);
}
