import { apiClient } from '../api';

export interface CombatParticipantInfo {
    entityId:       number;
    name:           string;
    userId:         string | null;
    allyFactionId:  number;
    turnOrder:      number;
    currentHp:      number | null;
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
    damageDice:    string | null;
    healDice:      string | null;
    cooldownRounds: number;
    isOnCooldown:  boolean;
}

export interface AdvanceTurnResult {
    combatEnded:            boolean;
    nextEntityId:           number | null;
    nextEntityName:         string | null;
    nextUserId:             string | null;
    isAiControlled:         boolean;
    isAwaitingSecondWind:   boolean;
    round:                  number;
    winningAllyFactionId:   number | null;
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

export type ActionResultOutcome =
    | { kind: 'hit';      hitRoll: number; targetAC: number; diceRolls: number[]; totalDamage: number; hpAfter: number; knockedDown: boolean; defeated: boolean }
    | { kind: 'miss';     hitRoll: number; targetAC: number }
    | { kind: 'heal';     diceRolls: number[]; totalHeal: number; hpAfter: number }
    | { kind: 'behavior'; effectName: string; guardedName: string | null; rounds: number }
    | { kind: 'no_op' };

export interface ActionResult {
    actionId:         number;
    actionLabel:      string;
    actorName:        string;
    targetName:       string;
    actualTargetName: string;
    wasRedirected:    boolean;
    outcome:          ActionResultOutcome;
}

export function processAction(
    combatId:       number,
    actorEntityId:  number,
    profileId:      number,
    storedItemId:   number,
    targetEntityId: number | null,
    roundNumber:    number,
) {
    return apiClient.post<ActionResult>(`/play/combat/${combatId}/process-action`, {
        actorEntityId, profileId, storedItemId, targetEntityId, roundNumber,
    });
}

export interface XpGrant {
    entityId:       number;
    entityName:     string;
    disciplineId:   number;
    disciplineName: string;
    xpGained:       number;
    levelsGained:   number;
    newLevel:       number;
}

export function distributeCombatXp(combatId: number) {
    return apiClient.post<XpGrant[]>(`/play/combat/${combatId}/distribute-xp`, {});
}

export function acceptSecondWind(combatId: number, entityId: number) {
    return apiClient.post<void>(`/play/combat/${combatId}/second-wind`, { entityId });
}

export function declineSecondWind(combatId: number, entityId: number) {
    return apiClient.post<void>(`/play/combat/${combatId}/decline-second-wind`, { entityId });
}
