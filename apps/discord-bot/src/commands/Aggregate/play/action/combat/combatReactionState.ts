export interface PendingReactionEntry {
    reactionPromptMessageId: string;
    channelId:               string;
    defenderEntityId:        number;
    defenderEntityName:      string;
    defenderUserId:          string | undefined;
    attackerEntityId:        number;
    reactionProfiles:        Array<{ profileId: number; storedItemId: number; label: string }>;
}

const reactionState = new Map<number, PendingReactionEntry>();

export function setReactionEntry(
    activeCombatId:          number,
    reactionPromptMessageId: string,
    channelId:               string,
    defenderEntityId:        number,
    defenderEntityName:      string,
    defenderUserId:          string | undefined,
    attackerEntityId:        number,
    reactionProfiles:        Array<{ profileId: number; storedItemId: number; label: string }>,
): void {
    reactionState.set(activeCombatId, {
        reactionPromptMessageId, channelId, defenderEntityId, defenderEntityName,
        defenderUserId, attackerEntityId, reactionProfiles,
    });
}

export function getReactionEntry(activeCombatId: number): PendingReactionEntry | undefined {
    return reactionState.get(activeCombatId);
}

export function deleteReactionEntry(activeCombatId: number): void {
    reactionState.delete(activeCombatId);
}
