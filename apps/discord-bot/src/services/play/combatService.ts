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
    profileId:     number | null;
    storedItemId:  number | null;
    builtinAction: 'dodge' | 'help' | null;
    itemName:     string;
    actionLabel:  string | null;
    targetScope: {
        targetsSelf:    boolean;
        targetsSingle:  boolean;
        targetsAllies:  boolean;
        targetsEnemies: boolean;
    } | null;
    damageDice:              string | null;
    damageTypeName:          string | null;
    elementalDamageDice:     string | null;
    elementalDamageTypeName: string | null;
    healDice:                string | null;
    cooldownRounds:          number;
    isOnCooldown:            boolean;
}

export interface RoundEndEvent {
    kind:        'dot' | 'hot';
    entityId:    number;
    entityName:  string;
    amount:      number;
    hpAfter:     number;
    defeated:    boolean;
    knockedDown: boolean;
}

export interface DeathSaveEvent {
    entityId:   number;
    entityName: string;
    roll:       number;
    successes:  number;
    failures:   number;
    result:     'success' | 'failure' | 'revived' | 'stable' | 'defeated';
}

export interface MortallyWoundedCharacter {
    entityId: number;
    name:     string;
    userId:   string | null;
}

export interface AdvanceTurnResult {
    combatEnded:          boolean;
    turnEndEvents:        RoundEndEvent[];
    nextEntityId:         number | null;
    nextEntityName:       string | null;
    nextUserId:           string | null;
    isAiControlled:       boolean;
    deathSaveEvent:       DeathSaveEvent | null;
    allowsFleeing:        boolean;
    round:                number;
    winningAllyFactionId: number | null;
    mortallyWounded:      MortallyWoundedCharacter[];
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
    | { success: true;  activeCombatId: number; removedEntityIds: number[]; participants: CombatParticipantOrder[]; allowsFleeing: boolean }
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
    | { kind: 'hit'; hitRoll: number; targetAC: number; isCritical: boolean; diceRolls: number[]; totalDamage: number; damageTypeName: string | null; elementalDiceRolls: number[]; totalElementalDamage: number; elementalDamageTypeName: string | null; absorbedDamage: number; tempHpDrained: number; saveRoll: number | null; saveTotal: number | null; savedSuccessfully: boolean | null; hpAfter: number; knockedDown: boolean; defeated: boolean }
    | { kind: 'miss';     hitRoll: number; targetAC: number; isFumble: boolean }
    | { kind: 'heal';     diceRolls: number[]; totalHeal: number; hpAfter: number }
    | { kind: 'behavior'; effectName: string; guardedName: string | null; rounds: number }
    | { kind: 'no_op' };

export interface PendingReaction {
    defenderEntityId:   number;
    defenderEntityName: string;
    defenderUserId:     string | null;
    attackerEntityId:   number;
    reactionProfiles:   Array<{ profileId: number; storedItemId: number; label: string }>;
}

export interface SummonedEntity {
    entityId:      number;
    name:          string;
    allyFactionId: number;
    turnOrder:     number;
}

export interface ConcentrationSaveEvent {
    entityName: string;
    roll:       number;
    total:      number;
    dc:         number;
    saved:      boolean;
    effectName: string;
}

export interface ActionResult {
    actionId:                number;
    actionLabel:             string;
    actorName:               string;
    targetName:              string;
    actualTargetName:        string;
    wasRedirected:           boolean;
    outcome:                 ActionResultOutcome;
    appliedEffects:          string[];
    pendingReaction?:        PendingReaction;
    legendaryResistanceUsed: boolean;
    concentrationSaveEvent:  ConcentrationSaveEvent | null;
    summonedEntities:        SummonedEntity[];
}

export function processAction(
    combatId:       number,
    actorEntityId:  number,
    profileId:      number,
    storedItemId:   number,
    targetEntityId: number | null,
    roundNumber:    number,
) {
    return apiClient.post<ActionResult | ActionResult[]>(`/play/combat/${combatId}/process-action`, {
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

export function markDeceased(combatId: number, entityId: number) {
    return apiClient.post<void>(`/play/combat/${combatId}/mark-deceased`, { entityId });
}

export function flee(combatId: number, entityId: number) {
    return apiClient.post<{ allowed: boolean }>(`/play/combat/${combatId}/flee`, { entityId });
}

export function processBuiltinAction(
    combatId:       number,
    actorEntityId:  number,
    action:         'dodge' | 'help',
    targetEntityId: number | null,
    roundNumber:    number,
) {
    return apiClient.post<ActionResult>(`/play/combat/${combatId}/process-builtin-action`, {
        actorEntityId, action, targetEntityId, roundNumber,
    });
}

export function processReaction(combatId: number, defenderEntityId: number, profileId: number, storedItemId: number, attackerEntityId: number, roundNumber: number) {
    return apiClient.post<ActionResult>(`/play/combat/${combatId}/process-reaction`, {
        defenderEntityId, profileId, storedItemId, attackerEntityId, roundNumber,
    });
}
