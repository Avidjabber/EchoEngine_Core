COMBAT SYSTEM — DESIGN REFERENCE
==================================
Last updated: 2026-04-06

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
  inSecondWind     — entity hit 0 HP and chose to recover rather than be defeated.
                     HP and AC are read live from EntityStats and Species — nothing
                     is snapshotted on the participant. At combat end: if
                     inSecondWind = true and EntityStats.currentHp < 50% of EntityStats.maxHp,
                     a second wind consequence condition is rolled and applied.
                     NPC entities never trigger second wind.
  hasFled          — entity fled; removed from turn order, earns no XP or rep.
  isDefeated       — entity eliminated (0 HP without second wind, or NPC at 0 HP).

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

ActiveCombat_BehaviorEffect tracks persistent multi-round effects (guard, taunt,
parry, absorb, etc.). Rows are decremented at round start and deleted at 0.

  effectTypeId  — FK → CombatEffectType; the name field holds the behavior key
                  (e.g. "guard", "taunt", "parry", "absorb"). CombatEffectType
                  flags describe what the effect does (redirectsDamage, forcesTargeting, etc.)

Directional semantics:
  guard:  affectedParticipantId = guarding entity;  linkedParticipantId = guarded ally
  taunt:  affectedParticipantId = taunted entity;   linkedParticipantId = taunter
  parry:  affectedParticipantId = parrying entity;  linkedParticipantId = null
  absorb: affectedParticipantId = absorbing entity; linkedParticipantId = null

Guard and taunt state are NOT cached on ActiveCombat_Participant — query
ActiveCombat_BehaviorEffect directly at resolution time.


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
  hitRoll / hitModifier / hit            — attack roll, modifier applied, and whether it connected
  damageRoll / damageModifier / damageDealt — damage roll, modifier applied, and final damage
  healDealt                               — HP restored (heal actions)
  secondWindTriggered                     — true if this action caused a second wind


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
  DamageCategory                       — Physical | Magical | True (seed)
  DamageType                           — guild-extensible; FK → DamageCategory
  CombatTargetScope                    — targetsAllies / targetsEnemies scope (seed)
  SpeciesCombatBehavior                — NPC AI action weights and target strategies
  SpeciesDefaultLoadout                — items granted to all entities of a species

  ACTIVE INSTANCES
  ActiveCombat                         — live encounter
  ActiveCombat_Participant             — per-entity state within a combat
  ActiveCombat_Participant_ActionCooldown — cooldown tracking per action
  ActiveCombat_BehaviorEffect          — persistent multi-round behavior effects
  ActiveCombat_Action                  — action log for Discord narrative reconstruction
