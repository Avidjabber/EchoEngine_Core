import { apiClient } from '../api';

export interface CombatParticipantInfo {
    entityId:       number;
    name:           string;
    userId:         string | null;
    allyFactionId:  number;
    turnOrder:      number;
    isDefeated:     boolean;
    hasFled:        boolean;
    isAiControlled: boolean;
}

export interface AvailableAction {
    profileId:    number;
    storedItemId: number;
    itemName:     string;
    actionLabel:  string | null;
    targetScope: {
        targetsSelf:    boolean;
        targetsSingle:  boolean;
        targetsAllies:  boolean;
        targetsEnemies: boolean;
    } | null;
    damageDice:   string | null;
    healDice:     string | null;
    isOnCooldown: boolean;
}

export interface AdvanceTurnResult {
    combatEnded:          boolean;
    nextEntityId:         number | null;
    nextEntityName:       string | null;
    nextUserId:           string | null;
    isAiControlled:       boolean;
    round:                number;
    winningAllyFactionId: number | null;
}

export interface CombatTargetEntity {
    id:          number;
    name:        string;
    age:         number;
    factionId:   number;
    factionName: string;
    userId:      string;
}

export interface CombatParticipantOrder {
    entityId:      number;
    allyFactionId: number;
}

export type StartCombatResponse =
    | { success: true;  activeCombatId: number; removedEntityIds: number[]; participants: CombatParticipantOrder[] }
    | { success: false;                          removedEntityIds: number[] };

export function fetchInviteTargets(guildId: string, initiatorEntityId: number, mode: 'spar' | 'fight') {
    return apiClient.get<CombatTargetEntity[]>('/play/combat/invite-targets', {
        guildId,
        initiatorEntityId: String(initiatorEntityId),
        mode,
    });
}

export function fetchSignupTargets(guildId: string, userId: string, initiatorFactionId: number, mode: 'spar' | 'fight') {
    return apiClient.get<CombatTargetEntity[]>('/play/combat/signup-targets', {
        guildId,
        userId,
        initiatorFactionId: String(initiatorFactionId),
        mode,
    });
}

export function startCombat(
    guildId: string,
    type:    'spar' | 'fight',
    teams:   Array<{ entities: Array<{ entityId: number }> }>,
) {
    return apiClient.post<StartCombatResponse>('/play/combat/start', { guildId, type, teams });
}

export function fetchParticipants(combatId: number) {
    return apiClient.get<CombatParticipantInfo[]>(`/play/combat/${combatId}/participants`);
}

export function fetchAvailableActions(combatId: number, entityId: number, category: 'main' | 'bonus' | 'item') {
    return apiClient.get<AvailableAction[]>(`/play/combat/${combatId}/available-actions`, {
        entityId: String(entityId),
        category,
    });
}

export function advanceTurn(combatId: number, currentEntityId: number) {
    return apiClient.post<AdvanceTurnResult>(`/play/combat/${combatId}/advance-turn`, { currentEntityId });
}
