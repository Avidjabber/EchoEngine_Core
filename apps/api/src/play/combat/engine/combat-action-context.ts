export interface CombatActionInput {
    combatId:       number;
    actorEntityId:  number;
    profileId:      number;
    storedItemId:   number;
    targetEntityId: number | null;
    roundNumber:    number;
    isReaction:     boolean;
    // null  = single-target action (full pipeline, reactions allowed)
    // 0     = first target in an AoE batch (full END, no reactions)
    // 1+    = subsequent AoE target (skip cooldown/use tracking, no reactions)
    aoeIndex:       number | null;
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
    damageTypeId:            number | null;
    damageTypeName:          string | null;
    elementalDiceCount:      number | null;
    elementalDiceSides:      number | null;
    elementalDamageTypeId:   number | null;
    elementalDamageTypeName: string | null;
    isReactionAction: boolean;
    savingThrowStatName: string | null;
    saveDC:              number;
    summonSpeciesId: number | null;
    summonDiceCount: number | null;
    summonDiceSides: number | null;
    // Target scope — available to interceptors that need to inspect action targeting
    targetsSelf:    boolean;
    targetsSingle:  boolean;
    targetsAllies:  boolean;
    targetsEnemies: boolean;
    // Behavior effect fields
    behaviorEffectTypeId:          number | null;
    behaviorEffectName:            string | null;
    behaviorEffectRedirectsDamage: boolean;
    behaviorEffectForcesTargeting: boolean;
    behaviorEffectRemovesEffects:  boolean;
    requiresConcentration:         boolean;
    durationRounds:                number;
    flatModifier:                  number | null;
    percentModifier:               number | null;
}

export interface CombatMetaSnapshot {
    usesDeathSaves:   boolean;
    currentTurnOrder: number;
    isSpar:           boolean;
}

// ── Snapshots loaded by TARGET ────────────────────────────────────────────────

export interface TargetSnapshot {
    name:      string;
    userId:    string | null;
    currentHp: number;
    maxHp:     number;
    baseAc:    number;
    stats:     Record<string, number>;
}

export interface ActorParticipantSnapshot {
    helpRollMod:            'advantage' | 'disadvantage' | null;
    concentratingOnEffectId: number | null;
}

export interface TargetParticipantSnapshot {
    id:             number;
    isUnconscious:  boolean;
    isAiControlled: boolean;
    hasUsedReaction: boolean;
    tempHp:                        number;
    legendaryResistancesRemaining: number | null;
    concentratingOnEffectId:       number | null;
}

// ── Concentration save event set by POST_APPLY ───────────────────────────────

export interface ConcentrationSaveEvent {
    entityName: string;
    roll:       number;  // raw d20
    total:      number;  // roll + CON modifier
    dc:         number;  // max(10, half of total damage)
    saved:      boolean;
    effectName: string;  // CombatEffectType.name of the concentration effect
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
    actorParticipant:    ActorParticipantSnapshot | null;
    profile:             ProfileSnapshot | null;
    combatMeta:          CombatMetaSnapshot | null;
    existingActionCount: number;
    actorTurnOrder:      number | null;
    actorParticipantId:  number | null;

    // VALIDATE
    aborted:     boolean;
    abortReason: string | null;

    // TARGET
    actualTargetId:     number | null;  // may differ from input.targetEntityId after redirect
    wasRedirected:      boolean;
    originalTargetName: string | null;  // name of input target when redirected
    target:             TargetSnapshot | null;
    targetParticipant:     TargetParticipantSnapshot | null;
    targetAC:              number;
    targetStorageId:       number | null;  // cached from TARGET to avoid re-fetch in POST_APPLY

    // PRE_RESOLVE
    hitModifier:     number;
    damageModifier:  number;
    healModifier:    number;
    hitAdvantage:    'advantage' | 'disadvantage' | null;
    damageAdvantage: 'advantage' | 'disadvantage' | null;
    healAdvantage:   'advantage' | 'disadvantage' | null;
    saveAdvantage:   'advantage' | 'disadvantage' | null;
    primaryDamageMultiplier:   number;  // precomputed from target stat effects; applied to finalDamage in APPLY
    elementalDamageMultiplier: number;  // precomputed from target stat effects; applied to finalElementalDamage in APPLY

    // RESOLVE
    hitRoll:     number | null;  // raw d20 result (stored in action log)
    hitTotal:    number | null;  // hitRoll + hitModifier (shown in Discord)
    isHit:       boolean | null;
    isCritical:  boolean;        // natural 20 — always hits, double dice
    isFumble:    boolean;        // natural 1  — always misses
    diceRolls:   number[];
    rawDamage:   number;         // sum of dice before modifier
    finalDamage: number;         // max(0, rawDamage + damageModifier)
    rawHeal:     number;
    finalHeal:   number;
    elementalDiceRolls:   number[];
    rawElementalDamage:   number;
    finalElementalDamage: number; // resistance interceptors scale this in APPLY
    saveRoll:          number | null;   // defender's raw d20 (null = no save triggered)
    saveTotal:         number | null;   // saveRoll + stat modifier
    savedSuccessfully: boolean | null;  // true = save succeeded and damage was halved

    // APPLY
    hpAfter:         number | null;
    knockedDown:     boolean;
    defeated:        boolean;
    absorbedDamage:  number;  // damage intercepted by guard absorption (guard entity took this instead)
    tempHpDrained:   number;  // temp HP consumed before real HP was touched
    helpConsumed:    boolean;  // actor had a Help advantage/disadvantage that was applied this action

    legendaryResistanceUsed: boolean;  // AI boss auto-spent a legendary resistance charge this action

    // POST_APPLY
    pendingReaction:        PendingReaction | null;
    concentrationSaveEvent: ConcentrationSaveEvent | null;

    // END
    actionId:              number | null;
    appliedBehaviorEffect: { effectName: string; guardedName: string | null; rounds: number } | null;
    appliedStatEffectNames: string[];
}
