COMBAT PIPELINE — STAGE ROADMAP
================================
Last updated: 2026-04-25

The combat action pipeline is built in stages. Each stage leaves a fully
working combat loop — no rewrites, only additions. New capabilities are added
as interceptors or by filling in currently no-op phases.


─────────────────────────────────────────────
STAGE 1 — BASIC ATTACK LOOP  ✓ COMPLETE
─────────────────────────────────────────────

Scope: minimal viable combat. Single-target hit-roll attacks. HP tracking.
No effects, no reactions, no healing, no behavior effects.

What's included:
  - Full pipeline scaffolding (all 8 phases, interceptor interface, abort mechanism)
  - Initiative roll and turn order at combat start
  - d20 hit roll + DEX/STR/etc. modifier vs. target AC
  - Damage dice + modifier → HP update
  - Defeat on HP ≤ 0 (AI entities and post-second-wind players)
  - Second wind prompt for eligible player-controlled entities
  - Fleeing (combat type flag gates availability)
  - Per-action cooldown tracking (roundsRemaining decrement at turn end)
  - Item use limits (usesRemaining, dailyUsesRemaining decremented per use)
  - Action log (ActiveCombat_Action) written every action
  - XP distribution on combat end (event-combat pool + spar/fight reward rows)
  - processReaction HTTP surface exists; fully wired in stage 2
  - _processTurnEnd: cooldown tick only (stat effect decrement, DoT/HoT added in stage 2)
  - _processTurnStart: behavior effect decrement (inlined into advanceTurn transaction in stage 2)

What is explicitly deferred:
  - Guard redirect (stage 2)
  - Damage resistance / vulnerability / immunity (stage 2)
  - Healing actions (stage 2)
  - Behavior effects — guard, taunt, parry, absorb, reflect, stun (stage 2)
  - Stat effects — hit mods, damage mods, AC mods, DoT, HoT, advantage (stage 2)
  - Reactions (stage 2)
  - Saving throws (stage 3)
  - AoE / multi-target (stage 3)
  - Mid-combat joins and summons (stage 3)
  - Pre-combat effects (Entity_PreCombatEffect → ActiveCombat_StatEffect, stage 2+)
  - NPC AI action selection (stage 4; NPC_AI phase stub exists but is a no-op)


─────────────────────────────────────────────
STAGE 2 — EFFECTS AND REACTIONS  ✓ COMPLETE
─────────────────────────────────────────────

Adds the full effect layer and the reaction system.

Implementation order
  Group 1 (self-contained, no prerequisites):
    [x] Healing actions

  Group 2 (effect infrastructure — unlocks Groups 3 and 4):
    [x] Behavior effects
    [x] Stat effects on action use

  Group 3 (consumers of Group 2):
    [x] Guard redirect (TARGET phase — redirection only)
    [x] Stat effect modifiers
    [x] Damage resistance / vulnerability / immunity
    [x] Guard absorption (APPLY phase — deferred to stage 3, now complete)

  Group 4 (heaviest — requires Groups 2 and 3):
    [x] Reactions
    [x] Pre-combat effects

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Healing actions  [x] GROUP 1
  If profile.restoresHealth: roll heal dice, set ctx.diceRolls / ctx.rawHeal / ctx.finalHeal.
  APPLY phase extended: if ctx.finalHeal > 0, update HP upward (capped at maxHp).
  No hit roll — healing always lands.
  Outcome kind: 'heal'.

Behavior effects  [x] GROUP 2
  When a profile action's actionType has an associated CombatEffectType:
  upsert ActiveCombat_BehaviorEffect for the target with roundsRemaining.
  At the start of the source participant's next turn: delete rows at roundsRemaining=1,
  decrement all others. (Inlined into advanceTurn as an atomic transaction.)

Stat effects on action use  [x] GROUP 2
  ItemEquipmentProfile_StatEffect rows: roll applicationChance; if it fires,
  create ActiveCombat_StatEffect for the target.
  At turn end: delete stat effect rows at roundsRemaining=1 (after their final DoT/HoT
  tick fires), decrement all others. DoT/HoT fire at round end, write HP, emit
  RoundEndEvent rows. Defeat-by-DoT is atomic (HP + isDefeated + deleteMany).

Guard redirect  [x] GROUP 3
  TARGET phase interceptor, priority 0.
  Read ActiveCombat_BehaviorEffect for guard effects protecting input.targetEntityId.
  If found: set ctx.actualTargetId → guarding entity, ctx.wasRedirected = true,
  ctx.originalTargetName = name of original target.
  Damage is fully dealt to the redirected target (guarding entity).
  Partial absorption of that damage is a separate APPLY interceptor — see stage 3.

Guard absorption  [x] GROUP 3 — DEFERRED TO STAGE 3, NOW COMPLETE
  APPLY phase interceptor, priority 0 (runs before damage-modifiers at priority 1).
  When ctx.wasRedirected is true: read the guard effect's percentModifier from
  ActiveCombat_BehaviorEffect. Reduce ctx.finalDamage to:
    ctx.finalDamage = Math.floor(ctx.finalDamage * percentModifier)
  This represents the guard absorbing a fraction of the incoming damage.
  Resistances and immunities (priority 1) then apply to the post-absorption amount.

Stat effect modifiers  [x] GROUP 3
  PRE_RESOLVE interceptor, priority 0 (runs before runPreResolve).
  Read ActiveCombat_StatEffect rows for the actor:
    StatMod rows (null context) → adjust ctx.actor.stats values in-place so that
      runPreResolve derives the stat modifier from the buffed/debuffed stat value
    RollMod rows → add directly to ctx.hitModifier / ctx.damageModifier / ctx.healModifier
    RollAdvantage rows → set ctx.hitAdvantage / ctx.damageAdvantage / ctx.healAdvantage
      (advantage and disadvantage cancel each other out per D&D 5e rules)

Damage resistance / vulnerability / immunity  [x] GROUP 3
  APPLY interceptor, priority 1 (runs after guard absorption at priority 0).
  Read ActiveCombat_StatEffect rows for the target's damage modifier effects.
  Scale ctx.finalDamage and ctx.finalElementalDamage per matching damageTypeId:
    resistance:    Math.floor(amount × modifier)  — typically 0.5
    vulnerability: Math.floor(amount × modifier)  — typically 2.0
    immunity:      0 (isImmune flag overrides modifier)
  Untyped damage (null damageTypeId) bypasses all scaling.

Reactions  [x] GROUP 4
  POST_APPLY phase.
  After a hit resolves, check if the defender has equipped, non-suppressed,
  non-cooldown reaction-category actions. If so: populate ctx.pendingReaction.
  Service layer returns pendingReaction to controller; bot posts reaction prompt.
  processReaction is fully wired.

Pre-combat effects  [x] GROUP 4
  At startCombat: for each participant, query Entity_PreCombatEffect rows.
  Create ActiveCombat_StatEffect rows for active pre-combat buffs.
  Create cooldown rows if equipmentProfileId is set.


─────────────────────────────────────────────
STAGE 3 — GUARD ABSORPTION, SAVING THROWS, AOE, JOINS
─────────────────────────────────────────────

Guard absorption  (carried over from stage 2 — see GROUP 3 entry above)
  APPLY phase interceptor, priority 0.
  When ctx.wasRedirected is true: read percentModifier from the guard
  BehaviorEffect and reduce ctx.finalDamage proportionally before APPLY writes HP.

Saving throws  [x]
  RESOLVE phase extended: profiles with savingThrowStat trigger a defender roll
  (d20 + stat modifier) vs. saveDC. On save: damage halved or effect skipped.
  Schema: savingThrowStatId + saveDC on ItemEquipmentProfile;
          saveRoll + savedSuccessfully on ActiveCombat_Action.
  Context: saveRoll, saveTotal, savedSuccessfully set in RESOLVE.
  Halving applies to both finalDamage and finalElementalDamage before APPLY interceptors run.

AoE / multi-target
  Pipeline currently processes one target per call. Multi-target actions will
  require either: (a) repeated pipeline runs with the same input per target,
  or (b) a TARGET-phase that loops over all valid targets and applies RESOLVE /
  APPLY per entity, accumulating results into a results array on the context.

Mid-combat joins and summons
  joinCombat endpoint: roll initiative, insert participant at correct turnOrder,
  increment all higher turnOrder values.
  Summon: triggered from an action's summonSpeciesId, spawns entity + loadout,
  calls join logic.


─────────────────────────────────────────────
STAGE 4 — NPC AI  (future)
─────────────────────────────────────────────

NPC AI (NPC_AI phase — final phase in the pipeline)
  NPC_AI is a dedicated pipeline phase, always the last to run. In stages 1–3 it
  is a no-op stub (npc-ai.ts). In stage 4 it reads the next participant's
  isAiControlled flag and, if true:
    1. Reads SpeciesCombatBehavior weights (attackWeight, buffWeight, debuffWeight,
       healWeight) and normalises them into a probability distribution.
    2. Selects an action category based on what the entity has available.
    3. Selects a target using offensiveTargetStrategyId or supportTargetStrategyId
       weighted against strategyWeight (vs. random fallback).
    4. Executes the chosen action via a recursive runCombatPipeline call.
  advanceTurn no longer skips AI turns in the bot loop — the NPC_AI phase handles
  them inline as part of the same pipeline run.
