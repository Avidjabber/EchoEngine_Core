STRUCTURE & CAMP SYSTEM — DESIGN REFERENCE
==========================================
Last updated: 2026-04-04

This file is the authoritative reference for how camps and structures work in
EchoPaw. Read this before touching camp creation, structure definitions, upgrade
paths, construction progression, or any system that reads structure state.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Camps are named collections of structures belonging to a faction at a specific
location. A faction may have zero or more camps — factions with no fixed territory
(e.g. a raider band) have none.

The system is split across three ownership layers:

  Engine (seeded)    — StructureType defines the mechanical categories (storage,
                       farming, etc.) and what properties each category exposes.
  Guild (defined)    — StructureDef is the guild's named structure: what it costs
                       to build, its base values, and its upgrade path.
  Instance           — Structure is a specific built installation in a camp.

This means the engine ships with "here is what storage means mechanically." Each
guild decides what their storage structure is called, what it costs, and how it
can be upgraded — or whether upgrades exist at all.


─────────────────────────────────────────────
2. CAMP
─────────────────────────────────────────────

A Camp represents a faction's physical presence at a location. Camps are
admin-created records — there is no construction process for a camp itself.
The work is in the structures built within it.

  Field       │ Purpose
  ────────────┼──────────────────────────────────────────────────────────────
  factionId   │ FK → Faction. The owning faction.
  locationId  │ FK → Location. A camp is always tied to exactly one location.
  name        │ Display name (e.g. "Main Camp", "Northern Outpost")
  description │ Optional flavour text.
  filthLevel  │ Int. Current filth accumulation at this camp. Drives filth-trigger
              │ events. Tracked per camp, not per faction or guild.

Key rules:
  - A faction may have zero camps (no home territory required).
  - A faction may have multiple camps at different locations.
  - Multiple factions may have camps at the same location (contested territory).

STRUCTURE LIMITS
─────────────────
Camp_StructureLimit defines how many structures of each type may exist in a camp.
No row for a given type means that type cannot be built there at all.

  campId           │ FK → Camp
  structureTypeId  │ FK → StructureType
  maxCount         │ Int. Maximum number of active structures of this type allowed.

The app enforces this limit when a new Construction is initiated: the count of
active (non-destroyed) structures of that type in the camp must be below maxCount.
Destroyed structures do not count against the limit — a replacement can always
be built up to the cap.


─────────────────────────────────────────────
3. STRUCTURE TYPES (SEEDED)
─────────────────────────────────────────────

StructureType is the engine-seeded category layer. It defines the mechanical
purpose of a structure and which effect types are valid for upgrades on it.
Guilds do not create StructureType rows — they reference them when defining
their own StructureDefs.

  Each seeded type maps to a specific engine system. Guilds cannot create
  new StructureType rows — they define structures within these categories.

  Seeded types:

  Name      │ Purpose
  ──────────┼──────────────────────────────────────────────────────────────
  storage   │ Holds items. Connects to the Storage system.
  farming   │ Contains plots for growing crops. Connects to the Farming system.
  housing   │ Provides living quarters for entities. Connects to the Housing system.
            │ Housing properties TBD when the housing system is designed.

VALID EFFECT TYPES PER CATEGORY
─────────────────────────────────
  storage:  solid_capacity | liquid_capacity | rot_modifier | security_rating
  farming:  plot_count | growth_rate | season_override | env_override | soil_quality
  housing:  (TBD — defined when the housing system is built out)


─────────────────────────────────────────────
4. STRUCTURE DEFINITIONS (GUILD-DEFINED)
─────────────────────────────────────────────

StructureDef is the guild's specific named structure. It references a seeded
StructureType and defines everything about how that structure is built and upgraded.

  Field              │ Purpose
  ───────────────────┼────────────────────────────────────────────────────────
  guildId            │ Owning guild.
  structureTypeId    │ FK → StructureType. Determines mechanical behaviour.
  name               │ Internal key e.g. "mossy_storage_den"
  displayName        │ User-facing label.
  description        │ Optional flavour text.
  constructionPoints │ Progress points required for the initial build. Each
                     │ structure_contribute action contributes ActionSystemType
                     │ .progressPoints toward this total.

Base values for type-specific properties are defined on extension config rows
(see section 4a). These represent the structure's state before any upgrades apply.

StructureDef_BuildCost defines the items required to initiate the initial build:

  structureDefId  │ FK → StructureDef
  itemId          │ FK → Item
  quantity        │ Int

4a. TYPE-SPECIFIC BASE CONFIG
───────────────────────────────
  StructureDef_StorageConfig  (for structureTypeId = storage)
    structureDefId       FK → StructureDef
    baseCapacitySolids   Int
    baseCapacityLiquids  Int
    baseRotModifier      Float  (1.0 = no effect; < 1.0 = slower rot)

  StructureDef_FarmingConfig  (for structureTypeId = farming)
    structureDefId       FK → StructureDef
    plotTypeId           FK → PlotType. All plots in this structure share this type.
    basePlotCount        Int. Number of plots created when the structure is built.
    defaultSoilQuality   Float. soilQuality assigned to each plot when created.
                         Guild-defined — e.g. 1.0 for a basic garden, 1.2 for a
                         pre-composted bed. Applies to plots added by upgrades too.


─────────────────────────────────────────────
5. UPGRADES (GUILD-DEFINED)
─────────────────────────────────────────────

StructureDef_Upgrade defines a discrete, independently applicable upgrade for
a specific StructureDef. Upgrades are modular — there is no required linear
path. A guild may define as many or as few upgrade options as they like, or none.

  Field              │ Purpose
  ───────────────────┼────────────────────────────────────────────────────────
  structureDefId     │ FK → StructureDef
  name               │ Internal key e.g. "irrigation", "rat_proofing"
  displayName        │ User-facing label
  description        │ Plain-language description of what this upgrade does.
  maxApplications    │ Int. Max times this upgrade may be applied to one structure.
                     │ 1 = one-time only; > 1 = stackable up to this limit.
  constructionPoints │ Int. Progress points required to apply this upgrade.

Effects are defined in StructureDef_Upgrade_Effect — one row per effect per upgrade.
An upgrade must have at least one effect row. All effects are applied together when
the upgrade's Construction completes.

StructureDef_Upgrade_Effect defines the individual effects of an upgrade:

  upgradeId            │ FK → StructureDef_Upgrade
  effectType           │ Which property this effect modifies. Must be valid for the
                       │ parent StructureDef's StructureType. See section 3.
  effectValue          │ Float. The delta applied per application (additive).
  targetEnvConditionId │ FK → EnvCondition. Required when effectType = env_override;
                       │ null for all other effect types. Specifies which env condition
                       │ this effect counteracts (e.g. Drought, Cold, Toxic).
                       │ App enforces this is set for every env_override effect row.

StructureDef_Upgrade_BuildCost defines items required to apply the upgrade:

  upgradeId  │ FK → StructureDef_Upgrade
  itemId     │ FK → Item
  quantity   │ Int

EXAMPLE — Guild-defined upgrades for a "Mossy Storage Den" (type: storage):
  "solid_expansion"  maxApplications: 3  effects: solid_capacity +20
  "liquid_barrels"   maxApplications: 3  effects: liquid_capacity +10
  "cold_storage"     maxApplications: 2  effects: rot_modifier -0.2
  "rat_proofing"     maxApplications: 1  effects: security_rating +1
  "fortified_den"    maxApplications: 1  effects: solid_capacity +10, security_rating +2

EXAMPLE — Guild-defined upgrades for a "Bramble Garden" (type: farming):
  "extra_plots"      maxApplications: 6  effects: plot_count +3
  "irrigation"       maxApplications: 1  effects: growth_rate +0.15
  "greenhouse_cover" maxApplications: 2  effects: season_override +0.5
  "drought_shield"   maxApplications: 2  effects: env_override +0.5 → Drought
  "frost_cover"      maxApplications: 1  effects: env_override +1.0 → Cold
  "basic_compost"    maxApplications: 5  effects: soil_quality +0.1
  "rich_compost"     maxApplications: 2  effects: soil_quality +0.25, growth_rate +0.05

SOIL QUALITY EFFECT
─────────────────────
  soil_quality upgrades are applied directly to Plot rows. When a soil_quality upgrade
  completes, all Plot rows linked to this structure have soilQuality += effectValue
  applied immediately. Plots added later (via plot_count upgrades) are initialized
  with StructureDef_FarmingConfig.defaultSoilQuality — soil_quality upgrades do not
  retroactively apply to new plots, so the order of upgrade application matters.

  Unlike capacity upgrades (which recompute a stored field), soil_quality writes
  directly into Plot.soilQuality. This means the effect persists on the plots
  themselves and is visible to any system that reads Plot.soilQuality.

UPGRADE RELATIONS
───────────────────
  StructureDef_Upgrade_Relation defines dependency and exclusion rules between upgrades
  on the same StructureDef. Relations are directional — the app checks all relation
  rows where upgradeId = the upgrade being applied.

  StructureDef_Upgrade_Relation:
    upgradeId       FK → StructureDef_Upgrade  (the upgrade being constrained)
    relationType    REQUIRES | BLOCKS | UPGRADES
    targetUpgradeId FK → StructureDef_Upgrade  (the upgrade being referenced)

  Both upgradeId and targetUpgradeId must belong to the same StructureDef.
  An upgrade may have any number of relation rows.

  Relation semantics:

    REQUIRES — upgradeId cannot be applied unless at least one application of
               targetUpgradeId is already recorded on this structure. Enforced at
               application time; if the requirement is not met, the construction
               cannot be initiated.

    BLOCKS   — upgradeId cannot be applied if any application of targetUpgradeId
               is already recorded on this structure. One-directional: if A BLOCKS B,
               A is blocked by B's presence — but B is not automatically blocked by A
               unless a separate B BLOCKS A row exists.

    UPGRADES — upgradeId is a direct tier upgrade of targetUpgradeId. Cannot be
               applied unless at least one application of targetUpgradeId is already
               recorded (implicit REQUIRES). On completion, all Structure_AppliedUpgrade
               rows for targetUpgradeId are deleted — no item cost refund is given.
               Net result: only one tier is active at a time.
               Useful for upgrade tiers (basic → advanced) where the advanced version
               supersedes the basic one.

  EXAMPLE — upgrade relations for a "Bramble Garden":
    "rich_compost"     REQUIRES "basic_compost"    — must have composted first
    "greenhouse_cover" REQUIRES "irrigation"       — needs water infrastructure first
    "frost_cover"      BLOCKS   "drought_shield"   — can't insulate for both extremes
    "drought_shield"   BLOCKS   "frost_cover"
    "rich_compost"     UPGRADES "basic_compost"    — advanced compost supersedes basic

SEASON AND ENV OVERRIDE EFFECTS
──────────────────────────────────
  season_override and env_override pull modifiers toward 1.0 (neutral) rather than
  adding a flat delta. The effective value is capped at 1.0 (full override).

  structure_season_override = MIN(1.0, SUM of season_override effectValues applied)
  structure_env_override    = MIN(1.0, SUM of env_override effectValues applied)

  effectiveSeasonMod (per crop tick) =
    seasonMod + (1.0 − seasonMod) × structure_season_override

    seasonMod is the PlantDef_Season.growthRateModifier for the current season (0.0–1.0).
    A greenhouse (env_override = 1.0) means a dormant season becomes full speed.
    A season at 0.5 + 0.5 override → 0.75 effective (half way to neutral).

  effective_plant_growth_mod (per crop tick) =
    PRODUCT over all active env conditions that have a plant_growth modifier:
      effectiveCondMod(c) = condPlantGrowthMod(c) + (1.0 − condPlantGrowthMod(c))
                            × conditionOverride(c)
      where conditionOverride(c) = MIN(1.0, SUM of effectValues of all env_override
            upgrades applied to this structure with targetEnvConditionId = c)

    Each env condition is overridden independently. A Drought Shield upgrade only
    counteracts Drought's plant_growth reduction — Cold, Toxic, etc. are unaffected.
    env_override does not affect per-plant required env conditions — only the
    plant_growth modifier that each location/biome condition contributes.
    Override pulls each condition's modifier toward 1.0; cannot boost above neutral.

  Examples:
    season dormant (0.0) + 0.5 season_override → 0.5 effective (half speed, not stopped)
    season dormant (0.0) + 1.0 season_override → 1.0 effective (full greenhouse, season ignored)
    Drought reduces plant_growth to 0.4; Drought env_override 0.5 → 0.7 effective for Drought only
    Drought reduces plant_growth to 0.4; Drought env_override 1.0 → 1.0 effective (fully counteracted)
    Cold also active at 0.6; no Cold env_override → 0.6 still applies; combined = 0.7 × 0.6 = 0.42
    Cultivated boosts plant_growth to 1.5; any env_override on Cultivated → unchanged (only pulls toward 1.0)


─────────────────────────────────────────────
6. STRUCTURE INSTANCES
─────────────────────────────────────────────

Structure tracks a single built (or in-progress) installation within a camp.

  Field          │ Purpose
  ───────────────┼──────────────────────────────────────────────────────────
  id             │
  campId         │ FK → Camp
  structureDefId │ FK → StructureDef
  status         │ active | under_construction | destroyed
  name           │ Optional custom label for this specific structure.

Structure_AppliedUpgrade records each upgrade application. One row is created
per application when the upgrade's Construction completes.

  structureId  │ FK → Structure
  upgradeId    │ FK → StructureDef_Upgrade
  appliedAt    │ DateTime

Checking whether a further application is allowed:
  COUNT(Structure_AppliedUpgrade WHERE structureId AND upgradeId) < StructureDef_Upgrade.maxApplications

Effective values are computed at runtime:
  effectiveValue = base (from StructureDef config) + SUM(effectValue per applied upgrade row)

TYPE-SPECIFIC EXTENSIONS
──────────────────────────
  Structure_Storage  — join table linking a storage-type Structure to its Storage instance.
                       One row per storage structure. Carries all capacity and behaviour
                       fields so that Storage itself remains a pure item container.

    structureId        FK → Structure (1:1)
    storageId          FK → Storage   (1:1)
    weightCapacity     Float?  — null = no weight limit; recomputed when solid_capacity upgrades apply
    fluidCapacity      Float?  — null = no fluid limit; recomputed when liquid_capacity upgrades apply
    expirationModifier Float   — default 1.0; recomputed when rot_modifier upgrades apply; < 1.0 = slower rot
    isPrimaryStorage   Boolean — faction's designated primary storage for its accepted item types
    securityRating     Int     — effective sum of security_rating upgrade deltas; read by the event
                                 system to weight theft/raid events at this camp
    acceptedTypes      via Structure_Storage_ItemType (storageId, itemTypeId) — item must match
                       at least one accepted type to be stored here

  Structure_Storage_ItemType — join between Structure_Storage and ItemType.
    storageId   FK → Structure_Storage (via storageId)
    itemTypeId  FK → ItemType

  When an upgrade with effectType solid_capacity, liquid_capacity, rot_modifier, or
  security_rating completes, the app recomputes the effective value and updates the
  Structure_Storage row directly.

  Farming structures use Plot.structureId (FK → Structure) to link plots to their
  parent structure. Each Plot is one growing slot — PlotType and defaultSoilQuality
  come from StructureDef_FarmingConfig. Location is derived via Structure → Camp.
  New Plot rows are created when a plot_count upgrade completes, initialized with
  StructureDef_FarmingConfig.defaultSoilQuality.


─────────────────────────────────────────────
7. CONSTRUCTION
─────────────────────────────────────────────

Every structure begins as a Construction project before becoming active. Upgrades
also go through Construction. A Construction record exists for the duration of
the build and closes on completion.

  Field                │ Purpose
  ─────────────────────┼──────────────────────────────────────────────────
  id                   │
  structureId          │ FK → Structure
  upgradeId            │ FK → StructureDef_Upgrade. null = initial build;
                       │ non-null = applying a specific upgrade.
  pointsRequired       │ Total progress points to complete. Set from
                       │ StructureDef.constructionPoints on initiation.
  pointsRemaining      │ Decrements by ActionSystemType.progressPoints per
                       │ contribution. 0 = complete.
  initiatedByEntityId  │ FK → Entity. Must be the faction leader.
  startedAt            │ DateTime
  completedAt          │ DateTime. Set on completion; null while in progress.

Item costs (StructureDef_BuildCost or StructureDef_Upgrade_BuildCost) are consumed
from faction storage when the Construction is initiated.

On completion (hoursRemaining = 0):
  - Initial build → Structure.status set to active
  - Upgrade       → Structure_AppliedUpgrade row created; effect applies immediately
                    For plot_count upgrades: new Plot rows created for the structure

CONTRIBUTING TO CONSTRUCTION
──────────────────────────────
After a leader initiates construction, any faction member may contribute.
Contributing uses the systemType = "structure_contribute" action:

  - Energy cost:       GuildSettings.defaultDailyEnergy ÷ 8 per contribution
  - Effect:            Construction.pointsRemaining − ActionSystemType.progressPoints
  - Reward:            Clan rep (baseClanRepReward on the ActionType)
  - Natural daily cap: energy runs out after 8 contributions (one full work day)

The bot presents active Construction projects in the faction's camps; the player
selects one and the action resolves immediately with no further tracking needed.


─────────────────────────────────────────────
8. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Factions   — Camp.factionId links a camp to its owning faction. A faction with
               no camps has no fixed territory, no structures, and no faction
               storage — campless factions rely on personal entity inventories.
               Faction.activeCampId points to the faction's currently active camp.

  Locations  — Camp.locationId places the camp in the world. Farming structures
               inherit their location's biome and env conditions for crop growth.

  Farming    — Plot.structureId links plots to their farming structure.
               See farming-system.md for growth, harvest, and crop logic.

  Storage    — Structure_Storage is a join table linking a storage-type Structure
               to a Storage instance. It carries the capacity, rot modifier, item
               type restrictions, and isPrimaryStorage flag. The Storage model
               itself is a pure item container (id, guildId, name only).
               See item-definitions.md section 7 for the full storage model.

  Events     — security_rating (a storage upgrade effect type) feeds into event
               weight for camp-level events. Low security_rating raises the weight
               of theft/raid events (e.g. rats raiding food storage). The event
               system reads the effective security_rating of camp structures when
               selecting daily events. See event-system.md for event weight rules.

  Actions    — Construction contribution uses systemType = "structure_contribute".
               Energy, clan rep, and the daily contribution cap are all governed
               by the existing action and energy systems.

  Items      — Build and upgrade item costs are consumed from faction storage on
               Construction initiation.


─────────────────────────────────────────────
9. OPEN QUESTIONS
─────────────────────────────────────────────

  1. StructureType list — RESOLVED. Seeded types are: storage, farming, housing.
     No "other" type. Additional types may be added when new engine systems are built.

  2. Housing base config — DEFERRED. To be designed when the housing system is
     built out. The housing StructureType will be seeded but its config table and
     effect types are TBD.

  3. Storage table definition — RESOLVED. See item-definitions.md section 7.
     Storage is a pure item container. Capacity, rot modifier, and type
     restrictions live on Structure_Storage (for structures) and Entity_Storage
     (for personal inventories).

  4. Raid / security system — RESOLVED. security_rating feeds into event weight
     for camp-level events. Low security increases the weight of theft/raid
     events (e.g. rats raiding food). The event system reads effective
     security_rating from Structure_Storage at event selection time.


─────────────────────────────────────────────
10. SCHEMA SUMMARY
─────────────────────────────────────────────

  StructureType                  — seeded category: storage | farming | housing
  Camp                           — faction + location pairing; zero or more per faction; carries filthLevel
  Camp_StructureLimit            — per-camp cap on how many structures of each type may be built
  StructureDef                   — guild-defined named structure; references a StructureType
  StructureDef_BuildCost         — items required for initial build
  StructureDef_StorageConfig     — base capacity and rot values for storage-type defs
  StructureDef_FarmingConfig     — base plot count and soil quality for farming-type defs
  StructureDef_Upgrade           — guild-defined modular upgrade for a StructureDef
  StructureDef_Upgrade_Effect    — individual effects of an upgrade (one row per effect; upgrades may have many)
  StructureDef_Upgrade_BuildCost — items required to apply an upgrade
  StructureDef_Upgrade_Relation  — REQUIRES / BLOCKS / UPGRADES rules between upgrades on the same def
  Structure                      — a single installation within a camp
  Structure_AppliedUpgrade       — record of each upgrade application on a structure
  Structure_Storage              — join: links a storage-type Structure to a Storage; carries capacity/rot/type rules
  Structure_Storage_ItemType     — item types accepted by a structure storage
  Construction                   — active or completed build/upgrade project
