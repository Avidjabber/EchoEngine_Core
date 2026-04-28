COMBAT SERVICE — IMPLEMENTATION REFERENCE
==========================================
Last updated: 2026-04-28

Read system.md and pipeline.md before this. This file documents the service
layer that wraps the engine and connects it to the HTTP surface.

  system.md            — design reference (schema, behavior effects, stat effects)
  pipeline.md          — engine phases, context fields, interceptors
  stages.md            — development stage history
  missing-mechanics.md — unimplemented D&D 5.5e features

Source files:
  apps/api/src/play/combat/play-combat.service.ts    — all game logic
  apps/api/src/play/combat/play-combat.controller.ts — HTTP surface (no logic)


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

The service sits between the HTTP controller and the pipeline engine.

  Combat lifecycle  — startCombat, advanceTurn, flee, joinCombat, markDeceased
  Action resolution — processAction, processReaction, processBuiltinAction
  Turn bookkeeping  — DoT/HoT ticks, cooldown/stat-effect decrements
  Combat end        — end detection, outcome write, XP distribution
  Supporting reads  — getParticipants, getAvailableActions, targeting queries

The controller is a thin HTTP wrapper: it validates that required fields are
present and delegates to the service. No game logic lives in the controller.


─────────────────────────────────────────────
2. HTTP SURFACE
─────────────────────────────────────────────

  Method  Route                                   Service method
  ──────  ──────────────────────────────────────  ──────────────────────────
  GET     /play/combat/invite-targets             findInviteTargets
  GET     /play/combat/signup-targets             findSignupTargets
  POST    /play/combat/start                      startCombat
  GET     /play/combat/:id/participants           getParticipants
  GET     /play/combat/:id/available-actions      getAvailableActions
  POST    /play/combat/:id/process-builtin-action processBuiltinAction
  POST    /play/combat/:id/process-action         processAction
  POST    /play/combat/:id/process-reaction       processReaction
  POST    /play/combat/:id/advance-turn           advanceTurn
  POST    /play/combat/:id/distribute-xp          distributeCombatXp
  POST    /play/combat/:id/mark-deceased          markDeceased
  POST    /play/combat/:id/flee                   flee
  POST    /play/combat/:id/join                   joinCombat


─────────────────────────────────────────────
3. TURN LOOP
─────────────────────────────────────────────

The sequence of calls that makes up a standard player turn:

  1. GET /:id/available-actions?entityId=X&category=main|bonus|item
     Returns AvailableAction[]. Builtin Dodge and Help are prepended for main
     actions. Profiles on cooldown are listed but flagged isOnCooldown = true.

  2. Player picks an action. Bot calls one of:
       POST /:id/process-builtin-action  — Dodge or Help (bypasses pipeline; see §8)
       POST /:id/process-action          — all item-based actions

     Both return ActionResult or ActionResult[] (AoE / multiattack).

  3. REACTION CHECK
     If ActionResult.pendingReaction is set, the bot prompts the defender.
     When the defender responds, bot calls:
       POST /:id/process-reaction
     Returns a single ActionResult. No further reactions chain from a reaction.
     See §9 for the full roundtrip.

  4. Repeat steps 1–3 for bonus actions and item interactions as needed.

  5. POST /:id/advance-turn  { currentEntityId }
     Ticks DoT/HoT, decrements cooldowns and stat-effect durations, determines
     the next entity, rolls death saves if needed, checks for combat end.
     Returns AdvanceTurnResult.

  6. If AdvanceTurnResult.combatEnded = true:
       POST /:id/distribute-xp
       POST /:id/mark-deceased  { entityId }  — for each mortallyWounded entry


─────────────────────────────────────────────
4. STARTING COMBAT
─────────────────────────────────────────────

startCombat(guildId, type: 'spar' | 'fight', teams: StartCombatTeam[])

  1. Resolves energy cost from Guild_ActionConfig for the combat type.
  2. Removes team members whose currentEnergy < energyCost; reports them in
     removedEntityIds.
  3. Returns { success: false } if fewer than 2 teams have eligible members.
  4. Rolls initiative for each eligible entity: d20 + DEX modifier.
     Ties broken by: higher DEX → higher tiebreaker d20.
  5. Creates ActiveCombat with all participant rows inside a transaction; deducts
     energy from all participants atomically.
  6. Seeds pre-combat stat effects for all participants (_seedPreCombatEffects).
  7. Returns StartCombatResult: activeCombatId, participant order, allowsFleeing.

Pre-combat effect seeding (_seedPreCombatEffects, also called by joinCombat
and _spawnNpcEntity):
  Queries Entity_PreCombatEffect WHERE expiresAt > now() for the given entityIds.
  Creates ActiveCombat_StatEffect rows (roundsRemaining = effectDef.durationRounds).
  Creates ActionCooldown rows for effects that carry an equipmentProfileId with
  cooldownRounds > 0. Stack behaviour (refresh / stack / ignore) is respected.


─────────────────────────────────────────────
5. ADVANCING THE TURN
─────────────────────────────────────────────

advanceTurn(combatId, currentEntityId) → AdvanceTurnResult

  a. Calls _processTurnEnd on the departing participant (DoT/HoT ticks, cooldown
     and stat-effect decrements). See §6.

  b. Reads all non-fled, non-defeated participants ordered by turnOrder.
     Determines round boundary: if no remaining participant has a turnOrder higher
     than currentTurnOrder, the next turn wraps to a new round (newRound++).

  c. COMBAT END CHECK
     Condition: fewer than 2 distinct allyFactionIds among conscious
     (isUnconscious = false) active participants.
     endCombat():
       — Single surviving faction → outcome = 'win', winningAllyFactionId = that faction.
         No survivors on any side → outcome = 'draw', winningAllyFactionId = null.
       — If canResultInDeath = true: queries for non-AI, non-fled, isDefeated
         participants to populate mortallyWounded.
       — Writes ActiveCombat: isActive = false, outcomeId, winningAllyFactionId,
         completedAt = now().
       — Returns AdvanceTurnResult with combatEnded = true.

  d. Selects the next entity: first participant with turnOrder > currentTurnOrder,
     or wraps to the participant with the lowest turnOrder.

  e. DEATH SAVE
     If the next entity is unconscious and player-controlled (isAiControlled = false):
     Their "turn" is consumed by a death save roll; the real acting turn passes to
     the entity after them (unless they roll a natural 20 and revive).

     Applies helpRollMod if set (Help action from an ally grants advantage on saves).

     Roll outcomes:
       Nat 20   → revive: HP = 1, isUnconscious = false, counters reset.
                  Entity acts this turn (turn does NOT pass to the next entity).
       10–19    → success; successes++. At 3 successes → revive at 1 HP (turn passes).
       2–9      → failure; failures++. At 3 failures → isDefeated (turn passes).
       Nat 1    → 2 failures added. At 3 failures → isDefeated (turn passes).

     After 3 failures: triggers another combat-end check before continuing.
     Returns DeathSaveEvent in AdvanceTurnResult.deathSaveEvent.

  f. Atomically:
       — Clears helpRollMod on the departing entity (unconsumed help expires).
       — Clears helpRollMod on the death-saver (if one rolled this step).
       — Deletes behavior effects SOURCED BY the incoming entity where roundsRemaining = 1.
       — Decrements all other behavior effects sourced by the incoming entity.
       — Updates ActiveCombat.currentTurnOrder and currentRound.
       — Resets hasUsedReaction = false on the incoming entity.

Note on behavior-effect timing: behavior effects tick on the SOURCE participant's
turn (step f above). Stat-effect durations tick on the AFFECTED participant's turn
(_processTurnEnd, step a). This matches D&D 5.5e: guard/taunt/dodge effects expire
at the start of the applier's next turn; DoT/HoT fire at the start of the target's
own turn.


─────────────────────────────────────────────
6. PER-TURN BOOKKEEPING
─────────────────────────────────────────────

_processTurnEnd(participantId, usesDeathSaves) → RoundEndEvent[]
  Called at the start of advanceTurn for the departing participant.

  First, atomically:
    — Deletes ActionCooldown rows at roundsRemaining = 1.
    — Decrements all other ActionCooldown rows.
    — Deletes StatEffect rows at roundsRemaining = 1 (after their final tick fires below).
    — Decrements all other StatEffect durations.

  Then ticks each active DoT/HoT (accumulates deltas first; one HP write at the end):

    DoT — rolls dice + flat; subtracts from currentHp.
          If currentHp hits 0:
            Player, usesDeathSaves, not already unconscious
              → sets isUnconscious; resets death save counters; deletes behavior effects;
                emits { knockedDown: true }. Returns early.
            Already unconscious (actively making death saves)
              → adds 1 failure. At 3 → isDefeated; emits { defeated: true }. Returns early.
            AI or usesDeathSaves = false
              → isDefeated immediately; emits { defeated: true }. Returns early.

    HoT — rolls dice + flat; adds to currentHp (capped at maxHp).
          If entity was unconscious and HP rises above 0
            → clears isUnconscious, deathSaveSuccesses, deathSaveFailures.

  Returns RoundEndEvent[] included in AdvanceTurnResult.turnEndEvents.


─────────────────────────────────────────────
7. ACTION RESOLUTION: processAction
─────────────────────────────────────────────

processAction(combatId, actorEntityId, profileId, storedItemId, targetEntityId, roundNumber)
  → ActionResult | ActionResult[]

Pre-flight: fetches attackCount and CombatTargetScope for the profile in one query.

AoE (targetsAllies or targetsEnemies = true AND targetsSingle = false):
  — Fetches all non-defeated, non-fled participants in the matching faction(s).
  — Runs one pipeline call per target: aoeIndex = 0, 1, 2, …
  — Actor-side abort on index 0 (off-turn, stunned) → throws and fails the whole AoE.
    Target-side aborts (e.g. unconscious target) → skip that target and continue.
  — Summons attach to results[0].summonedEntities.
  — Returns ActionResult[].

Multiattack (attackCount > 1, not AoE):
  — First call: aoeIndex = null (full END tracking, reactions allowed).
  — Subsequent calls: aoeIndex = 1 (skips cooldown/use decrement, suppresses reactions).
  — Returns ActionResult[].

Single-target (attackCount = 1, not AoE): aoeIndex = null. Returns ActionResult.

Any pipeline abort throws an Error with ctx.abortReason as the message.


─────────────────────────────────────────────
8. BUILTIN ACTIONS: DODGE AND HELP
─────────────────────────────────────────────

processBuiltinAction(combatId, actorEntityId, action, targetEntityId, roundNumber)
  → ActionResult

Dodge and Help bypass the pipeline. The service performs its own validation:
  — turn ownership (turnOrder must match currentTurnOrder)
  — state guards: isDefeated, hasFled, isUnconscious
  — stun check: ActiveCombat_BehaviorEffect with deniesActions = true

DODGE
  Upserts ActiveCombat_BehaviorEffect on the ACTOR's own participant row:
    effectType.grantsHitDisadvantage = true, roundsRemaining = 1.
  The dodge-check interceptor (TARGET/1) reads this on subsequent incoming attacks.
  The effect lives until the start of the actor's next turn (behavior effects sourced
  by an entity decrement in step f of advanceTurn).
  Returns ActionResult with kind: 'behavior', effectName: 'Dodge'.

HELP
  Compares allyFactionId to determine effect:
    same faction  → helpRollMod = 'advantage'    on the TARGET participant
    different     → helpRollMod = 'disadvantage' on the TARGET participant
  The help-check interceptor (PRE_RESOLVE/-1) applies this to ctx.hitAdvantage on
  the target's next attack roll; sets ctx.helpConsumed = true.
  END clears helpRollMod when consumed. advanceTurn clears it if unused at turn end.
  Returns ActionResult with kind: 'behavior', effectName: 'Help (Advantage|Disadvantage)'.

Both paths write an action log entry and return an ActionResult.


─────────────────────────────────────────────
9. REACTION ROUNDTRIP
─────────────────────────────────────────────

POST_APPLY populates ctx.pendingReaction when the defender has available reaction
profiles (see pipeline.md §4 POST_APPLY for eligibility rules). The service
surfaces it on ActionResult.pendingReaction. END simultaneously sets
hasUsedReaction = true on the defender's participant row so a second attack in
the same round cannot offer them a second reaction prompt.

Full roundtrip:

  1. processAction → ActionResult.pendingReaction is set.
     Bot posts an ephemeral reaction prompt to the defender.

  2. Defender selects a reaction profile. Bot calls POST /:id/process-reaction:
       { defenderEntityId, profileId, storedItemId, attackerEntityId, roundNumber }

  3. processReaction runs the pipeline with:
       actorEntityId  = defenderEntityId  (defender acts)
       targetEntityId = attackerEntityId  (attacker is the target)
       isReaction     = true
       aoeIndex       = null
     The pipeline validates and resolves the reaction as a normal action from the
     defender's perspective. POST_APPLY's isReaction gate suppresses further reactions.

  4. Bot displays the reaction ActionResult.

  5. hasUsedReaction is reset to false for the defender at the start of their own
     turn (step f of advanceTurn).

Reaction profile eligibility (enforced in post-apply.ts):
  — isReactionAction = true on the profile
  — usageContext ≠ 'out_of_combat_only'
  — allowedInSpar = true when the combat type is 'spar'
  — profile is not on cooldown
  — hasUsedReaction = false on the defender
  — defender is not AI-controlled, defeated, or knocked down


─────────────────────────────────────────────
10. FLEE AND MARK-DECEASED
─────────────────────────────────────────────

flee(combatId, entityId) → { allowed: boolean }
  Returns { allowed: false } when:
    — initiationType.allowsFleeing = false (e.g., event combats)
    — participant is unconscious, defeated, or already fled
  On success: sets hasFled = true; deletes the entity's behavior effects and stat
  effects (same cleanup as defeat). The turn-order slot is left in place — the
  entity is simply skipped by advanceTurn (it is excluded from the fresh-active query).

markDeceased(entityId)
  Sets Entity.isDeceased = true. Called by the bot after combat ends for each
  entry in AdvanceTurnResult.mortallyWounded (canResultInDeath = true and the
  entity failed all 3 death saves). This is a permanent out-of-combat flag; the
  combat service does not own the logic for what happens next (death consequences
  belong to the event or guild admin flow).


─────────────────────────────────────────────
11. XP DISTRIBUTION
─────────────────────────────────────────────

distributeCombatXp(combatId) → XpGrant[]
  Call this immediately after advanceTurn returns combatEnded = true.
  Must be called after advanceTurn has written isActive = false and
  winningAllyFactionId.

  Event-spawned combat (_distributeEventCombatXp):
    XP pool = sum of Species.combatXpReward for all isDefeated participants.
    Distributed equally to all Main Character winners on the winning faction.
    Credited to the 'combat' discipline only (looked up by codeName).
    Skips entities already at the guild discipline level cap.

  Spar / fight combat:
    Reads ActionType_DisciplineReward rows for the combat type. recipientScope
    controls who qualifies:
      'all'          — every Main Character participant
      'winners_only' — only participants on winningAllyFactionId
      'losers_only'  — only participants NOT on winningAllyFactionId
    Respects per-discipline and guild-wide level caps.

  XP level-up formula:
    Non-stat disciplines: threshold(level) = floor(baseXp × level^1.5)
    Stat-progression disciplines: threshold = baseXp (flat, regardless of level)

  Returns XpGrant[]: entityId, entityName, disciplineId, disciplineName, xpGained,
  levelsGained, newLevel — used by the bot to render the post-combat narrative.


─────────────────────────────────────────────
12. AVAILABLE ACTIONS
─────────────────────────────────────────────

getAvailableActions(combatId, entityId, category: 'main' | 'bonus' | 'item')
  → AvailableAction[]

Common filters on all profiles:
  actionCategory.name = 'Main Action' | 'Bonus Action' | 'Item Interaction'
  usageContext ≠ 'out_of_combat_only'
  allowedInSpar = true  (only when the combat's initiationType is 'spar')
    This flag gates both equipped actions and reaction profiles in combat.

Item Interaction (category = 'item'):
  All StoredItems in storage whose profiles match the filters.
  Items at usesRemaining = 0 or dailyUsesRemaining = 0 are excluded.

Main / Bonus:
  Equipped StoredItems (isEquipped = true) whose chosenProfile matches.
  Builtin Dodge and Help are prepended (profileId = null, storedItemId = null).

PROFILE OVERRIDES (Entity_ProfileOverride):
  Any entity can have override rows that replace one profile with another.
  If a stored item's chosenProfileId has an override entry:
    — The replacement profile is used instead of the original.
    — The original profile is hidden from the action list.
    — If the replacement doesn't match the requested category (cross-category
      override), it is silently excluded from this category's results.
  Use case: temporary power-ups that swap an entity's default attack profile.


─────────────────────────────────────────────
13. RESPONSE TYPES
─────────────────────────────────────────────

ActionResult
  actionId               — ID of the ActiveCombat_Action log row
  actionLabel            — profile label ("Dodge" / "Help" for builtins)
  actorName              — name of the acting entity
  targetName             — original aim target (before redirect, if any)
  actualTargetName       — real target after guard redirect
  wasRedirected          — true if a guard interceptor changed the target
  legendaryResistanceUsed — AI boss auto-spent a legendary resistance charge
  outcome                — ActionResultOutcome (discriminated union below)
  appliedEffects         — display names of stat/behavior effects applied
  pendingReaction?       — set when the defender has an available reaction
  concentrationSaveEvent — concentration save result, or null
  summonedEntities       — entities spawned by a summon action (SummonedEntity[])

ActionResultOutcome  (field: kind)
  'hit'      — damaging action that connected
               hitRoll, targetAC, isCritical, diceRolls, totalDamage, damageTypeName,
               elementalDiceRolls, totalElementalDamage, elementalDamageTypeName,
               absorbedDamage, tempHpDrained, saveRoll, saveTotal, savedSuccessfully,
               hpAfter, knockedDown, defeated
  'miss'     — damaging action that did not connect; hitRoll, targetAC, isFumble
  'heal'     — healing action; diceRolls, totalHeal, hpAfter
  'behavior' — behavior effect applied (guard, taunt, dodge, etc.); effectName,
               guardedName, rounds
  'no_op'    — action ran but produced no observable outcome

AdvanceTurnResult
  combatEnded          — true if the combat is now over
  turnEndEvents        — RoundEndEvent[] from DoT/HoT ticks this turn
  nextEntityId/Name    — who acts next (null when combatEnded)
  nextUserId           — Discord user responsible for the next turn
  isAiControlled       — true if the next actor is NPC-controlled
  deathSaveEvent       — DeathSaveEvent if an unconscious entity rolled this advance; null otherwise
  allowsFleeing        — whether the combat type permits fleeing
  round                — current round number after the advance
  winningAllyFactionId — set when combatEnded + winner exists; null on draw
  mortallyWounded      — non-empty when combatEnded, canResultInDeath = true, and ≥ 1
                         non-AI PC failed all 3 death saves

DeathSaveEvent
  entityId / entityName — the unconscious entity
  roll                  — raw d20 result
  successes / failures  — totals after this roll
  result                — 'success' | 'failure' | 'revived' | 'stable' | 'defeated'

RoundEndEvent
  kind         — 'dot' | 'hot'
  entityId / entityName — affected entity
  amount       — damage dealt or HP restored
  hpAfter      — HP after this tick
  defeated     — entity was eliminated by this tick
  knockedDown  — entity entered death save state from this tick

XpGrant
  entityId / entityName — recipient
  disciplineId / disciplineName
  xpGained     — raw XP added before level-up checks
  levelsGained — number of levels crossed (0 if none)
  newLevel     — level after XP is applied
