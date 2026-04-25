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
  - processReaction stub (no-op; HTTP surface exists for bot compatibility)
  - _processTurnEnd: cooldown tick only
  - _processTurnStart: no-op stub

What is explicitly deferred:
  - Guard redirect (stage 2)
  - Damage resistance / vulnerability / immunity (stage 2)
  - Healing actions (stage 2)
  - Behavior effects — guard, taunt, parry, absorb, reflect, stun (stage 2)
  - Stat effects — hit mods, damage mods, AC mods, DoT, HoT, advantage (stage 2)
  - Reactions (stage 2)
  - Saving throws (stage 3+)
  - AoE / multi-target (stage 3+)
  - NPC AI action selection (stage 3+; NPC_AI phase stub exists but is a no-op)
  - Mid-combat joins and summons (stage 3+)
  - Pre-combat effects (Entity_PreCombatEffect → ActiveCombat_StatEffect, stage 2+)


─────────────────────────────────────────────
STAGE 2 — EFFECTS AND REACTIONS  ← IN PROGRESS
─────────────────────────────────────────────

Adds the full effect layer and the reaction system.

Implementation order
  Group 1 (self-contained, no prerequisites):
    [x] Healing actions

  Group 2 (effect infrastructure — unlocks Groups 3 and 4):
    [ ] Behavior effects
    [ ] Stat effects on action use

  Group 3 (consumers of Group 2):
    [ ] Guard redirect
    [ ] Stat effect modifiers
    [ ] Damage resistance / vulnerability / immunity

  Group 4 (heaviest — requires Groups 2 and 3):
    [ ] Reactions
    [ ] Pre-combat effects

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Healing actions  [ ] GROUP 1
  If profile.restoresHealth: roll heal dice, set ctx.diceRolls / ctx.rawHeal / ctx.finalHeal.
  APPLY phase extended: if ctx.finalHeal > 0, update HP upward (capped at maxHp).
  No hit roll — healing always lands.
  Outcome kind: 'heal'.

Behavior effects  [ ] GROUP 2
  When a profile action's actionType has an associated CombatEffectType:
  upsert ActiveCombat_BehaviorEffect for the target with roundsRemaining.
  _processTurnStart: decrement roundsRemaining, delete rows at 0.

Stat effects on action use  [ ] GROUP 2
  ItemEquipmentProfile_StatEffect rows: roll applicationChance; if it fires,
  create ActiveCombat_StatEffect for the target.
  _processTurnEnd: decrement roundsRemaining on stat effects; delete at 0.
  DoT / HoT: fire at round end, write HP, emit RoundEndEvent rows.

Guard redirect  [ ] GROUP 3
  TARGET phase interceptor, priority 0.
  Read ActiveCombat_BehaviorEffect for guard effects protecting input.targetEntityId.
  If found: set ctx.actualTargetId → guarding entity, ctx.wasRedirected = true,
  ctx.originalTargetName = name of original target.
  Guard partially absorbs damage → reduce ctx.finalDamage in APPLY interceptor
  by guard's percentModifier before HP is written.

Stat effect modifiers  [ ] GROUP 3
  PRE_RESOLVE interceptor.
  Read ActiveCombat_StatEffect rows for the actor:
    RollMod rows → add to ctx.hitModifier / ctx.damageModifier / ctx.healModifier
    RollAdvantage rows → affect RESOLVE dice rolling (roll twice, keep high/low)

Damage resistance / vulnerability / immunity  [ ] GROUP 3
  APPLY interceptor, priority 0.
  Read ActiveCombat_StatEffect rows for the target (type: damage_modifier).
  Scale ctx.finalDamage before APPLY writes HP:
    resistance: × 0.5
    vulnerability: × 2.0
    immunity: set to 0

Reactions  [ ] GROUP 4
  POST_APPLY phase.
  After a hit resolves, check if the defender has equipped reaction-category actions.
  If so: populate ctx.pendingReaction; return to service layer.
  Service layer returns pendingReaction to controller; bot posts reaction prompt.
  processReaction is fully wired (currently a no-op stub).

Pre-combat effects  [ ] GROUP 4
  At startCombat: for each participant, query Entity_PreCombatEffect rows.
  Create ActiveCombat_StatEffect rows for active pre-combat buffs.
  Create cooldown rows if equipmentProfileId is set.


─────────────────────────────────────────────
STAGE 3 — NPC AI, SAVING THROWS, AOE  (future)
─────────────────────────────────────────────

NPC AI (NPC_AI phase — final phase in the pipeline)
  NPC_AI is a dedicated pipeline phase, always the last to run. In stage 1 it is
  a no-op stub (npc-ai.ts). In stage 3 it reads the next participant's
  isAiControlled flag and, if true:
    1. Reads SpeciesCombatBehavior weights (attackWeight, buffWeight, debuffWeight,
       healWeight) and normalises them into a probability distribution.
    2. Selects an action category based on what the entity has available.
    3. Selects a target using offensiveTargetStrategyId or supportTargetStrategyId
       weighted against strategyWeight (vs. random fallback).
    4. Executes the chosen action via a recursive runCombatPipeline call.
  advanceTurn no longer skips AI turns in the bot loop — the NPC_AI phase handles
  them inline as part of the same pipeline run.

Saving throws
  RESOLVE phase extended: profiles with savingThrowStat trigger a defender roll
  (d20 + stat modifier) vs. saveDC. On save: damage halved or effect skipped.

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
