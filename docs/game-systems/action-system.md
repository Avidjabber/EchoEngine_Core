ACTION SYSTEM — DESIGN REFERENCE
==================================
Last updated: 2026-04-03

This file is the authoritative reference for how actions (patrols, hunts, etc.)
work in EchoPaw. Read this before touching action seeding, instance resolution,
or discipline/stat XP reward logic.


─────────────────────────────────────────────
1. WHAT ARE ACTIONS?
─────────────────────────────────────────────

Actions are activities that entities perform together — border patrols, herb
gathering, hunting runs, training sessions, etc. They are the primary mechanism
through which entities earn discipline XP and stat point XP.

ActionType defines what an action is and how it behaves.
ActionInstance is a single in-progress or completed run of that action type.

Actions are guild-extensible: guildId = "global" for seeded defaults;
guilds may define their own.


─────────────────────────────────────────────
2. ACTION TYPE DEFINITION
─────────────────────────────────────────────

  Field                     │ Purpose
  ──────────────────────────┼────────────────────────────────────────────────
  name                      │ Internal key e.g. "border_patrol" (unique per guild)
  displayName               │ User-facing label
  energyCost                │ Energy drained from each participant on start
  minEntities / maxEntities         │ Participant bounds; maxCats null = unlimited
  durationMinutes           │ Time until resolution; null = resolves on next tick
  baseFactionReward         │ Clan rep granted per participant on completion (can be negative)
  systemTypeId              │ FK → ActionSystemType. null = pure reward action (auto-resolves,
                            │ no subsystem). Non-null = invokes a seeded bot subsystem on resolution.
                            │ See ActionSystemType seed rows for the full list of valid values.
                            │ Only guildId = "global" actions may have a non-null systemTypeId.
  isInteractive             │ false = auto-resolves silently; true = step-by-step user interaction
  requiresCanMentor         │ At least one participant must have Rank.canMentor
  allowApprenticesWithAdult │ Apprentices may join only if a canMentor cat is present
  requiresCanLeadEvents     │ The initiating entity must have Rank.canLeadEvents
  minAgeMoons               │ Minimum age to participate; null = no minimum


─────────────────────────────────────────────
3. DISCIPLINE & STAT POINT REWARDS
─────────────────────────────────────────────

Each ActionType has one or more ActionType_DisciplineReward rows specifying
how much XP is earned in each discipline on completion and who receives it.

  actionTypeId    — the action type
  disciplineId    — which DisciplineDef receives the XP
  xpAmount        — flat XP granted to qualifying recipients
  recipientScope  — who receives this reward:
    "all"               — every participant (default)
    "leader_only"       — only ActionInstance.leaderCatId
    "participants_only" — all non-leader participants
    "winners_only"      — winning side of a combat-spawning action
    "losers_only"       — losing side of a combat-spawning action

The stat progression DisciplineDef row (isStatProgression = true) is referenced
here exactly like any other discipline. Most actions will have a row for it.

EXAMPLE — Border Patrol:
  Scouting        → 50 XP  [all]
  StatProgression → 30 XP  [all]

EXAMPLE — Herb Gathering:
  Farming         → 60 XP  [all]
  StatProgression → 25 XP  [all]

EXAMPLE — Training Session:
  Training        → 40 XP  [leader_only]   (mentor earns it for teaching)
  StatProgression → 20 XP  [all]

EXAMPLE — Spar:
  Training        → 20 XP  [leader_only]   (mentor earns it for teaching)
  Combat          → (flows from Species.combatXpReward × 0.5 via combat engine)
  StatProgression → 15 XP  [winners_only]

Guilds control progression speed by tuning xpAmount on their action types —
the same lever used for discipline XP and stat point XP. There is no separate
global cap; the threshold per stat point is set on DisciplineDef.baseXp.


─────────────────────────────────────────────
4. DEFAULT ITEMS
─────────────────────────────────────────────

ActionType_DefaultItem rows define items shadow-equipped to participants
when an ActionInstance starts and removed when it ends.

  itemId     — the item to shadow-equip
  autoEquip  — whether it is equipped automatically (default true)
  leaderOnly — true = only the leader gets it; false = all participants

Used for patrol leader tokens, shared tools, etc.


─────────────────────────────────────────────
5. ACTION INSTANCES
─────────────────────────────────────────────

ActionInstance tracks a single run of an ActionType:

  factionId    — the owning faction
  locationId   — where it takes place; null = at camp
  leaderCatId  — entity leading the instance
  isActive     — false once completed or interrupted
  startedAt    — when the instance began
  completedAt  — set on resolution

ActionInstance_Entity records each participant and snapshots their rewards:

  energySpent        — energy drained from this entity
  factionRepEarned      — faction rep snapshot (may be negative)
  disciplineXpEarned — per-discipline XP snapshots (ActionInstance_Entity_DisciplineXp)


─────────────────────────────────────────────
5b. SYSTEM-BACKED ACTIONS AND XP
─────────────────────────────────────────────

Actions with a non-null systemType invoke a bot subsystem at resolution. XP
flows differently depending on the system:

  systemType = "spar"
    Spawns an ActiveCombat (CombatInitiationType = spar). The combat engine
    handles the fight. On conclusion:
      - Combat discipline XP flows from Species.combatXpReward × 0.5 to all
        non-fled winning participants (same path as regular combat, halved).
      - ActionType_DisciplineReward rows handle everything else: Training XP
        to the leader, StatProgression to winners/losers, faction rep, etc.
        Use recipientScope = "winners_only" / "losers_only" as needed.
    The spar flag suppresses lethal outcomes. Energy cost, duration, and faction
    rep are configured in Guild_ActionConfig.

  systemType = "crafting"
    Opens the crafting UI for participants. The ActionType carries NO
    DisciplineReward rows — all XP flows from Recipe_DisciplineReward on the
    specific recipes executed during the session. Energy cost and duration
    are the only meaningful fields on the ActionType itself.

  systemType = "hunting" | "foraging"
    Auto-resolves with drop table / prey weight rolls. ActionType_DisciplineReward
    rows define XP as normal — these are the primary XP source since no
    sub-recipes are executed.

  systemType = "farming_plant"
    Entity plants a propagation item into an open plot slot. Consumes the
    StoredItem and creates a PlotCrop. Reads Item.plantDefId for the PlantDef.

  systemType = "farming_harvest"
    Harvests a mature PlotCrop using PlantDef.harvestDropTableId. Crop remains.

  systemType = "farming_uproot"
    Uproots a PlotCrop at any stage using PlantDef.uprootDropTableId. Crop deleted.

  systemType = "farming_crossbreed"
    Cross-breeds two mature PlotCrops sharing the same root PlantDef.
    Solo only (maxCats = 1). Gated via ActionType_DisciplineRequirement.
    On success: new ephemeral PlantDef + ephemeral seed Item created.
    On failure: offspring inherits one parent's PlantDef unchanged.

  systemType = "farming_tend"
    Applies Compost to a Plot, increasing Plot.soilQuality. Consumes a
    Compost StoredItem from storage.

  systemType = "farming_water"
    Daily tending action. Updates PlotCrop_TendRecord, increments PlotCrop.carePoints
    by 1. If the performing entity has a matching Ability_PlotBuff, writes a
    growth_rate Plot_Buff on the target plot (or refreshes its expiresAt).
    tendCooldownHours = 24. tendCarePoints = 1.

  systemType = "farming_prune"
    Weekly tending action. Updates PlotCrop_TendRecord, increments PlotCrop.carePoints
    by 7. If the performing entity has a matching Ability_PlotBuff, writes a
    yield Plot_Buff on the target plot (or refreshes its expiresAt).
    tendCooldownHours = 168. tendCarePoints = 7.

  systemType = "farming_fertilize"
    Weekly tending action. Updates PlotCrop_TendRecord, increments PlotCrop.carePoints
    by 7. If the performing entity has a matching Ability_PlotBuff, writes a
    decay_resistance Plot_Buff on the target plot (or refreshes its expiresAt).
    tendCooldownHours = 168. tendCarePoints = 7.

  TENDING ACTIONS — ActionSystemType fields
    tendCooldownHours  Int?  Hours before this action can be performed again on the
                             same PlotCrop. Null for non-tending actions.
    tendCarePoints     Int?  Points added to PlotCrop.carePoints on completion.
                             Null for non-tending actions.

  See farming-system.md section 7 for full farming action type reference.


─────────────────────────────────────────────
5c. ACTION DISCIPLINE REQUIREMENTS
─────────────────────────────────────────────

ActionType_DisciplineRequirement gates an action type behind a minimum discipline
level. Guild-specific — each guild controls which of their action types are gated
and at what threshold.

  guildId          String   The guild that owns this requirement.
  actionTypeId     Int      FK → ActionType
  disciplineDefId  Int      FK → DisciplineDef
  minLevel         Int      Minimum discipline level required.
  scope            String   Who must meet the requirement:
                              "leader" — only the leader entity must qualify.
                              "all"    — every participant must qualify.

No rows for a given action type = no gate; any entity may perform it.
Multiple rows on the same action type are all enforced (AND logic) — an entity
could be required to meet both Farming level 3 AND Crafting level 2.

EXAMPLE — Cross-breeding (farming guild gate):
  actionTypeId → cross_breed
  disciplineDefId → Farming
  minLevel → 5
  scope → "leader"   (solo action; only the performing entity is checked)

EXAMPLE — Advanced Herb Gathering (all participants must qualify):
  actionTypeId → advanced_herb_gather
  disciplineDefId → Farming
  minLevel → 3
  scope → "all"


─────────────────────────────────────────────
6. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Disciplines — ActionType_DisciplineReward rows drive all discipline and stat
                point XP. The app iterates reward rows on completion and credits
                Entity_Discipline.currentXp for each, triggering level-ups or
                stat point grants as thresholds are crossed.

  Events      — EventDef_ActionType links action types to event definitions.
                Completing certain actions can trigger event chains.

  Items       — ActionType_DefaultItem shadow-equips items for the duration.
                Ability_GrantedAction can also unlock item actions during events.

  Energy      — ActionType.energyCost drains EntityStats.currentEnergy on start.
                Daily tick replenishes energy up to GuildSettings.defaultDailyEnergy.


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  ActionSystemType              — seeded reference table; one row per bot subsystem
  ActionType                    — definition; guild-extensible; systemTypeId FK → ActionSystemType
  ActionType_DisciplineReward   — per-discipline XP rewards; PK is (actionTypeId, disciplineId, recipientScope)
                                  allowing the same discipline to reward winners and losers at different amounts
  ActionType_DefaultItem        — items shadow-equipped during the action
  ActionType_DisciplineRequirement — guild-specific discipline level gates per action type
  ActionInstance                     — a single in-progress or completed run
  ActionInstance_Entity              — per-participant record with reward snapshots
  ActionInstance_Entity_DisciplineXp — per-discipline XP snapshot per participant
