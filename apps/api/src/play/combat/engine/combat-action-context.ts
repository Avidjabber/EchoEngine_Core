export interface CombatActionInput {
    combatId:       number;
    actorEntityId:  number;
    profileId:      number;
    storedItemId:   number;
    targetEntityId: number | null;
    roundNumber:    number;
}

// ── Snapshots loaded by DECLARE ───────────────────────────────────────────────

export interface ActorSnapshot {
    name:  string;
    stats: Record<string, number>; // strength | dexterity | constitution | intelligence | wisdom | charisma
}

export interface ProfileSnapshot {
    label:            string | null;
    actionCategoryId: number | null;
    cooldownRounds:   number;
    hitBonus:         number;
    damageBonus:      number;
    healBonus:        number;
    damageDiceCount:  number | null;
    damageDiceSides:  number | null;
    healDiceCount:    number | null;
    healDiceSides:    number | null;
    dealsDamage:      boolean;
    restoresHealth:   boolean;
    hitStatName:      string | null;
    damageStatName:   string | null;
    healStatName:     string | null;
    damageTypeName:          string | null;
    elementalDiceCount:      number | null;
    elementalDiceSides:      number | null;
    elementalDamageTypeName: string | null;
}

export interface CombatMetaSnapshot {
    canSecondWind:    boolean;
    currentTurnOrder: number;
}

// ── Snapshots loaded by TARGET ────────────────────────────────────────────────

export interface TargetSnapshot {
    name:      string;
    currentHp: number;
    maxHp:     number;
    baseAc:    number;
    dexterity: number;
}

export interface TargetParticipantSnapshot {
    id:             number;
    inSecondWind:   boolean;
    isAiControlled: boolean;
}

// ── Reaction data set by POST_APPLY ──────────────────────────────────────────

export interface PendingReaction {
    defenderEntityId:   number;
    defenderEntityName: string;
    defenderUserId:     string | null;
    attackerEntityId:   number;
    reactionProfiles:   Array<{ profileId: number; storedItemId: number; label: string }>;
}

// ── The full mutable context ──────────────────────────────────────────────────

export interface CombatActionContext {
    readonly input: Readonly<CombatActionInput>;

    // DECLARE
    actor:               ActorSnapshot | null;
    profile:             ProfileSnapshot | null;
    combatMeta:          CombatMetaSnapshot | null;
    existingActionCount: number;
    actorTurnOrder:      number | null;

    // VALIDATE
    aborted:     boolean;
    abortReason: string | null;

    // TARGET
    actualTargetId:     number | null;  // may differ from input.targetEntityId after redirect
    wasRedirected:      boolean;
    originalTargetName: string | null;  // name of input target when redirected
    target:             TargetSnapshot | null;
    targetParticipant:  TargetParticipantSnapshot | null;
    targetAC:           number;

    // PRE_RESOLVE
    hitModifier:    number;
    damageModifier: number;
    healModifier:   number;

    // RESOLVE
    hitRoll:     number | null;  // raw d20 result (stored in action log)
    hitTotal:    number | null;  // hitRoll + hitModifier (shown in Discord)
    isHit:       boolean | null;
    diceRolls:   number[];
    rawDamage:   number;         // sum of dice before modifier
    finalDamage: number;         // max(0, rawDamage + damageModifier)
    rawHeal:     number;
    finalHeal:   number;
    elementalDiceRolls:   number[];
    rawElementalDamage:   number;
    finalElementalDamage: number; // no modifier in stage 1; resistance interceptors scale this in stage 2

    // APPLY
    hpAfter:     number | null;
    knockedDown: boolean;
    defeated:    boolean;

    // POST_APPLY
    pendingReaction: PendingReaction | null;

    // END
    actionId: number | null;
}
