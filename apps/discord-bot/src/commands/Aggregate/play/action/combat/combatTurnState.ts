export interface TurnEntry {
    turnPromptMessageId: string;
    channelId:           string;
    entityId:            number;
    entityName:          string;
    userId:              string | undefined;
    round:               number;
    usedFlags:           number;  // bit 0 = main, bit 1 = bonus, bit 2 = item
    allowsFleeing:       boolean;
}

export const TURN_FLAG_MAIN  = 0b001;
export const TURN_FLAG_BONUS = 0b010;
export const TURN_FLAG_ITEM  = 0b100;

const turnState = new Map<number, TurnEntry>();

export function setTurnEntry(
    activeCombatId:      number,
    turnPromptMessageId: string,
    channelId:           string,
    entityId:            number,
    entityName:          string,
    userId:              string | undefined,
    round:               number,
    allowsFleeing:       boolean,
): void {
    turnState.set(activeCombatId, { turnPromptMessageId, channelId, entityId, entityName, userId, round, usedFlags: 0, allowsFleeing });
}

export function getTurnEntry(activeCombatId: number): TurnEntry | undefined {
    return turnState.get(activeCombatId);
}

export function markTurnFlagUsed(activeCombatId: number, flag: number): void {
    const entry = turnState.get(activeCombatId);
    if (entry) entry.usedFlags |= flag;
}

export function deleteTurnEntry(activeCombatId: number): void {
    turnState.delete(activeCombatId);
}
