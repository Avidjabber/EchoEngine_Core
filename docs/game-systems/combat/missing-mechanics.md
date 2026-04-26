COMBAT SYSTEM — MISSING D&D 5.5E MECHANICS
==========================================
Last updated: 2026-04-26

This file tracks D&D 5.5e (2024 PHB) mechanics not yet implemented in the
EchoEngine combat system. Each entry notes what is missing, which system
layer it affects, and an estimated implementation complexity.

Grid/movement-dependent mechanics (opportunity attacks, prone movement cost,
push/slow weapon properties, cover, flanking, difficult terrain) are not
listed — they have no applicable surface in a text-based turn-order system.


─────────────────────────────────────────────
COMPLEXITY KEY
─────────────────────────────────────────────

  Low         — 1 file or a narrow interceptor; no schema changes.
  Low-Medium  — 1-2 schema fields + a small interceptor or service patch.
  Medium      — New schema fields + new interceptor(s) + Discord UI changes.
  Medium-High — Pipeline loop changes or multi-phase coordination; Discord UX work.
  High        — New turn-event hooks, encounter-level config, or cross-turn state;
                touches multiple system layers.


─────────────────────────────────────────────
ACTION ECONOMY ADDITIONS
─────────────────────────────────────────────

DODGE ACTION
  Complexity: Low
  Status: IMPLEMENTED (engine complete, 2026-04-26)
  What: Spending the Main Action to adopt a defensive stance until the start
  of your next turn. While dodging: all attacks against you have disadvantage,
  and you have advantage on DEX saving throws. Cancelled if you are incapacitated.
  Implemented:
    - CombatEffectType "dodge" seeded with grantsHitDisadvantage = true.
    - dodge-check.interceptor.ts (TARGET/1): applies hit disadvantage to incoming
      attacks; also sets ctx.saveAdvantage = 'advantage' when the incoming action
      has a DEX saving throw (stat name matched case-insensitively).
    - ctx.saveAdvantage wired into RESOLVE — save roll uses rollWithAdvantage.
    - Schema: grantsHitDisadvantage Bool column on CombatEffectType.
  Remaining content work:
    - Seed a Dodge action item/profile with actionType applying the "dodge"
      behavior effect for 1 round. Engine handles everything else automatically.

HELP ACTION
  Complexity: Low-Medium
  Status: IMPLEMENTED (engine complete, 2026-04-26)
  What: Spending the Main Action to give one ally advantage on their next attack
  roll, or to give an enemy disadvantage on their next attack roll.
  Effect is consumed on the first applicable attack roll, or expires at turn end.
  Implemented:
    - helpRollMod String? on ActiveCombat_Participant — "advantage" (ally target)
      or "disadvantage" (enemy target); faction comparison determines which.
    - processBuiltinAction('help'): validates turn ownership and stun, resolves
      ally vs enemy from allyFactionId, writes helpRollMod to target participant.
    - help-check.interceptor.ts (PRE_RESOLVE/-1): applies helpRollMod to actor's
      hitAdvantage when they make an attack; sets ctx.helpConsumed = true.
    - end.ts: clears helpRollMod in transaction when consumed.
    - advanceTurn: clears unconsumed helpRollMod at end of beneficiary's turn.
    - getAvailableActions: always injects Help as a builtin Main Action entry
      with single+ally+enemy targeting scope.
  Note: "adjacent" restriction from tabletop is dropped — EchoEngine has no
  positioning, so Help can target any active participant.

READY ACTION
  Complexity: High
  What: Spend your action to declare an action and a trigger condition. When the
  trigger fires during another participant's turn, your reaction executes the
  readied action. If the trigger never fires, the readied action is lost.
  Currently: No cross-turn state for reserved actions; the reaction system only
  handles responses to incoming hits.
  Implementation path:
    - New table: ActiveCombat_ReadiedAction (participantId, profileId, storedItemId,
      triggerDescription, expiresAtRoundEnd).
    - Turn-end hook: evaluate readied action trigger (requires a condition DSL or
      simple enumerated trigger types — "on enemy approach", "on enemy attack", etc.).
    - On trigger: execute the readied action as a reaction, clear the row.
    - Discord: requires a separate UI flow for declaring the trigger and later
      confirming/executing the readied action when the trigger fires.
  Note: The trigger condition evaluation is the hardest part. A first pass could
  limit triggers to an enumerated set (e.g. "when an enemy uses an action",
  "when an ally drops to 0 HP") rather than free-form text.


─────────────────────────────────────────────
HIT POINTS AND RECOVERY
─────────────────────────────────────────────

TEMPORARY HIT POINTS
  Complexity: Low-Medium
  Status: IMPLEMENTED (2026-04-26)
  What: A separate HP buffer granted by certain abilities (e.g. False Life, Aura
  of Protection). Temporary HP absorbs incoming damage before real HP. Does not
  stack — highest pool wins. Not restored by healing; cleared at long rest.
  Implemented:
    - tempHp Int @default(0) on ActiveCombat_Participant (pre-existing).
    - temp-hp.interceptor.ts (APPLY/-1): drains tempHp proportionally from primary
      and elemental damage before guard absorption and resistance runs.
    - ctx.tempHpDrained surfaced in ActionResult hit outcome.
  Note: Grant path (action type "grant_temp_hp") is content-level work, not engine
  work. The engine reads tempHp from the participant snapshot; any action that
  writes tempHp = max(current, granted) to the DB will be respected.

DEATH SAVING THROWS
  Complexity: Medium
  What: Standard 5e unconscious-but-not-dead mechanic. At the start of each turn
  while at 0 HP: roll d20. 10+ = success, <10 = failure. 3 successes = stable
  (unconscious, no longer making saves). 3 failures = dead. Natural 20 = regain
  1 HP. Natural 1 = counts as 2 failures. Being healed above 0 HP clears all counts.
  Currently: The system uses a homebrew "Second Wind" (choose to restore to full
  HP or be permanently defeated). These are distinct systems — Second Wind is
  a narrative choice; death saves are an automatic per-turn mechanic.
  Note: Both systems can coexist. Second Wind could be retained as a separate
  narrative beat (a once-per-combat dramatic recovery) while death saves govern
  the standard 0-HP state. Requires design clarification before implementation.
  Implementation path:
    - Add deathSaveSuccesses Int (0) + deathSaveFailures Int (0) to
      ActiveCombat_Participant.
    - DECLARE/VALIDATE: if actor.currentHp == 0 and not inSecondWind and not isDefeated,
      roll a death save instead of processing a normal action.
    - APPLY: on a successful heal bringing HP > 0, clear both counters.
    - Defeat path: 3 failures → isDefeated = true (same as current defeat logic).
    - Stable path: 3 successes → new flag isStabilized = true; no further saves but
      still cannot act until healed above 0.

EXHAUSTION
  Complexity: Medium
  What: 6 stacking severity levels. Each level adds -2 to all d20 tests (attack
  rolls, saving throws, ability checks) and -5 ft. speed. At level 6: dead.
  In 5.5e (2024) this replaces the more complex 2014 table with a single penalty
  per level.
  Currently: No exhaustion tracking; the stat effect system supports roll mods but
  not a stacked-level counter with a death threshold.
  Implementation path:
    - Add exhaustionLevel Int (0) to ActiveCombat_Participant (or Entity for
      persistence across combats — design decision).
    - PRE_RESOLVE: apply -(exhaustionLevel * 2) to all d20 test roll modifiers.
    - APPLY: if exhaustionLevel reaches 6, set isDefeated = true.
    - Exhaustion grant/reduce: action type or out-of-combat endpoint to
      increment/decrement the level.
    - Display: show current level on the turn prompt.


─────────────────────────────────────────────
CONCENTRATION
─────────────────────────────────────────────

  Complexity: Medium
  What: Certain powerful abilities require concentration to maintain their effect.
  While concentrating: taking damage forces a CON saving throw (DC = max(10,
  half damage taken)). On failure, the concentrating effect ends immediately.
  Starting a new concentration effect ends the previous one.
  Currently: No concentration flag on behavior effects or stat effects; no damage-
  triggered save mechanic outside of the existing savingThrowStat on profiles.
  Implementation path:
    - Add requiresConcentration Bool to CombatStatEffectDef and/or
      CombatEffectType (behavior effects).
    - Add concentratingOnStatEffectId / concentratingOnBehaviorEffectId to
      ActiveCombat_Participant (at most one concentration effect active at a time).
    - POST_APPLY interceptor (or extend APPLY): if damage > 0 and defender is
      concentrating, trigger a CON save. DC = max(10, floor(damage / 2)).
      On failure: delete the concentrated effect row and clear the concentrating field.
    - On applying a concentration effect: clear any prior concentration and set
      the new concentratingOn field.


─────────────────────────────────────────────
BOSS / ELITE MECHANICS
─────────────────────────────────────────────

LEGENDARY RESISTANCE
  Complexity: Low-Medium
  Status: PARTIALLY IMPLEMENTED (2026-04-26)
  What: Boss-tier creatures can choose to succeed on a failed saving throw,
  consuming one of a limited daily pool (typically 3 per long rest). Declared
  after the roll result is known.
  Implemented:
    - legendaryResistancesRemaining Int? on ActiveCombat_Participant (null = not legendary).
    - RESOLVE phase: AI-controlled targets auto-consume a charge when they fail a save.
      savedSuccessfully flips to true, damage is halved (standard success result).
    - END phase: decrements legendaryResistancesRemaining in the action transaction.
    - ctx.legendaryResistanceUsed surfaced in ActionResult.
  Deferred:
    - Player-controlled boss prompt (same Discord reaction-prompt pattern).
    - Population of legendaryResistancesRemaining from Species at combat start.
    - Long-rest reset (out-of-combat endpoint).

LEGENDARY ACTIONS
  Complexity: High
  What: Boss-tier creatures can spend Legendary Action points at the end of any
  other creature's turn (not their own). Each defined legendary action costs 1-3
  points from a pool (typically 3, refills at the start of the boss's own turn).
  Currently: Actions only occur on the active participant's turn; no out-of-turn
  action hooks exist.
  Implementation path:
    - New table: LegendaryAction (speciesId, profileId, pointCost, description).
    - Add legendaryActionPointsMax + legendaryActionPointsCurrent to
      ActiveCombat_Participant.
    - advanceTurn: after resolving the outgoing turn, check if any other participant
      has legendaryActionPointsCurrent > 0 and is not defeated/fled. If so, trigger
      a legendary action prompt (Discord) or AI selection.
    - legendaryActionPointsCurrent resets to max at the start of the legendary
      creature's own turn.
    - Discord: requires a secondary ephemeral prompt sent to the boss controller
      at the end of each other participant's turn, cancellable.


─────────────────────────────────────────────
ATTACK VARIATIONS
─────────────────────────────────────────────

MULTIATTACK
  Complexity: Medium-High
  What: Creatures and high-level characters can make multiple separate attack rolls
  as a single Main Action. Each roll independently crits or misses, applies its own
  damage, and may trigger reactions separately. Cooldown/use tracking fires only once
  for the parent action.
  Currently: One action = one pipeline call = one hit roll. The AoE system runs
  multiple pipeline calls per action but against different targets, not multiple
  rolls against the same target.
  Implementation path:
    - Add attackCount Int (default 1) to ItemEquipmentProfile.
    - processAction: if attackCount > 1, loop the RESOLVE → APPLY sub-chain N times
      within the same pipeline call. DECLARE / VALIDATE / END still run once.
    - Each sub-attack gets its own hit roll, crit determination, and damage roll.
    - Reactions: only the first hit triggers a reaction check (or design choice:
      each hit independently). For simplicity a first-hit-only rule is recommended.
    - aoeIndex semantics: null = single-target (possibly multiattack), 0+ = AoE batch.
      These are orthogonal and can coexist.

TWO-WEAPON FIGHTING
  Complexity: Medium
  Status: DEFERRED — requires equipment slot tracking (main_hand / off_hand) which
  is not yet part of the item system. Revisit once item slots are defined.
  What: When wielding a Light weapon in the main hand and a Light weapon in the
  off-hand, you may use your Bonus Action to make one extra attack with the off-hand
  weapon. The off-hand attack does not add the ability modifier to damage (only to hit).
  Currently: No equipment slot awareness (main vs. off-hand); bonus actions are
  generic, not inferred from equipment.
  Implementation path:
    - Add a slot field to Entity_StoredItem or ItemEquipmentProfile indicating
      "main_hand" / "off_hand" / "other".
    - Detect dual Light weapon configuration at the start of a turn.
    - Synthesize a bonus action profile for the off-hand weapon with damageModifier
      forced to 0 regardless of the stat modifier the normal profile would apply.
    - The synthesized action only appears in the Bonus Action picker when the
      two-weapon condition is met.


─────────────────────────────────────────────
HEROIC INSPIRATION  (5.5e)
─────────────────────────────────────────────

  Complexity: Medium
  What: A creature can hold at most one Heroic Inspiration. When it has one, it may
  expend it to reroll any one d20 test and take the new result. In 5.5e this
  replaces the 2014 Bardic Inspiration mechanic and is granted by DMs for roleplay.
  Currently: No inspiration tracking; no reroll mechanism.
  Implementation path:
    - Add hasInspiration Bool (default false) to ActiveCombat_Participant (or on
      the Entity for persistence across combats — design decision).
    - PRE_RESOLVE or RESOLVE: if actor hasInspiration, offer a "Use Inspiration?" 
      Discord prompt before committing the roll. On confirmation: reroll and
      take the new result, then clear hasInspiration.
    - Grant path: admin command or event step can set hasInspiration = true on an entity.
    - UX challenge: the player must decide before seeing the outcome for it to match
      the tabletop rule. A simpler alternative: allow reroll of the most recent roll
      as a post-roll confirmation (common digital implementation).


─────────────────────────────────────────────
WEAPON MASTERY PROPERTIES  (5.5e)
─────────────────────────────────────────────

  Complexity: High (as a group; each property individually is Low-Medium)
  What: Each martial weapon has one Weapon Mastery property. A character can apply
  one mastery property per turn when they take the Attack action (or Extra Attack).
  Properties marked N/A below require positioning and are excluded.

  Applicable properties:

  Graze       Low-Medium  On a miss, still deal STR or DEX modifier as damage
                          to the original target (no roll, minimum 1).
                          RESOLVE: if hit == false and profile has Graze, compute
                          stat modifier and add to outcome as grazeAmount.
                          APPLY: apply grazeAmount as untyped damage.

  Vex         Low-Medium  On a hit, gain advantage on your next attack roll against
                          the same target this turn or next.
                          END: upsert a StatEffect (RollAdvantage on hit, 1 round)
                          with a restriction to targetEntityId == last target.
                          Requires a scoped advantage concept (currently advantage
                          is unscoped on roll type only).

  Sap         Low-Medium  On a hit, the target has disadvantage on its next attack
                          roll (any target).
                          END: upsert a 1-use RollAdvantage (disadvantage on hit)
                          for the target; consumed on the target's next attack.
                          Requires a "consumed after one use" duration mode.

  Nick        Medium      When you make an Extra Attack with the Attack action and
                          one of the weapons has Nick, that extra attack does not
                          cost your Bonus Action. Interacts with Two-Weapon Fighting.
                          Requires Two-Weapon Fighting to be implemented first.

  Cleave      Medium      On a hit, can attempt a secondary melee attack against
                          another adjacent enemy for the same weapon (STR mod to hit,
                          no damage mod). Adjacent is meaningless without a grid —
                          could be adapted to "any other enemy participant".
                          Requires multiattack-style sub-attack in APPLY phase.

  Topple      Medium      On a hit, target must make a CON saving throw or fall
                          prone. Prone: melee attacks against target have advantage,
                          ranged have disadvantage. On target's turn: stand costs
                          half movement (N/A without grid) or a Bonus Action.
                          Requires a new "prone" BehaviorEffect flag.

  Push        N/A         Push target 10 ft. on hit — positioning-based.
  Slow        N/A         Reduce speed by 10 ft. on hit — positioning-based.

  Implementation path (group):
    - Add weaponMasteryProperty (enum / FK) to ItemEquipmentProfile.
    - Add a masteryUsedThisTurn Bool to turn state (only one per Attack action).
    - Each applicable property becomes a named branch in END phase logic, keyed
      by the profile's masteryProperty field.
    - Prone state → new CombatEffectType seed row with flag isProne = true;
      add isProne handling to PRE_RESOLVE (advantage on incoming melee, disadvantage
      on incoming ranged); standing up costs a Bonus Action (synthesized action).


─────────────────────────────────────────────
NOT PLANNED / OUT OF SCOPE
─────────────────────────────────────────────

The following 5.5e mechanics are intentionally not listed above because they do
not map to EchoEngine's architecture or design goals:

  Spell slots         — Replaced by the cooldown / daily-use system.
  Class / subclass    — No class system; abilities are item/species-driven.
  Movement actions    — No grid; Dash, Disengage, Grapple, Shove are N/A.
  Cover               — No positioning system.
  Flanking            — Positional optional rule; N/A.
  Short / Long rest   — Out-of-combat recovery is handled by the action system,
                        not the combat pipeline.
  Spellcasting focus  — No spell slot system to interact with.
  Opportunity attacks — Triggered by movement; N/A.
