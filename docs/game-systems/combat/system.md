COMBAT SYSTEM — DESIGN REFERENCE
==================================
Last updated: 2026-04-28

Start here for the design context, then read pipeline.md for the engine
implementation and service.md for the service layer and turn loop.

  pipeline.md          — engine phases, context fields, interceptors
  service.md           — service layer, turn loop, HTTP surface
  stages.md            — staged development history
  missing-mechanics.md — unimplemented D&D 5.5e features


This file is the authoritative reference for how combat works in EchoPaw.
Read this before touching combat resolution, encounter definitions, NPC AI,
or XP reward logic tied to combat.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Combat is a turn-based encounter system involving a specific set of entities.
It is distinct from the action system (patrols, hunts) — combat has rounds,
initiative order, and a full action log. HP and AC are read live from the
entity; combat only tracks team assignment, turn order, and state flags.

Combat can be spawned several ways:
  spar    — spawned by a spar ActionType; lethal actions suppressed.
            XP is defined on the spar ActionType_DisciplineReward rows,
            not on the combat itself. The app credits XP when combat concludes.
  event   — spawned by an event chain combat step (via ActiveEvent)
  patrol  — spawned during a patrol or hunt; requires a patrol leader
  boss    — admin-initiated boss fight; scripted, pre-defined enemies

Each combat type is defined in CombatInitiationType with flags controlling
whether death is possible, fleeing is allowed, and second wind is available.


─────────────────────────────────────────────
2. ENCOUNTER DEFINITIONS
─────────────────────────────────────────────

CombatEncounterDef defines a reusable scripted encounter (guild-extensible).
It is optional — spar and patrol combats are standalone with no def.

  speciesId / npcCount  — spawn N NPC entities of this species as enemies
  namedEntities         — pin specific pre-created entities to the encounter

CombatEncounterDef is referenced by EventStepDef to embed combat into event
chains, and by ActiveCombat.combatEncounterDefId (nullable — null for
standalone combats).


─────────────────────────────────────────────
3. ACTIVE COMBAT
─────────────────────────────────────────────

ActiveCombat is a live encounter. Key fields:

  guildId              — owning guild
  combatEncounterDefId — null for standalone (spar / patrol / admin) combats
  activeEventId        — null for standalone; set when spawned by an event chain
  initiationTypeId     — spar | event | patrol | boss
  requiresPatrolLeader — one participant must be flagged as patrol leader
  currentRound         — increments each full round
  currentTurnOrder     — matches the turnOrder of the participant currently acting
  outcomeId            — null = ongoing; set on resolution
  winningAllyFactionId — allyFactionId of the surviving faction; null if draw

OUTCOME TYPES
──────────────
  win       — one ally faction survives; triggers loot, positive morale, XP
  lose      — all player-side participants defeated or fled
  draw      — all factions eliminated simultaneously; partial consequences
  completed — inactivity timeout (isExpired = true); no participant took action
              in too long; mutual retreat with minimal consequences

On completion, if spawned by an event chain, the event system reads
winningAllyFactionId and advances to winStepId or loseStepId on the event step.


─────────────────────────────────────────────
4. PARTICIPANTS
─────────────────────────────────────────────

ActiveCombat_Participant tracks per-entity combat state:

  allyFactionId    — entities with the same value are allies; different = enemies.
                     Combat ends when only one distinct allyFactionId remains
                     among active (non-fled, non-defeated) participants.
  turnOrder        — unique position in turn order; 1 acts first. Determined at
                     combat start via initiative (d20 + DEX modifier), then persisted.
                     The roll itself is not stored — turnOrder is the result.
                     Mid-combat entrants roll initiative and are inserted at the
                     appropriate position; all existing turnOrder values above the
                     insertion point are incremented by 1.
  isAiControlled   — true for NPC entities; AI action selection driven by
                     SpeciesCombatBehavior (read live, not snapshotted).
  controllerUserId — Discord user ID responsible for this participant's turn decisions.
                     Null = AI (if isAiControlled) or the entity's natural owner.
                     Set when a specific player or admin is assigned control of a
                     summoned or mid-combat-joined entity. Admin vs. player distinction
                     is a Discord role check at the app layer — the schema only records
                     which user owns the turn decision.
  joinedAtRound    — round the participant entered combat. 1 for all original
                     participants; > 1 for mid-combat summons or character joins.
  dropTableId      — snapshotted from species.dropTableId at spawn; rolled on defeat.
  isPatrolLeader   — at most one participant per combat; gates patrol leader actions.
  isUnconscious    — entity is at 0 HP and actively making death saving throws.
                     Set immediately when HP hits 0 (damage or DoT). Cleared when
                     healed above 0, stabilised (3 successes), or revived (nat 20).
                     NPC entities skip this state and are defeated immediately.
                     Only applies in combat types where usesDeathSaves = true.
  hasFled          — entity fled; removed from turn order, earns no XP or rep.
  isDefeated       — entity eliminated (3 death save failures, AI at 0 HP, or combat
                     type with usesDeathSaves = false).

MID-COMBAT JOINS
─────────────────
Any entity — player-controlled or summoned — can join an ongoing combat instance.
The join process is:
  1. Create the ActiveCombat_Participant row with the entity, allyFactionId, and
     joinedAtRound = ActiveCombat.currentRound.
  2. Roll initiative (d20 + DEX modifier) and resolve insertion point in turn order.
     All existing participants with turnOrder >= the insertion point are incremented by 1.
  3. Set controllerUserId if the entity is not governed by its natural owner or AI.
  4. The entity acts on the next occurrence of their turnOrder in the round sequence.

For NPC summons (ItemEquipmentProfile.summonSpeciesId): the engine spawns the entity,
equips it from SpeciesDefaultLoadout, sets isAiControlled = true, and runs the join
process above. Player-character mid-combat joins follow the same process with
isAiControlled = false and controllerUserId set as needed.


─────────────────────────────────────────────
5. TURN ECONOMY
─────────────────────────────────────────────

Each entity may use one action per CombatActionCategory per turn.
Seeded categories: "Main Action", "Bonus Action", "Item Interaction".
Each category allows actionsAllowedPerRound actions per round (default 1).

  Main Action       — the primary action on a turn: attack, cast a spell, use an
                      ability, heal, taunt, guard, etc.
  Bonus Action      — a supplemental action taken alongside the main action: a quick
                      strike, a short buff, a minor ability, etc.
  Item Interaction  — using, throwing, or activating a held item (consuming a poultice,
                      throwing a flask, toggling a tool, etc.). One per turn.

Actions are defined via ItemEquipmentProfile — items equipped by the entity
determine what actions are available. The entity's species default loadout
ensures NPC entities always have actions available.

Action cooldowns are tracked in ActiveCombat_Participant_ActionCooldown.
A row exists only while an action is on cooldown; deleted at roundsRemaining = 0.

OUT-OF-COMBAT USE
──────────────────
ItemEquipmentProfile.usageContext controls when an action is available:
  "any"               — usable in and out of combat (default)
  "combat_only"       — only during an active combat instance
  "out_of_combat_only"— only when not in an active combat instance

ItemEquipmentProfile.outOfCombatMaxTargets controls out-of-combat targeting:
  null     — action is combat-only; CombatTargetScope does not apply outside combat.
  non-null — action may be used outside combat. The user selects up to this many
             entities from a flat list of active entities. No team or faction
             filtering applies — any active entity is a valid target.

USE LIMITS
───────────
Three independent limits control how often an action can be used; all are enforced
simultaneously when set:

  cooldownRounds              — (on ItemEquipmentProfile) in-combat frequency cap:
                                rounds before this action can be used again within
                                the same combat instance. 0 = no cooldown.

  Item.maxDailyUses           — daily use cap across all contexts (in and out of combat).
                                null or 0 = no daily limit.
                                Tracked on StoredItem.dailyUsesRemaining; reset to
                                maxDailyUses by the daily tick.

  Item.maxUses                — lifetime use cap. null or 0 = no limit.
                                Tracked on StoredItem.usesRemaining; decremented on
                                every use regardless of context. When it reaches 0
                                the StoredItem is deleted.

StoredItem tracking fields (only populated when the corresponding Item field is set):
  usesRemaining       — remaining lifetime uses for this physical instance.
                        null when Item.maxUses is null or 0.
  dailyUsesRemaining  — remaining uses today. null when Item.maxDailyUses is null or 0.
                        Reset to Item.maxDailyUses on the daily tick.

EXAMPLE — Healing Salve (3 uses per day, 9 uses total then gone):
  Item.maxUses                   = 9
  Item.maxDailyUses              = 3
  ItemEquipmentProfile.usageContext = "any"
  StoredItem.usesRemaining       initialized to 9; decremented each use
  StoredItem.dailyUsesRemaining  initialized to 3; decremented each use; reset to 3 on daily tick

EXAMPLE — Fireball Scroll (combat only, unlimited uses but 2 per day, no lifetime cap):
  Item.maxUses                   = null
  Item.maxDailyUses              = 2
  ItemEquipmentProfile.usageContext    = "combat_only"
  ItemEquipmentProfile.cooldownRounds  = 2
  StoredItem.usesRemaining       = null
  StoredItem.dailyUsesRemaining  initialized to 2; reset daily


─────────────────────────────────────────────
6. NPC AI BEHAVIOR
─────────────────────────────────────────────

SpeciesCombatBehavior defines how an NPC picks actions and targets each turn.
It is read live (not snapshotted) so species behavior changes apply immediately.

ACTION CATEGORY WEIGHTS
────────────────────────
Normalised into a probability distribution each turn:
  attackWeight, buffWeight, debuffWeight, healWeight
A category is only eligible if the species has at least one equipped item
with a combat action of that type.

TARGET SELECTION
─────────────────
  offensiveTargetStrategyId — strategy for attacks and debuffs
  supportTargetStrategyId   — strategy for buffs and heals
  strategyWeight            — probability of following the strategy vs. random pick

Strategy values: "lowest_health" | "highest_health" | "lowest_strength" | "random"


─────────────────────────────────────────────
7. BEHAVIOR EFFECTS
─────────────────────────────────────────────

ActiveCombat_BehaviorEffect tracks persistent multi-round behavioral states (guard, taunt,
parry, absorb, etc.). Rows are decremented at round start and deleted at 0.

  effectTypeId  — FK → CombatEffectType; flags on the row describe what the effect does
                  (redirectsDamage, forcesTargeting, deniesActions, etc.)

STACKING
─────────
One active instance per entity per effect type is enforced by the unique constraint on
(affectedParticipantId, effectTypeId). Re-applying the same behavior type always refreshes
(upserts) roundsRemaining — there is no "stack" or "ignore" mode.

WHAT BELONGS HERE VS. CombatStatEffectDef
───────────────────────────────────────────
  BehaviorEffect  — changes HOW an entity acts or is targeted: guard, taunt, parry, absorb,
                    stun (deniesActions), evasion, counterattack, suppress, dispel, untargetable.
  StatEffect      — changes WHAT NUMBERS apply: stat mods, roll mods, AC mods, DoT, HoT,
                    damage resistance/immunity, advantage/disadvantage.

Skill-derived flat modifiers (hit_mod, damage_mod, stat_mod, ac_mod with flatModifier = null)
use CombatEffectType via ConditionDef_CombatEffect — this is the only overlap. All fixed-value
numerical effects route through CombatStatEffectDef regardless of source.

Directional semantics:
  guard:   affectedParticipantId = guarding entity;   linkedParticipantId = guarded ally
  taunt:   affectedParticipantId = taunted entity;    linkedParticipantId = taunter
  parry:   affectedParticipantId = parrying entity;   linkedParticipantId = null
  absorb:  affectedParticipantId = absorbing entity;  linkedParticipantId = null
  reflect: affectedParticipantId = reflecting entity; linkedParticipantId = null
           (attacker is resolved at hit-time, not pre-linked)

MAGNITUDE FIELDS
─────────────────
flatModifier and percentModifier on ActiveCombat_BehaviorEffect are populated at application
time and carry the configurable magnitude for behavior types that need it:

  flatModifier    — flat numeric value. Examples:
                    absorb → HP buffer size (damage consumed before reaching the entity's HP)
                    reflect → fixed damage returned to attacker regardless of hit size
  percentModifier — fractional value (0.0–1.0). Examples:
                    reflect → fraction of incoming damage returned to attacker (e.g. 0.3 = 30%)
                    guard   → fraction of damage the guard absorbs for the protected ally (e.g. 0.9)

Either or both may be set; behavior types that don't use a field leave it null. The engine reads
whichever fields are non-null and resolves the magnitude in the order: flat first, then percent
of the remaining damage (if both are set). Behavior types with no magnitude (taunt, parry,
action_denial, etc.) always leave both fields null.

Guard and taunt state are NOT cached on ActiveCombat_Participant — query
ActiveCombat_BehaviorEffect directly via effectTypeId at resolution time.


─────────────────────────────────────────────
8. ACTION LOG
─────────────────────────────────────────────

ActiveCombat_Action records every action taken during combat, in order.
Used to reconstruct the Discord message narrative after each turn resolves.

  roundNumber / turnIndex  — ordering within the combat
  actorEntityId            — who acted
  equipmentProfileId       — which item profile was used
  actionCategoryId         — Main Action or Bonus Action
  targetEntityId           — null for self-targeted or AoE actions
  hitRoll / hitModifier / hit / isCritical / isFumble — attack roll, modifier, and outcome flags
  damageRoll / damageModifier / damageDealt — primary damage roll, modifier, and final damage
  elementalDamageRoll / elementalDamageDealt — elemental damage roll and final elemental damage;
                                               null if the action has no elemental component
  healDealt                               — HP restored (heal actions)
  wasRedirected / originalTargetEntityId  — set when a guard effect redirected the attack;
                                            originalTargetEntityId is who the actor aimed at
  absorbedDamage                          — damage intercepted by guard absorption; null if none
  knockedDown                             — true if this action caused the target to enter
                                            death save state (isUnconscious set to true)
  saveRoll / savedSuccessfully            — defender's saving throw d20 and outcome;
                                            null when no save was triggered


─────────────────────────────────────────────
9. XP REWARDS
─────────────────────────────────────────────

Combat discipline XP is the only XP combat grants directly.

  Combat discipline XP  — sum of Species.combatXpReward across all defeated enemies
                          on the opposing side. Distributed to all non-fled,
                          non-defeated participants on the winning side.

Stat point XP and other discipline XP are NOT granted by combat itself.
  spar-spawned combat  — XP comes from the spar ActionType_DisciplineReward rows.
                         The app credits these when the combat concludes.
  event-spawned combat — XP comes from the event reward system.
  boss / patrol        — XP handled by the spawning context (event or action).

Entities that fled (hasFled = true) or were defeated earn no combat XP.


─────────────────────────────────────────────
10. SCHEMA SUMMARY
─────────────────────────────────────────────

  DEFINITIONS
  CombatEncounterDef                   — scripted encounter definition; guild-extensible
  CombatEncounterDef_NamedEntity       — pre-pinned named entities for an encounter
  CombatInitiationType                 — spar | event | patrol | boss (seed)
  CombatOutcome                        — win | lose | draw | completed (seed); completed = isExpired
  CombatActionCategory                 — Main Action | Bonus Action | Item Interaction (seed)
  CombatTargetStrategy                 — lowest_health | highest_health | etc. (seed)
  CombatEffectType                     — guard | taunt | parry | absorb | etc. (seed); flags describe behavior
  CombatRollType                       — hit | damage | heal (seed); used by stat effect roll modifiers
  DamageCategory                       — Physical | Magical | True (seed)
  DamageType                           — guild-extensible; FK → DamageCategory
  CombatTargetScope                    — targetsAllies / targetsEnemies scope (seed)
  SpeciesCombatBehavior                — NPC AI action weights and target strategies
  SpeciesDefaultLoadout                — items granted to all entities of a species

  STAT EFFECT DEFINITIONS (see section 11)
  CombatStatEffectDef                  — reusable effect definition; guild-extensible
  CombatStatEffectDef_StatMod          — flat stat bonus/penalty with optional context
  CombatStatEffectDef_RollMod          — flat hit/damage/heal roll modifier
  CombatStatEffectDef_AcMod            — flat AC modifier
  CombatStatEffectDef_DamageOverTime   — damage dealt at round end
  CombatStatEffectDef_HealOverTime     — HP restored at round end
  CombatStatEffectDef_DamageModifier   — resistance, vulnerability, or immunity to a damage type
  CombatStatEffectDef_RollAdvantage    — advantage or disadvantage on a roll type

  SOURCE LINKS (attach a CombatStatEffectDef to a source)
  ItemEquipmentProfile_StatEffect      — profile applies effect on action use; applicationChance Float
  ConditionDef_CombatStatEffect        — condition applies effect while active in combat
  AbilityDef_StatEffect                — ability applies effect while active in combat

  PRE-COMBAT
  Entity_PreCombatEffect               — out-of-combat stat effects pending combat start; see section 12

  ACTIVE INSTANCES
  ActiveCombat                         — live encounter
  ActiveCombat_Participant             — per-entity state within a combat
  ActiveCombat_Participant_ActionCooldown — cooldown tracking per action
  ActiveCombat_BehaviorEffect          — persistent multi-round behavioral effects (guard, taunt, parry, etc.)
  ActiveCombat_StatEffect              — persistent stat/over-time effects on a participant
  ActiveCombat_Action                  — action log for Discord narrative reconstruction


─────────────────────────────────────────────
11. STAT EFFECTS
─────────────────────────────────────────────

CombatStatEffectDef is a reusable, guild-extensible definition for any numerical or
over-time effect applied to a participant during combat. Multiple sources can reference
the same def — a snake bite and a venom-coated blade both apply the same Snake Venom
effect, ensuring consistent behaviour regardless of delivery mechanism.

DEFINITION FIELDS
──────────────────
  codeName       — snake_case slug; unique per guild. "global" for bot-seeded defs.
  displayName    — user-facing label shown in the Discord narrative.
  durationRounds — null = lasts until combat ends; non-null = removed after N rounds.
                   Tracked on ActiveCombat_StatEffect.roundsRemaining, decremented
                   at round end, deleted when it reaches 0.
  stackBehaviorId — what happens when the same def is applied to the same participant again:
                    "refresh" (default) — restart the duration.
                    "stack"             — add a separate instance.
                    "ignore"            — no-op if already active.

EFFECT SUB-TABLES
──────────────────
Any combination of sub-table rows may be attached to one def. All active rows
apply simultaneously while the effect is on a participant.

  StatMod          — flat stat modifier; optional context key ("attack", "dodge", etc.)
                     scopes it to specific roll contexts. null context = always applies.
  RollMod          — flat modifier to a hit, damage, or heal roll.
  AcMod            — flat AC modifier (positive = harder to hit, negative = easier).
  DamageOverTime   — dice + flat damage dealt at the end of each round. damageTypeId null
                     = untyped, bypasses resistances and vulnerabilities.
  HealOverTime     — dice + flat HP restored at the end of each round.
  DamageModifier   — resistance (0.5×), vulnerability (2.0×), or full immunity to a
                     specific damage type. isImmune overrides modifier.
  RollAdvantage    — advantage (roll twice, take higher) or disadvantage (roll twice,
                     take lower) on a specific roll type.

DoT and HoT effects fire at the end of each round — this is app-owned logic and
requires no additional field on the def.

DURATION MODES
───────────────
Duration is determined at application time on ActiveCombat_StatEffect, not on the def.
Three modes, resolved in this order:

  Condition-scoped — sourceEntityConditionId is set. The effect lives and dies with that
                     EntityCondition. roundsRemaining is null and ignored. When the
                     condition ends (cured, expired, or combat ends), the stat effect
                     row is Cascade-deleted automatically. Used for all
                     ConditionDef_CombatStatEffect applications.

  Round-counted    — sourceEntityConditionId is null; roundsRemaining is non-null.
                     Decremented at round end; deleted when it reaches 0. Used when
                     the def has a fixed durationRounds and the source is an item or
                     ability.

  Combat-duration  — both null. Effect lasts until combat ends. Used when
                     durationRounds = null on the def and the source is not a condition.

APPLICATION CHANCE
───────────────────
Each source link table carries applicationChance Float (0.0–1.0). The probability
the effect is applied when the source fires. 1.0 = always; 0.0 = never.

  ItemEquipmentProfile_StatEffect — roll is made once per action use; if it fires,
                                    the effect applies to all targets of that action.
  ConditionDef_CombatStatEffect   — works identically to the item link. No special-casing
                                    in application logic. The only difference is that
                                    sourceEntityConditionId is set on the active instance,
                                    giving it condition-scoped duration.
  AbilityDef_StatEffect           — applied on combat entry while the ability is active.

STACKING WITH ALWAYS-ON MODIFIERS
───────────────────────────────────
CombatStatEffectDef is a combat-entry layer — effects are created at combat start and
removed when combat ends. Always-on modifiers (Ability_StatModifier, Ability_DamageModifier,
ConditionDef_StatEffect, ConditionDef_DamageModifier) apply independently in and out of
combat and are not replaced by a CombatStatEffectDef covering the same stat or damage type.

If both layers are defined for the same ability/condition and the same stat or damage type,
both apply in combat and the values add. This is intentional when the modifiers represent
different things (e.g. a permanent +2 STR plus a combat-only +1 STR adrenaline burst), but
will silently double-count if the same value is duplicated across both layers by mistake.

COEXISTENCE WITH ConditionDef_CombatEffect
───────────────────────────────────────────
ConditionDef_CombatEffect is retained for two narrow cases:
  a) Skill-derived magnitude — flatModifier is null and the value is read from
     EntityCondition.resolvedFlatModifier at resolution time (e.g. a hit penalty
     that scales with how advanced the disease is).
  b) Behavioral effects from conditions — action_denial (stun/paralysis) is a
     behavioral concern that belongs to CombatEffectType / ActiveCombat_BehaviorEffect,
     not to CombatStatEffectDef.

For everything else — fixed-value DoT, HoT, stat mods, roll mods, AC mods, advantage,
damage resistance — use ConditionDef_CombatStatEffect. Those route through
CombatStatEffectDef and are reusable across items, abilities, and conditions.

EXAMPLE — Snake Venom (DoT, shared across sources):
  CombatStatEffectDef:
    codeName       = "snake_venom"
    displayName    = "Snake Venom"
    durationRounds = 3
    stackBehavior  = "refresh"
  CombatStatEffectDef_DamageOverTime:
    diceCount = 1, diceSides = 4, flatDamage = 0, damageTypeId → Physical
  Sources:
    ItemEquipmentProfile_StatEffect (Snake Bite profile) → applicationChance = 1.0
    ItemEquipmentProfile_StatEffect (Venom-Coated Blade profile) → applicationChance = 0.5


─────────────────────────────────────────────
12. PRE-COMBAT EFFECTS
─────────────────────────────────────────────

Entity_PreCombatEffect tracks stat effects applied to an entity outside of active
combat — pre-fight buffs, blessings, or ability-triggered effects that should carry
into the next combat encounter.

FIELDS
───────
  entityId           — the entity holding the effect
  effectDefId        — FK → CombatStatEffectDef; defines what the effect does
  appliedAt          — when the effect was applied (for narrative / logging)
  expiresAt          — wall-clock expiry; background worker deletes rows past this time
  equipmentProfileId — set when applied via an item or ability-granted action
  abilityDefId       — set when applied passively by an ability with no action involved
  (both null)        — system, admin, or event source

STACKING
─────────
Governed by effectDef.stackBehaviorId at application time:
  "refresh" — app updates expiresAt on the existing row; no new row inserted.
  "stack"   — app inserts a new row (multiple rows per entity + def are valid).
  "ignore"  — app no-ops if a row for this entity + def already exists.

AT COMBAT START
────────────────
For each participant joining combat the engine:
  1. Queries Entity_PreCombatEffect WHERE entityId = participant AND expiresAt > now().
  2. For each active entry: creates an ActiveCombat_StatEffect with
       roundsRemaining = effectDef.durationRounds  (full rounds — no pro-rating).
       roundsRemaining = null if effectDef.durationRounds is null (lasts entire combat).
  3. If equipmentProfileId is set and that profile has cooldownRounds > 0:
       creates an ActiveCombat_Participant_ActionCooldown for that participant + profile.

This table is not modified by combat start or end. The background worker is the sole
deletion mechanism — it removes rows where expiresAt < now() on each tick, regardless
of combat state. If combat ends while the real-time buff is still active, the entry
remains and will carry into the next combat encounter.

EXAMPLE — Blessed (pre-combat buff from a healer):
  Entity_PreCombatEffect:
    effectDefId        → "blessed" CombatStatEffectDef (+2 hit roll for 3 combat rounds)
    expiresAt          = appliedAt + 1 hour
    equipmentProfileId → Healer's Blessing profile (cooldownRounds = 2)
  At combat start:
    ActiveCombat_StatEffect created with roundsRemaining = 3
    ActiveCombat_Participant_ActionCooldown created for healer, profile, roundsRemaining = 2
