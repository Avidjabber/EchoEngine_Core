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
redirect, resistance, concentration, DoT) is added by:
  a) attaching an interceptor to an existing phase, or
  b) filling in a currently no-op phase (POST_APPLY, parts of RESOLVE)

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
  POST_APPLY   No-op in stage 1. Stage 2+: reaction detection, concentration.
  END          Write action log, upsert cooldowns, decrement item uses.
  NPC_AI       No-op in stage 1. Stage 3+: AI action selection for the next
               entity if it is AI-controlled. Always the final phase.

Phases run strictly in this order. There is no branching or looping in the
runner — each phase receives the current context and transforms it. Interceptors
for a given phase run sorted by priority (ascending) before the phase itself.


─────────────────────────────────────────────
3. DISCIPLINE: LOAD ONCE / WRITE ONCE
─────────────────────────────────────────────

The pipeline enforces a hard load/write discipline:

  DB READ phases:   DECLARE (actor side) and TARGET (target side).
  DB WRITE phases:  APPLY (HP update, defeat flag) and END (log, cooldowns, uses).
  Pure phases:      VALIDATE, PRE_RESOLVE, RESOLVE, POST_APPLY — no DB access.

This means the middle four phases (VALIDATE → RESOLVE) are fully deterministic
given the same context input. They can be unit-tested by constructing a context
directly — no database required.

Interceptors must respect this discipline. An interceptor on PRE_RESOLVE should
not issue DB queries; if it needs additional data it should run at DECLARE
(priority-sorted before the phase) and stash it on the context. An interceptor
on APPLY may issue DB writes only if they are within its own effect scope (e.g.,
clearing a guard buffer after it absorbs damage).


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

  DECLARE
  ────────
  actor              — ActorSnapshot: entity name + all six stats
  profile            — ProfileSnapshot: label, dice, bonuses, actionCategoryId, dealsDamage flag
  combatMeta         — CombatMetaSnapshot: canSecondWind flag from CombatInitiationType
  existingActionCount — count of actions already logged this round (used for turnIndex in log)

  VALIDATE
  ─────────
  aborted            — true if the pipeline should halt immediately
  abortReason        — human-readable reason for the abort; returned as HTTP error

  TARGET
  ───────
  actualTargetId     — entity ID of the real target (may differ from input after stage 2 redirect)
  wasRedirected      — true if a guard effect changed the target
  originalTargetName — name of input.targetEntityId when redirected; null otherwise
  target             — TargetSnapshot: name, currentHp, maxHp, baseAc, dexterity
  targetParticipant  — TargetParticipantSnapshot: id, inSecondWind, isAiControlled
  targetAC           — final computed AC (baseAc + dex modifier + equipped AC bonus items)

  PRE_RESOLVE
  ────────────
  hitModifier        — stat modifier + profile.hitBonus
  damageModifier     — stat modifier + profile.damageBonus
  healModifier       — stat modifier + profile.healBonus

  RESOLVE
  ────────
  hitRoll            — raw d20 result (stored in action log as-is)
  hitTotal           — hitRoll + hitModifier (shown in Discord messages)
  isHit              — true if hitTotal >= targetAC
  diceRolls          — individual damage / heal dice results (array)
  rawDamage          — sum of diceRolls before modifier
  finalDamage        — max(0, rawDamage + damageModifier)
  rawHeal            — sum of heal dice before modifier (stage 2+)
  finalHeal          — max(0, rawHeal + healModifier) (stage 2+)

  APPLY
  ──────
  hpAfter            — target's HP after damage is applied (clamped to 0)
  knockedDown        — true if target hit 0 HP and second wind is being offered
  defeated           — true if target is eliminated (isDefeated set on participant)

  POST_APPLY
  ───────────
  pendingReaction    — populated when stage 2 reaction detection fires; null in stage 1

  END
  ────
  actionId           — ID of the newly created ActiveCombat_Action log row

  NPC_AI
  ───────
  No context fields written in stage 1. Stage 3+: this phase reads the next
  participant's isAiControlled flag and, if true, selects and queues an action
  using SpeciesCombatBehavior weights and target strategy. The selected action
  is executed via a recursive pipeline call before control returns to the caller.


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

Stage 1 passes an empty array. Stage 2+ will build interceptors for:
  TARGET phase    — guard redirect logic (check ActiveCombat_BehaviorEffect for
                    guard effect; if found, redirect actualTargetId to the guarding
                    entity and set wasRedirected / originalTargetName)
  PRE_RESOLVE     — stat effect roll modifiers (read ActiveCombat_StatEffect rows
                    of type hit_mod / damage_mod / heal_mod; add to the appropriate
                    modifier field)
  APPLY           — damage resistance / vulnerability / immunity (read
                    ActiveCombat_StatEffect rows of type damage_modifier; scale
                    ctx.finalDamage before APPLY writes HP)
  POST_APPLY      — reaction detection (check if defender has a reaction profile;
                    if so, populate ctx.pendingReaction and return to caller for
                    async Discord flow)

NPC_AI is not an interceptor target — it is a full phase. It is always last and
always runs (as a no-op) even in stage 1. This ensures the phase slot is reserved
and wired before any AI logic is added.


─────────────────────────────────────────────
6. ABORT MECHANISM
─────────────────────────────────────────────

Any phase or interceptor may halt the pipeline by setting:
  ctx.aborted     = true
  ctx.abortReason = 'Human-readable message'

The pipeline runner checks ctx.aborted after every interceptor and every phase.
On abort the current context (with aborted = true) is returned immediately.

The service layer (processAction) checks ctx.aborted and throws an HTTP error:
  if (ctx.aborted) throw new Error(ctx.abortReason ?? 'Action aborted')

Stage 1 abort triggers:
  — profile is null (item profile not found)
  — profile.actionCategoryId is null (misconfigured profile)
  — actor is null (entity not found)
  — combatMeta is null (combat not found)
  — profile.dealsDamage is true but targetEntityId is null


─────────────────────────────────────────────
7. DICE ROLLER INJECTION
─────────────────────────────────────────────

Source: apps/api/src/play/combat/engine/dice.ts

  type DiceRoller = (sides: number) => number

The roller is passed in as PipelineServices.roller. Production code uses
defaultRoller (Math.random). Tests can pass a deterministic roller:

  const fixedRoller = (sides: number) => sides;  // always max roll
  runCombatPipeline(input, { db: mockDb, roller: fixedRoller }, []);

rollDice(count, sides, roller) is the helper used by RESOLVE to produce the
diceRolls array.


─────────────────────────────────────────────
8. FILE STRUCTURE
─────────────────────────────────────────────

  apps/api/src/play/combat/engine/
    dice.ts                         — DiceRoller type, defaultRoller, rollDice helper
    combat-action-context.ts        — CombatActionContext and snapshot interfaces
    combat-interceptor.interface.ts — CombatInterceptor interface and CombatPhase type
    combat-pipeline.ts              — createContext, runCombatPipeline, PipelineServices

    phases/
      declare.ts      — DECLARE: DB reads for actor, profile, combat meta
      validate.ts     — VALIDATE: pure legality checks
      target.ts       — TARGET: DB reads for target entity, participant, AC
      pre-resolve.ts  — PRE_RESOLVE: pure modifier computation
      resolve.ts      — RESOLVE: dice rolls, hit/miss, damage total
      apply.ts        — APPLY: HP update, defeat / second wind DB writes
      post-apply.ts   — POST_APPLY: no-op in stage 1
      end.ts          — END: action log, cooldowns, item uses
      npc-ai.ts       — NPC_AI: no-op in stage 1; AI action selection in stage 3+

  apps/api/src/play/combat/
    play-combat.service.ts    — service; wires pipeline into processAction
    play-combat.controller.ts — thin HTTP surface; no logic beyond input validation
