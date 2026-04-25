ACTION SYSTEM — DESIGN REFERENCE
==================================
Last updated: 2026-04-06

This file is the authoritative reference for how actions (patrols, hunts, etc.)
work in EchoPaw. Read this before touching action seeding, instance resolution,
or discipline/stat XP reward logic.


─────────────────────────────────────────────
1. WHAT ARE ACTIONS?
─────────────────────────────────────────────

Actions are activities that entities perform together — border patrols, herb
gathering, hunting runs, training sessions, etc. They are the primary mechanism
through which entities earn discipline XP and stat point XP.

ActionType defines what an action is and which system it invokes. Everything
else — costs, durations, rewards, and discipline gates — is configured per guild.

ActionInstance is a single in-progress or completed run of that action type.

All action types are defined by the bot and are universal across all guilds.
Guilds cannot create their own action types.


─────────────────────────────────────────────
2. ACTION TYPE DEFINITION
─────────────────────────────────────────────

ActionType holds the universal definition of an action: what it is, what system
it invokes, and which eligibility rules are enforced regardless of guild. It does
NOT store costs, durations, or rewards — those are per-guild (see section 2b).

  Field                     │ Purpose
  ──────────────────────────┼────────────────────────────────────────────────
  name                      │ Internal key e.g. "border_patrol" (globally unique)
  displayName               │ User-facing label
  systemTypeId              │ FK → ActionSystemType. null = pure reward action (auto-resolves,
                            │ no subsystem). Non-null = invokes a bot subsystem on resolution.
  requiresCanMentor         │ At least one participant must have Rank.canMentor
  allowApprenticesWithAdult │ Apprentices may join only if a canMentor entity is present
  requiresCanLeadEvents     │ The initiating entity must have Rank.canLeadEvents
  minAge                    │ Minimum age (in moons) to participate; null = no minimum


─────────────────────────────────────────────
2b. PER-GUILD ACTION CONFIGURATION
─────────────────────────────────────────────

Guild_ActionConfig holds the per-guild tuning for each action type. If no row
exists for a guild + action pair, the action is unavailable in that guild until
configured. baseFactionReward may be negative (e.g. a risky or taboo activity).

  Field             │ Purpose
  ──────────────────┼────────────────────────────────────────────────
  energyCost        │ Energy drained from each participant on start
  dailyLimit        │ null = energy-only limit; non-null = max starts per entity per day
  minEntities       │ Minimum participants required
  maxEntities       │ Maximum participants; null = unlimited
  durationMinutes   │ Time until resolution; null = resolves immediately on next tick
  baseFactionReward │ Faction rep granted per participant on completion (can be negative)


─────────────────────────────────────────────
3. DISCIPLINE & STAT POINT REWARDS
─────────────────────────────────────────────

Each ActionType has one or more ActionType_DisciplineReward rows specifying
how much XP is earned in each discipline on completion and who receives it.
These rows are per-guild — each guild configures its own reward amounts.

  guildId         — the guild this reward row belongs to
  actionTypeId    — the action type
  disciplineId    — which DisciplineDef receives the XP
  xpAmount        — flat XP granted to qualifying recipients
  recipientScope  — who receives this reward:
    "all"               — every participant (default)
    "leader_only"       — only ActionInstance.leaderEntityId
    "participants_only" — all non-leader participants
    "winners_only"      — winning side of a combat-spawning action
    "losers_only"       — losing side of a combat-spawning action

PK is (guildId, actionTypeId, disciplineId, recipientScope), allowing the same
discipline to reward winners and losers at different amounts.

The stat progression DisciplineDef row (isStatProgression = true) is referenced
here exactly like any other discipline. Most actions will have a row for it.

EXAMPLE — Border Patrol:
  Combat          → 50 XP  [all]
  StatProgression → 30 XP  [all]

EXAMPLE — Herb Gathering:
  Farming         → 60 XP  [all]
  StatProgression → 25 XP  [all]

EXAMPLE — Training Session:
  Combat          → 40 XP  [leader_only]   (mentor earns it for teaching; discipline set per session)
  StatProgression → 20 XP  [all]

EXAMPLE — Spar:
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

  factionId      — the owning faction
  locationId     — where it takes place; null = at camp
  leaderEntityId — entity leading the instance
  isActive       — false once completed or interrupted
  startedAt      — when the instance began
  completedAt    — set on resolution

ActionInstance_Entity records each participant and snapshots their rewards:

  energySpent      — energy drained from this entity
  factionRepEarned — faction rep snapshot (may be negative)
  disciplineXp     — relation to ActionInstance_Entity_DisciplineXp (one row per discipline rewarded)


─────────────────────────────────────────────
5b. SYSTEM-BACKED ACTIONS AND XP
─────────────────────────────────────────────

Actions with a non-null systemTypeId invoke a bot subsystem at resolution. XP
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

  systemType = "diagnose"
    Opens the diagnosis UI. The performing entity inspects a target entity,
    revealing any hidden symptoms and rolling to identify the active condition.
    Some symptoms are only discoverable through diagnosis.

  systemType = "farming_crop"
    Crop Work action. Presents a picker: plant, harvest, uproot, or cross-breed.
    Internally routes to the appropriate sub-system:

    farming_plant      — Entity plants a propagation item into an open plot slot.
                         Consumes the StoredItem, creates a PlotCrop.
    farming_harvest    — Harvests a mature PlotCrop using PlantDef.harvestDropTableId.
                         Crop remains.
    farming_uproot     — Uproots a PlotCrop at any stage using PlantDef.harvestDropTableId
                         (same formula as harvest; no output if not mature). Crop deleted.
    farming_crossbreed — Cross-breeds two mature PlotCrops sharing the same root PlantDef.
                         Solo only (maxEntities = 1). Gated via ActionType_DisciplineRequirement.
                         On success: new ephemeral PlantDef + ephemeral seed Item created.
                         On failure: offspring inherits one parent's PlantDef unchanged.

    See farming-system.md section 7 for full crop action reference.

  systemType = "farming_compost"
    Deposit compost items into a compost structure, increasing Plot.soilQuality.
    Consumes a Compost StoredItem from storage. May be gated via
    ActionType_DisciplineRequirement if the guild requires a Farming level.

  systemType = "farming_tend"
    Tend Crops action. Presents a picker: water, prune, or fertilize.
    Internally routes to the appropriate sub-system (each tracked separately on
    Plot_TendRecord for per-sub-action cooldown enforcement):

    farming_water      — Daily tending. Increments Plot.carePoints by 1.
                         cooldownHours = 24. progressPoints = 1.
    farming_prune      — Weekly tending. Increments Plot.carePoints by 7.
                         cooldownHours = 168. progressPoints = 7.
    farming_fertilize  — Weekly tending. Increments Plot.carePoints by 7.
                         cooldownHours = 168. progressPoints = 7.

    If the performing entity has a matching Ability_PlotBuff, the resolved
    sub-action writes or refreshes a Plot_Buff on the target plot:
      farming_water     → growth_rate buff
      farming_prune     → yield buff
      farming_fertilize → decay_resistance buff

  TENDING ACTIONS — ActionSystemType fields (on sub-type rows)
    cooldownHours   Int?  Hours before this sub-action can be performed again on the
                          same Plot. Null for non-tending system types.
    progressPoints  Int?  Points added to Plot.carePoints on completion.
                          Null for non-tending system types.

  See farming-system.md section 7 for full farming action type reference.


─────────────────────────────────────────────
5c. ACTION DISCIPLINE REQUIREMENTS
─────────────────────────────────────────────

ActionType_DisciplineRequirement gates an action type behind a minimum discipline
level. Guild-specific — each guild controls which of their action types are gated
and at what threshold.

  guildId      String   The guild that owns this requirement.
  actionTypeId Int      FK → ActionType
  disciplineId Int      FK → DisciplineDef
  minLevel     Int      Minimum discipline level required.
  scope        String   Who must meet the requirement:
                          "leader" — only the leader entity must qualify.
                          "all"    — every participant must qualify.

PK is (guildId, actionTypeId, disciplineId).

No rows for a given guild + action type = no gate; any entity may perform it.
Multiple rows on the same action type are all enforced (AND logic) — an entity
could be required to meet both Farming level 3 AND Crafting level 2.

EXAMPLE — Cross-breeding (farming guild gate):
  guildId → the configuring guild
  actionTypeId → crop_work
  disciplineId → Farming
  minLevel → 5
  scope → "leader"   (solo action; only the performing entity is checked)

EXAMPLE — Advanced Herb Gathering (all participants must qualify):
  actionTypeId → advanced_herb_gather
  disciplineId → Farming
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

  Energy      — Guild_ActionConfig.energyCost drains EntityStats.currentEnergy on start.
                Daily tick replenishes energy up to GuildSettings.defaultDailyEnergy.


─────────────────────────────────────────────
7. ACTION RESOLUTION STEPS
─────────────────────────────────────────────

Some action types (hunting, foraging, etc.) resolve through a sequence of rolls rather than a
single outcome. Each roll is defined as a step on the action type and guild-configured to use
whichever proficiency or stat fits the guild's RP setting.

ActionType_Step defines the engine-side structure: what each roll is and what it determines in
the narrative. Resolution order is hardcoded in the engine. Steps are global — every guild uses
the same step definitions for a given action type.

  codeName      — snake_case slug the engine dispatches on (e.g. "locate_prey", "avoid_detection")
  description   — what this roll determines in the resolution narrative
  defaultStatId — engine-suggested fallback stat if a guild has not configured this step;
                  null = flat d20 with no modifier

Guild_ActionStep_Config is the per-guild assignment of proficiency or stat to each step (the
hunter/actor side):

  proficiencyDefId set — roll = 1d20 + governing stat modifier + proficiency bonus (if proficient)
  statId set (no proficiencyDefId) — roll = 1d20 + stat modifier only; no proficiency bonus
  neither set — engine falls back to ActionType_Step.defaultStatId, then flat d20

This produces four tables total — two for the actor/hunter side, two for the species/prey side:

This produces four tables — two for the actor/hunter side, two for the species/prey side:

  ActionType_Step                 — global: engine defines the step sequence per action type with defaultStatId fallback
  Guild_ActionStep_Config         — guild: assigns proficiency/stat the hunter uses per step
  Species_ActionStep              — global: lookup table of prey-side step types (codeName + defaultStatId); same role as
                                    CraftingInteraction — a slug list the engine dispatches on
  Guild_Species_ActionStep_Config — guild: join table connecting species + prey step + proficiency/stat assignment

The codeName on Species_ActionStep matches the codeName on ActionType_Step so the engine can
cross-reference during resolution — e.g. when it reaches the avoid_detection step in a hunt,
it looks up the prey species' Guild_Species_ActionStep_Config row for avoid_detection.

Guild_ActionStep_Config and Guild_Species_ActionStep_Config share the same fallback chain:
  proficiencyDefId set — roll = 1d20 + governing stat modifier + proficiency bonus (if proficient)
  statId set (no proficiencyDefId) — roll = 1d20 + stat modifier only; no proficiency bonus
  neither set — falls back to the definition table's defaultStatId, then flat d20 if also null

EXAMPLE — Hunting (four steps):
  locate_prey      defaultStat=WIS  "Hunter rolls to detect prey in the location"
  avoid_detection  defaultStat=DEX  "Prey rolls to avoid being noticed"
  pursuit          defaultStat=DEX  "Hunter rolls to close the distance before prey flees"
  escape           defaultStat=DEX  "Prey rolls to outpace the hunter"

  Guild_ActionStep_Config (hunter side, Warriors Cats guild):
    locate_prey     → proficiency: tracking
    avoid_detection → proficiency: perception
    pursuit         → proficiency: hunting
    escape          → stat: DEX

  Guild_Species_ActionStep_Config (prey side, Warriors Cats guild):
    mouse  + avoid_detection → proficiency: stealth
    mouse  + escape          → proficiency: stealth
    rabbit + avoid_detection → proficiency: athletics
    rabbit + escape          → proficiency: athletics


─────────────────────────────────────────────
8. SCHEMA SUMMARY
─────────────────────────────────────────────

  ActionSystemType              — seeded reference table; one row per bot subsystem
  ActionType                    — bot-defined universal definition; systemTypeId FK → ActionSystemType
  ActionType_Step               — engine-defined resolution steps; global; PK autoincrement, @@unique([actionTypeId, codeName])
  Guild_ActionConfig            — per-guild costs and limits; PK is (guildId, actionTypeId)
  Guild_ActionStep_Config           — per-guild proficiency/stat assignment per step (actor/hunter side); PK is (guildId, stepId)
  Species_ActionStep                — global lookup table of prey-side step types; PK autoincrement, codeName unique
  Guild_Species_ActionStep_Config   — per-guild join: species + prey step + proficiency/stat; PK is (guildId, speciesId, speciesActionStepId)
  ActionType_DisciplineReward   — per-guild XP rewards; PK is (guildId, actionTypeId, disciplineId, recipientScope)
                                  allowing the same discipline to reward winners and losers at different amounts
  ActionType_DefaultItem        — items shadow-equipped during the action
  ActionType_DisciplineRequirement — per-guild discipline level gates; PK is (guildId, actionTypeId, disciplineId)
  Entity_ActionUsage                 — daily usage counter per entity per action type; enforces Guild_ActionConfig.dailyLimit
  Action_EntityDailyRecord           — daily count per entity per ActionSystemType; enforces ActionSystemType.entityDailyLimit
  ActionInstance                     — a single in-progress or completed run
  ActionInstance_Entity              — per-participant record with reward snapshots
  ActionInstance_Entity_DisciplineXp — per-discipline XP snapshot per participant
