COMBAT ACTION PIPELINE — IMPLEMENTATION REFERENCE
==================================================
Last updated: 2026-04-25

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
  APPLY        Write HP change to DB; set defeat / second wind flags.
  POST_APPLY   Reaction detection — queries DB to check if defender has
               equipped, non-suppressed, non-cooldown reaction profiles;
               populates ctx.pendingReaction if so. Skipped for AI defenders,
               defeated targets, and knocked-down targets.
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

  Exception — POST_APPLY reads DB: it queries ActiveCombat_BehaviorEffect
  (suppression check) and StoredItem (equipped reaction profiles). It does
  not write. Stage 3 saving throws may add further reads here.

This means phases VALIDATE through RESOLVE are fully deterministic given the
same context input. They can be unit-tested by constructing a context directly
— no database required.

Interceptors must respect this discipline. An interceptor that needs additional
data should run at DECLARE (reads) or APPLY (writes); it must not issue reads
during PRE_RESOLVE or RESOLVE, and must not issue writes during DECLARE or TARGET.


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

  DECLARE
  ────────
  actor              — ActorSnapshot: entity name + all six stats
  profile            — ProfileSnapshot: label, dice, bonuses, actionCategoryId,
                       dealsDamage, restoresHealth, isReactionAction, behavior
                       effect fields, elemental damage fields
  combatMeta         — CombatMetaSnapshot: canSecondWind, currentTurnOrder, isSpar
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
  target             — TargetSnapshot: name, userId, currentHp, maxHp, baseAc, dexterity
  targetParticipant  — TargetParticipantSnapshot: id, inSecondWind, isAiControlled
  targetAC           — final computed AC (baseAc + dex modifier + equipped AC bonus items)
                       Stage 2 ac-mods interceptor may further adjust this.

  PRE_RESOLVE
  ────────────
  hitModifier        — accumulated hit modifier (stat mod + profile.hitBonus + roll mods)
  damageModifier     — accumulated damage modifier (stat mod + profile.damageBonus + roll mods)
  healModifier       — accumulated heal modifier (stat mod + profile.healBonus + roll mods)
  hitAdvantage       — 'advantage' | 'disadvantage' | null (cancel each other out)
  damageAdvantage    — 'advantage' | 'disadvantage' | null
  healAdvantage      — 'advantage' | 'disadvantage' | null

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

  APPLY
  ──────
  hpAfter            — target's HP after damage/heal is applied
  knockedDown        — true if target hit 0 HP and second wind is being offered
  defeated           — true if target is eliminated (isDefeated set on participant)

  POST_APPLY
  ───────────
  pendingReaction    — populated when reaction detection fires; null if no reactions
                       available or defender is AI / suppressed / defeated / knocked down

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

STAGE 2 INTERCEPTORS  (STAGE_2_INTERCEPTORS array in interceptors/index.ts)
──────────────────────────────────────────────────────────────────────────────

  Phase       Priority  File                              Purpose
  ─────────── ────────  ───────────────────────────────── ──────────────────────────────────
  VALIDATE    0         stun-check.interceptor.ts         Abort if actor has deniesActions effect
  VALIDATE    1         taunt-check.interceptor.ts        Abort if actor is taunted and wrong target
  TARGET      0         guard-redirect.interceptor.ts     Redirect actualTargetId to guarding entity
  PRE_RESOLVE 0         stat-effect-modifiers.interceptor Adjust actor stats + roll mods from effects
  PRE_RESOLVE 1         ac-mods.interceptor.ts            Adjust targetAC from target's stat effects
  APPLY       1         damage-modifiers.interceptor.ts   Scale finalDamage/finalElementalDamage by
                                                          resistance, vulnerability, or immunity

  Priority gap: APPLY priority 0 is reserved for guard absorption (stage 3).
  damage-modifiers runs at priority 1 so resistances apply to the post-absorption amount.

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

Stage 1 abort triggers (validate.ts):
  — profile is null (item profile not found)
  — profile.actionCategoryId is null (misconfigured profile; reaction profiles exempt)
  — actor is null (entity not found)
  — combatMeta is null (combat not found)
  — actor's turnOrder does not match combat's currentTurnOrder (out of turn; reactions exempt)
  — profile.dealsDamage is true but targetEntityId is null
  — non-guard behavior effect profile has no target

Stage 2 abort triggers (interceptors):
  — actor has an active deniesActions behavior effect (stun-check)
  — actor is taunted and targetEntityId is not the taunter's entity (taunt-check)


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
      apply.ts        — APPLY: HP update (damage or heal), defeat / second wind DB writes
      post-apply.ts   — POST_APPLY: reaction detection for non-AI, non-suppressed defenders
      end.ts          — END: action log, cooldowns, item uses, behavior/stat effects
      npc-ai.ts       — NPC_AI: no-op in stages 1–3; AI action selection in stage 4

    interceptors/
      index.ts                          — STAGE_2_INTERCEPTORS array
      stun-check.interceptor.ts         — VALIDATE/0: deniesActions check
      taunt-check.interceptor.ts        — VALIDATE/1: forcesTargeting enforcement
      guard-redirect.interceptor.ts     — TARGET/0: redirect to guarding entity
      stat-effect-modifiers.interceptor.ts — PRE_RESOLVE/0: actor stat and roll mods
      ac-mods.interceptor.ts            — PRE_RESOLVE/1: target AC mods from stat effects
      damage-modifiers.interceptor.ts   — APPLY/1: resistance / vulnerability / immunity

  apps/api/src/play/combat/
    play-combat.service.ts    — service; wires pipeline into processAction / processReaction
    play-combat.controller.ts — thin HTTP surface; no logic beyond input validation
