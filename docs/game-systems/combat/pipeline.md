COMBAT ACTION PIPELINE — IMPLEMENTATION REFERENCE
==================================================
Last updated: 2026-04-28

Read system.md first for design context. See service.md for the layer that wraps
this engine — the turn loop, reaction roundtrip, builtin actions, and combat end.

  system.md  — design reference (schema, behavior effects, stat effects)
  service.md — service layer, turn loop, HTTP surface
  stages.md  — development stage history


This file documents the internal architecture of the combat action pipeline.
Read this before adding new action types, implementing interceptors, or extending
any phase with new logic.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Every action taken during combat (attack, heal, buff, item use, reaction) runs
through a single sequential pipeline. The pipeline is a list of named phases;
each phase transforms a shared mutable context object. The caller receives the
final context and maps it to an HTTP response.

The pipeline is designed to be extended without rewrites. New behavior (guard
redirect, resistance, DoT) is added by:
  a) attaching an interceptor to an existing phase, or
  b) filling in a currently no-op phase (parts of RESOLVE, NPC_AI)

Phase code itself almost never changes after it is written. Interceptors are the
extension point.

Source entry point: apps/api/src/play/combat/engine/combat-pipeline.ts


─────────────────────────────────────────────
2. PHASE ORDER
─────────────────────────────────────────────

  DECLARE      Load actor data, profile data, and combat meta from DB.
  VALIDATE     Pure checks — abort if the action cannot legally proceed.
  TARGET       Load target data from DB; compute target AC.
  PRE_RESOLVE  Pure computation — derive hit, damage, and heal modifiers.
  RESOLVE      Roll dice — determine hit/miss, damage, or heal total.
  APPLY        Write HP change to DB; set defeat / death-save flags.
  POST_APPLY   Concentration save + reaction detection. If the target is
               concentrating on an effect and took damage, rolls a CON save
               (DC = max(10, half total damage)); on failure, deletes the
               effect. Then queries DB to check if the defender has equipped,
               non-cooldown reaction profiles; populates ctx.pendingReaction
               if so. Skipped entirely for AI defenders, defeated targets,
               and knocked-down targets. Reactions are additionally suppressed
               for AoE actions and reaction chains.
  END          Write action log, upsert cooldowns, decrement item uses,
               apply behavior effects and stat effects.
  NPC_AI       No-op in stages 1–3. Stage 4: AI action selection for the
               next entity if it is AI-controlled. Always the final phase.

Phases run strictly in this order. There is no branching or looping in the
runner — each phase receives the current context and transforms it. Interceptors
for a given phase run sorted by priority (ascending) before the phase itself.


─────────────────────────────────────────────
3. DISCIPLINE: LOAD ONCE / WRITE ONCE
─────────────────────────────────────────────

The pipeline enforces a hard load/write discipline:

  DB READ phases:   DECLARE (actor side) and TARGET (target side).
  DB WRITE phases:  APPLY (HP update, defeat flag) and END (log, cooldowns,
                    uses, behavior/stat effects).
  Pure phases:      VALIDATE, PRE_RESOLVE, RESOLVE — no DB access.

  Exception — POST_APPLY reads and conditionally writes DB: it reads
  ActiveCombat_BehaviorEffect for the concentrating effect name, then
  deletes that effect when the concentration save fails. It also reads
  ActiveCombat_Participant_ActionCooldown and StoredItem to find available
  reaction profiles. It does not write action-log or HP state.

This means phases VALIDATE through RESOLVE are fully deterministic given the
same context input. They can be unit-tested by constructing a context directly
— no database required.

This discipline applies to phase runners (the runXxx functions). Interceptors
are DB-capable at any phase — most COMBAT_INTERCEPTORS issue reads. The
constraint on interceptors is: do not issue DB writes from an interceptor unless
it is scoped to APPLY or END, and only for the state that interceptor owns
(e.g., temp-hp draining the participant's buffer, dispel clearing effects).


─────────────────────────────────────────────
4. COMBATACTIONCONTEXT
─────────────────────────────────────────────

The full mutable context object. Fields are grouped by the phase that writes them.
Source type: apps/api/src/play/combat/engine/combat-action-context.ts

  FROZEN INPUT (set at context creation, never mutated)
  ──────────────────────────────────────────────────────
  input.combatId         — the active combat ID
  input.actorEntityId    — entity taking the action
  input.profileId        — ItemEquipmentProfile ID used
  input.storedItemId     — StoredItem ID consumed / tracked
  input.targetEntityId   — entity ID the actor aimed at (null = self or no target)
  input.roundNumber      — current round number for log ordering
  input.isReaction       — true when this invocation is a reaction (not a main turn action)
  input.aoeIndex         — null = single-target; 0 = first AoE target (full END, no reactions);
                           1+ = subsequent AoE target (skip cooldown/use tracking, no reactions)

  DECLARE
  ────────
  actor              — ActorSnapshot: entity name + all six stats
  actorParticipant   — ActorParticipantSnapshot: isUnconscious, helpRollMod,
                       concentratingOnEffectId; null if not found
  profile            — ProfileSnapshot: label, dice, bonuses, actionCategoryId,
                       dealsDamage, restoresHealth, isReactionAction, behavior
                       effect fields, elemental damage fields, saving throw fields,
                       summonSpeciesId / summonDiceCount / summonDiceSides
  combatMeta         — CombatMetaSnapshot: usesDeathSaves, currentTurnOrder, isSpar
  existingActionCount — count of actions already logged this round (turnIndex in log)
  actorTurnOrder      — actor's turnOrder from their participant row; null if not found
  actorParticipantId  — actor's ActiveCombat_Participant.id; null if not found

  VALIDATE
  ─────────
  aborted            — true if the pipeline should halt immediately
  abortReason        — human-readable reason for the abort; returned as error

  TARGET
  ───────
  actualTargetId     — entity ID of the real target (may differ from input after redirect)
  wasRedirected      — true if a guard effect changed the target
  originalTargetName — name of input.targetEntityId when redirected; null otherwise
  target             — TargetSnapshot: name, userId, currentHp, maxHp, baseAc,
                       stats (all six base stats as Record<string, number>)
  targetParticipant  — TargetParticipantSnapshot: id, isUnconscious, isAiControlled,
                       hasUsedReaction, tempHp, legendaryResistancesRemaining,
                       concentratingOnEffectId
  targetAC           — final computed AC (baseAc + dex modifier + equipped AC bonus items);
                       ac-mods interceptor may further adjust this.
  targetStorageId    — target's storage ID, cached from TARGET to avoid a re-fetch in POST_APPLY

  PRE_RESOLVE
  ────────────
  hitModifier        — accumulated hit modifier (stat mod + profile.hitBonus + roll mods)
  damageModifier     — accumulated damage modifier (stat mod + profile.damageBonus + roll mods)
  healModifier       — accumulated heal modifier (stat mod + profile.healBonus + roll mods)
  hitAdvantage       — 'advantage' | 'disadvantage' | null (cancel each other out)
  damageAdvantage    — 'advantage' | 'disadvantage' | null
  healAdvantage      — 'advantage' | 'disadvantage' | null
  saveAdvantage      — 'advantage' | 'disadvantage' | null (e.g., dodge grants DEX save advantage)
  primaryDamageMultiplier   — resistance/vulnerability/immunity multiplier precomputed by
                              ac-mods interceptor; applied to finalDamage in APPLY
  elementalDamageMultiplier — same as above but for finalElementalDamage

  RESOLVE
  ────────
  hitRoll            — raw d20 result (stored in action log as-is)
  hitTotal           — hitRoll + hitModifier (shown in Discord messages)
  isHit              — true if natural 20, or (hitTotal >= targetAC and not natural 1)
  isCritical         — true if hitRoll = 20 (always hits, doubles damage dice)
  isFumble           — true if hitRoll = 1  (always misses)
  diceRolls          — individual damage / heal dice results (array)
  rawDamage          — sum of diceRolls before modifier
  finalDamage        — max(0, rawDamage + damageModifier); scaled by APPLY interceptors
  rawHeal            — sum of heal dice before modifier
  finalHeal          — max(0, rawHeal + healModifier)
  elementalDiceRolls   — individual elemental damage dice (empty if no elemental dice)
  rawElementalDamage   — sum of elemental dice before any scaling
  finalElementalDamage — post-resistance scaling (set to rawElementalDamage by RESOLVE;
                         resistance interceptors scale it in APPLY)
  saveRoll           — defender's raw d20 for a saving throw; null if no save triggered
  saveTotal          — saveRoll + defender's stat modifier; null if no save triggered
  savedSuccessfully  — true if saveTotal >= profile.saveDC (damage halved); null if no save

  APPLY
  ──────
  hpAfter            — target's HP after damage/heal is applied
  knockedDown        — true if target hit 0 HP and entered death save state (isUnconscious set)
  defeated           — true if target is eliminated (isDefeated set on participant)
  absorbedDamage     — damage intercepted by guard absorption (guard absorbed this fraction
                       before the ward's real HP was touched)
  tempHpDrained      — temp HP drained from the target's buffer before real HP was touched
  helpConsumed       — actor had a Help advantage/disadvantage that was applied this action;
                       END clears the helpRollMod field on the participant
  legendaryResistanceUsed — AI boss auto-spent a legendary resistance charge this action
                            to flip a failed saving throw to a success

  POST_APPLY
  ───────────
  pendingReaction        — populated when reaction detection fires; null if no reactions
                           available or defender is AI / defeated / knocked down /
                           already used reaction this round
  concentrationSaveEvent — set when a concentrating target was hit and a CON save was
                           rolled; contains roll, total, DC, saved flag, and effect name;
                           null if no concentration check triggered

  END
  ────
  actionId                — ID of the newly created ActiveCombat_Action log row
  appliedBehaviorEffect   — { effectName, guardedName, rounds } if a behavior effect
                            was applied this action; null otherwise
  appliedStatEffectNames  — display names of stat effects applied this action (may be empty)


─────────────────────────────────────────────
5. INTERCEPTOR INTERFACE
─────────────────────────────────────────────

Source: apps/api/src/play/combat/engine/combat-interceptor.interface.ts

  interface CombatInterceptor {
      phase:    CombatPhase;    // which phase this runs before
      priority: number;         // lower = runs first (0 is highest priority)
      apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void>;
  }

Interceptors are passed to runCombatPipeline as the third argument:
  runCombatPipeline(input, { db, roller }, [interceptorA, interceptorB])

Within a phase, interceptors run in ascending priority order before the phase
function itself. Any interceptor (or any phase) can set ctx.aborted = true to
halt the pipeline immediately — subsequent interceptors and phases are skipped.

COMBAT INTERCEPTORS  (COMBAT_INTERCEPTORS array in interceptors/index.ts)
──────────────────────────────────────────────────────────────────────────────

  Phase       Priority  File                              Purpose
  ─────────── ────────  ───────────────────────────────── ──────────────────────────────────
  VALIDATE    0         stun-check.interceptor.ts         Abort if actor has deniesActions effect
  VALIDATE    1         taunt-check.interceptor.ts        Abort if actor is taunted and not targeting
                                                          the taunter (or using an AoE action)
  TARGET      0         guard-redirect.interceptor.ts     Redirect actualTargetId to guarding entity
  TARGET      1         dodge-check.interceptor.ts        Apply hit disadvantage if target is dodging;
                                                          set saveAdvantage for DEX saves vs a dodging target
  PRE_RESOLVE -1        help-check.interceptor.ts         Apply Help advantage/disadvantage to hitAdvantage
  PRE_RESOLVE 0         stat-effect-modifiers.interceptor.ts Adjust actor stats + roll mods from active
                                                          stat effects
  PRE_RESOLVE 1         ac-mods.interceptor.ts            Adjust targetAC from target's stat effects;
                                                          precompute primaryDamageMultiplier /
                                                          elementalDamageMultiplier
  APPLY       -1        temp-hp.interceptor.ts            Drain target's temp HP buffer before real HP
                                                          is touched; reduces finalDamage proportionally
  APPLY       0         guard-absorption.interceptor.ts   Scale finalDamage/finalElementalDamage by
                                                          guard's percentModifier when redirected
  APPLY       1         damage-modifiers.interceptor.ts   Apply precomputed multipliers for resistance,
                                                          vulnerability, or immunity
  APPLY       2         dispel.interceptor.ts             Delete all stat + behavior effects from target
                                                          when profile.behaviorEffectRemovesEffects is set

NPC_AI is not an interceptor target — it is a full phase. It is always last and
always runs (as a no-op) even in stages 1–3. This ensures the phase slot is reserved
and wired before any AI logic is added.


─────────────────────────────────────────────
6. ABORT MECHANISM
─────────────────────────────────────────────

Any phase or interceptor may halt the pipeline by setting:
  ctx.aborted     = true
  ctx.abortReason = 'Human-readable message'

The pipeline runner checks ctx.aborted after every interceptor and every phase.
On abort the current context (with aborted = true) is returned immediately.

The service layer (processAction) checks ctx.aborted and throws an error:
  if (ctx.aborted) throw new Error(ctx.abortReason ?? 'Action aborted')

VALIDATE phase abort triggers (validate.ts):
  — profile, actor, combatMeta, or actorParticipantId not loaded (data not found)
  — actor is unconscious (actorParticipant.isUnconscious = true)
  — profile.actionCategoryId is null (misconfigured profile; reaction profiles exempt)
  — actor's turnOrder does not match combat's currentTurnOrder (out of turn; reactions exempt)
  — profile.dealsDamage is true but targetEntityId is null
  — profile.restoresHealth is true but targetEntityId is null
  — non-guard behavior effect profile has no target (behaviorEffectTypeId set,
    redirectsDamage false, targetEntityId null)

TARGET phase abort triggers (target.ts):
  — target participant has hasFled = true
  — target participant has isDefeated = true
  — target is unconscious and the action is not a healing action

Interceptor abort triggers:
  — actor has an active deniesActions behavior effect (stun-check, VALIDATE/0)
  — actor is taunted and using an AoE action, or targeting a non-taunter
    (taunt-check, VALIDATE/1)


─────────────────────────────────────────────
7. DICE ROLLER INJECTION
─────────────────────────────────────────────

Source: apps/api/src/utils/dice.ts

  type DiceRoller = (sides: number) => number

The roller is passed in as PipelineServices.roller. Production code uses
defaultRoller (Math.random). Tests can pass a deterministic roller:

  const fixedRoller = (sides: number) => sides;  // always max roll
  runCombatPipeline(input, { db: mockDb, roller: fixedRoller }, []);

rollDice(count, sides, roller) is the helper used by RESOLVE to produce the
diceRolls array. rollWithAdvantage and rollDiceWithAdvantage in resolve.ts
handle advantage/disadvantage by rolling twice and picking the higher or lower result.


─────────────────────────────────────────────
8. FILE STRUCTURE
─────────────────────────────────────────────

  apps/api/src/utils/
    dice.ts                         — DiceRoller type, defaultRoller, rollDice helper

  apps/api/src/play/combat/engine/
    combat-action-context.ts        — CombatActionContext and snapshot interfaces
    combat-interceptor.interface.ts — CombatInterceptor interface and CombatPhase type
    combat-pipeline.ts              — createContext, runCombatPipeline, PipelineServices

    phases/
      declare.ts      — DECLARE: DB reads for actor, profile, combat meta
      validate.ts     — VALIDATE: pure legality checks (turn order, target, reaction flags)
      target.ts       — TARGET: DB reads for target entity, participant, AC
      pre-resolve.ts  — PRE_RESOLVE: pure modifier computation from actor stats
      resolve.ts      — RESOLVE: dice rolls, hit/miss, critical/fumble, elemental damage
      apply.ts        — APPLY: HP update (damage or heal), defeat / death-save DB writes
      post-apply.ts   — POST_APPLY: concentration saves + reaction detection
      end.ts          — END: action log, cooldowns, item uses, behavior/stat effects
      npc-ai.ts       — NPC_AI: no-op in stages 1–3; AI action selection in stage 4

    interceptors/
      index.ts                          — COMBAT_INTERCEPTORS array
      stun-check.interceptor.ts         — VALIDATE/0: deniesActions check
      taunt-check.interceptor.ts        — VALIDATE/1: forcesTargeting enforcement
      guard-redirect.interceptor.ts     — TARGET/0: redirect to guarding entity
      dodge-check.interceptor.ts        — TARGET/1: hit disadvantage + DEX save advantage vs dodge
      help-check.interceptor.ts         — PRE_RESOLVE/-1: Help advantage/disadvantage application
      stat-effect-modifiers.interceptor.ts — PRE_RESOLVE/0: actor stat and roll mods
      ac-mods.interceptor.ts            — PRE_RESOLVE/1: target AC mods; precompute damage multipliers
      temp-hp.interceptor.ts            — APPLY/-1: drain temp HP buffer before real HP
      guard-absorption.interceptor.ts   — APPLY/0: guard percentModifier scaling when redirected
      damage-modifiers.interceptor.ts   — APPLY/1: apply precomputed resistance/vulnerability/immunity
      dispel.interceptor.ts             — APPLY/2: clear all effects when removesEffects is set

  apps/api/src/play/combat/
    play-combat.service.ts    — service; wires pipeline into processAction / processReaction
    play-combat.controller.ts — thin HTTP surface; no logic beyond input validation
