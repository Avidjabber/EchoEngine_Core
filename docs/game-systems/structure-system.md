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
  housing   │ Provides living quarters for entities. Config defined in
            │ StructureDef_HousingConfig. Entities are assigned via Entity_Housing.

VALID EFFECT TYPES PER CATEGORY
─────────────────────────────────
  storage:  solid_capacity | liquid_capacity | rot_modifier | security_rating | damage_resistance | filth_reduction
  farming:  plot_count | growth_rate | season_override | env_override | soil_quality | damage_resistance | filth_reduction
  housing:  comfortable_capacity | max_capacity | damage_resistance | filth_reduction


─────────────────────────────────────────────
4. STRUCTURE DEFINITIONS (GUILD-DEFINED)
─────────────────────────────────────────────

StructureDef is the guild's specific named structure. It references one or more
seeded StructureTypes and defines everything about how that structure is built
and upgraded.

Types are assigned via the StructureDef_StructureType bridge table (see below).
Most defs have a single type. Multi-type defs (e.g. a hospital that is both
housing and medical) are supported — the def's valid upgrade effectTypes are
the union of all its assigned types' valid effectTypes, and all relevant
type-specific config tables must be populated.

  Field              │ Purpose
  ───────────────────┼────────────────────────────────────────────────────────
  guildId            │ Owning guild.
  name               │ Internal key e.g. "mossy_storage_den"
  displayName        │ User-facing label.
  description        │ Optional flavour text.
  constructionPoints │ Progress points required for the initial build. Each
                     │ structure_contribute action contributes ActionSystemType
                     │ .progressPoints toward this total.
  baseDurability     │ Int. Maximum durability for structures built from this def.
                     │ All structures start at this value when construction completes.
                     │ Effective max = baseDurability + SUM of any durability upgrade
                     │ effects applied (reserved for future use).

StructureDef_StructureType assigns one or more types to a def:

  structureDefId  │ FK → StructureDef
  structureTypeId │ FK → StructureType
  @@id([structureDefId, structureTypeId])

  Every def must have at least one type row. Most have exactly one.
  For multi-type defs, all relevant type-specific config tables (4a) must
  have a corresponding row for that def.

Base values for type-specific properties are defined on extension config rows
(see section 4a). These represent the structure's state before any upgrades apply.

StructureDef_CampRequirement defines structure types that must already exist (and be
active) in a camp before this def can be built there:

  structureDefId          │ FK → StructureDef (the def being gated)
  requiredStructureTypeId │ FK → StructureType (type that must exist in the camp)

  The app checks at Construction initiation that at least one active (non-broken,
  non-destroyed) structure of each required type exists in the camp. Broken structures
  do not satisfy requirements — a broken storage does not count as having storage.
  A def may have zero or more requirement rows.

StructureDef_Relation defines dependency and exclusion rules between StructureDefs
within the same guild. Relations are directional — the app checks all relation rows
where structureDefId = the def being built.

  structureDefId       │ FK → StructureDef (the def being constrained)
  relationType         │ REQUIRES | BLOCKS | UPGRADES
  targetStructureDefId │ FK → StructureDef (the def being referenced)

  Both structureDefId and targetStructureDefId must belong to the same guild.
  A def may have any number of relation rows.

  Relation semantics:

    REQUIRES — structureDefId cannot be built in a camp unless at least one active
               (non-broken, non-destroyed) instance of targetStructureDefId exists
               there. Checked at Construction initiation.

    BLOCKS   — structureDefId cannot be built in a camp if any active instance of
               targetStructureDefId exists there. One-directional: if A BLOCKS B,
               A is blocked by B's presence — B is not automatically blocked by A
               unless a separate B BLOCKS A row exists.

    UPGRADES — structureDefId is a direct tier upgrade of targetStructureDefId.
               Building it requires an active instance of targetStructureDefId in
               the camp (implicit REQUIRES). On Construction completion, the target
               structure is demolished — its Structure row is set to destroyed and
               its Structure_AppliedUpgrade rows are deleted. No resources are
               refunded. Only one tier is active at a time.

  Note: StructureDef_CampRequirement gates on a StructureType (any storage will do).
  StructureDef_Relation REQUIRES gates on a specific StructureDef (this exact def).
  Both checks are enforced at initiation — a def may have both.

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

  StructureDef_HousingConfig  (for structureTypeId = housing)
    structureDefId            FK → StructureDef
    comfortableCapacity       Int. Number of residents that can live here without penalty.
    maxCapacity               Int?. null = strict (hard cap at comfortableCapacity; assignment
                              is blocked when full). non-null = soft cap (residents may exceed
                              comfortableCapacity up to this limit, but each entity over the
                              comfortable threshold has their daily filth contribution multiplied
                              by (1.0 + overcrowdingFilthBonus).
    overcrowdingFilthBonus    Float. Multiplier bonus applied to each overcrowded entity's daily
                              filth contribution. Default 0.5 (= 1.5× total). Ignored when
                              maxCapacity is null (strict structures never overcrowd).

  Entity_Housing tracks which structure each entity is assigned to live in:
    entityId     FK → Entity (@id — one housing assignment per entity)
    structureId  FK → Structure (must be a housing-type structure; enforced at app layer)
    assignedAt   DateTime


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

  Field              │ Purpose
  ───────────────────┼──────────────────────────────────────────────────────
  id                 │
  campId             │ FK → Camp
  structureDefId     │ FK → StructureDef
  status             │ active | under_construction | broken | destroyed
  currentDurability  │ Int. Set to StructureDef.baseDurability when initial
                     │ construction completes. Decremented by damage events.
                     │ Reaching 0 transitions status to broken automatically.
  name               │ Optional custom label for this specific structure.

DURABILITY AND DAMAGE
──────────────────────
  Damage events (e.g. storms) reduce currentDurability by an amount set on the
  event effect. effective damage taken = baseDamage × (1.0 − MIN(0.9, SUM of all
  damage_resistance effectValues applied to this structure)). The 0.9 cap ensures
  structures can never be made fully immune — at least 10% of any event's damage
  always gets through.

  When currentDurability reaches 0, Structure.status is set to broken immediately.
  Broken structures are not demolished — they remain in the camp and count against
  Camp_StructureLimit until cleared or rebuilt.

BROKEN STATE BEHAVIOUR
────────────────────────
  Broken storage structures remain linked to their Storage instance but all
  protections are suspended: weightCapacity, fluidCapacity, expirationModifier,
  securityRating, and acceptedType restrictions are all ignored. Items are
  accessible but unprotected — no capacity enforcement, no rot reduction,
  no theft resistance, and no type filtering.

  Broken farming structures have all of their Plot rows cleared immediately on
  transition: any active crops are removed and the plots are locked (cannot be
  planted) until the structure is repaired or rebuilt. Plot rows are not deleted —
  they remain so the plot count is preserved for when the structure is restored.

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

  Field                  │ Purpose
  ───────────────────────┼────────────────────────────────────────────────
  id                     │
  structureId            │ FK → Structure
  constructionType       │ build | upgrade | repair | rebuild
  upgradeId              │ FK → StructureDef_Upgrade. Only set when
                         │ constructionType = upgrade; null otherwise.
  repairCostProportion   │ Float?. Only set when constructionType = repair.
                         │ Captures the damage fraction at initiation time:
                         │ (maxDurability − currentDurability) / maxDurability.
                         │ Stored so mid-repair damage events don't change what
                         │ was already charged.
  pointsRequired         │ Total progress points to complete. Set from
                         │ StructureDef.constructionPoints on initiation.
  pointsRemaining        │ Decrements by ActionSystemType.progressPoints per
                         │ contribution. 0 = complete.
  initiatedByEntityId    │ FK → Entity. Must be the faction leader.
  startedAt              │ DateTime
  completedAt            │ DateTime. Set on completion; null while in progress.

ITEM REQUIREMENTS
──────────────────
  Construction_ItemRequirement tracks the materials needed for an active construction
  and how many have been contributed so far.

    constructionId      FK → Construction
    itemId              FK → Item
    quantityRequired    Int — total amount needed
    quantityContributed Int — how much has been brought so far; starts at 0

  Rows are created at initiation time based on the construction type:
    - build:   one row per StructureDef_BuildCost entry, full quantity.
    - upgrade: one row per StructureDef_Upgrade_BuildCost entry for the upgrade.
    - repair:  one row per StructureDef_BuildCost entry, quantity = original × repairCostProportion
               rounded up.
    - rebuild: one row per item across StructureDef_BuildCost (full) + all
               StructureDef_Upgrade_BuildCost entries for every upgrade in
               Structure_AppliedUpgrade at initiation. Items of the same type
               are summed into a single row.

  Any faction member may contribute items. The bot tracks only that the items
  have been deposited — not who brought them.

  Construction cannot complete until both conditions are met:
    - All Construction_ItemRequirement rows have quantityContributed >= quantityRequired
    - pointsRemaining = 0

  On completion, all Construction_ItemRequirement rows for that construction are deleted.

On completion:
  - build    → Structure.status set to active; currentDurability set to baseDurability.
  - upgrade  → Structure_AppliedUpgrade row created; effects apply immediately.
               For plot_count upgrades: new Plot rows created for the structure.
  - repair   → Structure.currentDurability restored to baseDurability (full).
               Structure.status set to active. Upgrades are unchanged.
               Locked plots on farming structures are unlocked.
  - rebuild  → All existing Structure_AppliedUpgrade rows are deleted.
               New Structure_AppliedUpgrade rows are created for every upgrade that
               was recorded at initiation, effectively restoring the full prior state.
               Structure.currentDurability set to baseDurability.
               Structure.status set to active.
               Locked plots on farming structures are unlocked; plot count is
               restored to match the rebuilt upgrade set.

CANCELLING A CONSTRUCTION
──────────────────────────
  Any active Construction may be cancelled by the faction leader. On cancellation:
    1. All contributed items (quantityContributed per Construction_ItemRequirement row)
       are refunded to faction storage.
    2. The Construction row is deleted. Construction_ItemRequirement rows are
       removed via cascade.
    3. Structure state after cancellation depends on constructionType:
         - build   → Structure row is deleted entirely. It was never active, so
                     it no longer counts against Camp_StructureLimit.
         - upgrade → Structure remains active. The upgrade is simply not applied.
         - repair  → Structure remains broken.
         - rebuild → Structure remains broken.

CLEARING A BROKEN STRUCTURE
─────────────────────────────
  A broken structure may be cleared by the faction leader without initiating
  Construction. Clearing sets status to destroyed and removes it from the camp
  (it no longer counts against Camp_StructureLimit). No resources are returned.
  Structure_AppliedUpgrade rows are deleted on clear. A new structure of the
  same or different def may then be built up to the camp's limit.

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

  2. Housing base config — RESOLVED. See StructureDef_HousingConfig in section 4a.
     Strict vs. soft capacity controlled by maxCapacity nullability. Overcrowding
     applies a multiplier bonus (default 0.5) to each overcrowded entity's daily
     filth contribution. Valid upgrade effectTypes: comfortable_capacity, max_capacity,
     damage_resistance, filth_reduction.

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
  Camp                           — faction + location pairing; zero or more per faction; filthLevel removed (runtime aggregate)
  Camp_StructureLimit            — per-camp cap on how many structures of each type may be built
  StructureDef                   — guild-defined named structure; types assigned via StructureDef_StructureType
  StructureDef_StructureType     — assigns one or more StructureTypes to a def; most defs have exactly one
  StructureDef_CampRequirement   — structure types that must be active in a camp before this def can be built
  StructureDef_Relation          — REQUIRES / BLOCKS / UPGRADES rules between specific defs within a guild
  StructureDef_BuildCost         — items required for initial build
  StructureDef_StorageConfig     — base capacity and rot values for storage-type defs
  StructureDef_FarmingConfig     — base plot count and soil quality for farming-type defs
  StructureDef_HousingConfig     — comfortable/max capacity and overcrowding filth bonus for housing-type defs
  Entity_Housing                 — assigns an entity to a housing structure (one per entity)
  StructureDef_Upgrade           — guild-defined modular upgrade for a StructureDef
  StructureDef_Upgrade_Effect    — individual effects of an upgrade (one row per effect; upgrades may have many)
  StructureDef_Upgrade_BuildCost — items required to apply an upgrade
  StructureDef_Upgrade_Relation  — REQUIRES / BLOCKS / UPGRADES rules between upgrades on the same def
  Structure                      — a single installation within a camp; carries currentDurability and status
  Structure_AppliedUpgrade       — record of each upgrade application on a structure
  Structure_Storage              — join: links a storage-type Structure to a Storage; carries capacity/rot/type rules
  Structure_Storage_ItemType     — item types accepted by a structure storage
  Construction                   — active or completed build / upgrade / repair / rebuild project
  Construction_ItemRequirement   — items needed and contributed for an active construction; deleted on completion
