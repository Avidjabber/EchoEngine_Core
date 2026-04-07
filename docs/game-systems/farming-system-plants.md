FARMING SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-05


─────────────────────────────────────────────
1. INTENT
─────────────────────────────────────────────

The farming system allows entities to cultivate crops and plants at designated
locations. It builds on the existing environment and crafting systems rather
than introducing separate mechanics.

Design goals:
  - Guilds can establish herb gardens and crop fields at specific locations
  - Growth speed is driven by per-plant env condition effects (PlantDef_EnvConditionEffect)
  - Compost from the crafting system feeds into soil quality
  - Cultivated locations benefit from the Cultivated EnvCondition
  - Plants can improve in quality across generations via selective cross-breeding
  - Mutated variants are self-contained ephemeral PlantDef rows — no modifier stacking


─────────────────────────────────────────────
2. EXISTING HOOKS (ALREADY IN PLACE)
─────────────────────────────────────────────

The following are already seeded and ready:

  Cultivated EnvCondition
    Seeded as the inherent condition for Farmland and Suburban biomes.
    Can also be applied via Location_EnvCondition to any location with
    an active garden or herb plot. Growth rate and foraging effects are now
    per-plant via PlantDef_EnvConditionEffect — see section 3.

  Compost CraftingInteraction
    Breaks down rotten food, spoiled herbs, and plant scraps.
    Currently produces no output items — ingredients are consumed.
    Once the farming system is built, Compost will increase Plot.soilQuality.

  Farmland Biome
    color: 11061360 (#A8C870)
    inherentConditions: cultivated:1
    Used to tag locations that are designated growing areas.

  Plant ItemType
    Already seeded. All farmable plants carry this type.
    Drives storage filtering and system participation queries.

  Ingredient types: Flower, Root, Leaf, Seed, Stalk, Bark, Berry, Bud
    Already seeded on CraftingIngredientType.
    Harvested plant items will carry these types when seeded.

  herb_amount / herb_chance EnvModifierTypes
    REMOVED. Per-plant foraging sensitivity is now authored via
    PlantDef_EnvConditionEffect rows with effectType = "spawn_rate". See section 3.

  Ephemeral Item system
    Already used by the crafting system. Variant propagation items and
    variant harvest outputs reuse this pattern — ephemeral Items deleted
    when no StoredItems reference them. See item-definitions.md section 2.

  Entity RelationshipTypes: mother, father
    Already seeded. Farmed animals use these for lineage tracking.
    No new tables needed for animal generational tracking.


─────────────────────────────────────────────
3. SCHEMA
─────────────────────────────────────────────

Ten new tables are needed. Everything else reuses existing infrastructure.
Two existing tables gain new fields: Item gains plantDefId; PlantDef gains
isEphemeral and rootPlantDefId.

──────────────────────
PlantDef
──────────────────────

Definition of a growable plant. All PlantDefs are guild-scoped — there are no
globally seeded base plants. Guilds define their own base plants during setup.
Mutated variants are ephemeral PlantDef rows created by the cross-breeding
system — self-contained, complete definitions that carry their own drop tables
and modifier rows.


  guildId              String
  codeName             String    Snake_case machine identifier. Unique per guild.
                                 Ephemeral: base codeName + random suffix (e.g. yarrow_a3f9b2).
  name                 String    Display name.
  description          String?
  isEphemeral          Boolean   False for seeded base plants.
                                 True for cross-breeding-created variants.
  rootPlantDefId       Int?      FK → PlantDef. Always points to the original non-ephemeral
                                 base PlantDef this variant descended from. Never changes —
                                 a variant bred from a variant still points to the same root.
                                 Null for base plants (they ARE the root).
                                 Used for cross-breeding eligibility: two crops may be
                                 cross-bred if and only if their resolved roots match.
  growthCap            Int       Base growth points to advance one stage. 1 point = 1 day at base rate.
  growthStages         Int       Number of stages from seedling to harvestable.
  maxHarvests          Int       How many times this plant can be harvested before
                                 exhaustion. After this count, only uproot_crop is
                                 available — harvest_crop is blocked. Configurable
                                 per plant; approximately 3 for most plants.
  harvestDropTableId   Int       FK → DropTable. Output when harvesting. 
                                 Plant remains and regrows if only harvest, destroyed if uprooted.
  propagationItemId    Int?      FK → Item. The Item consumed when planting this plant.
                                 Base plants reference a seeded Item (e.g. yarrow_seed).
                                 Ephemeral variants reference their own ephemeral seed Item,
                                 which carries Item.plantDefId → this PlantDef.
  mutationChance       Float     Controls how many mutations occur during cross-breeding.
                                 The integer part = guaranteed mutations.
                                 The decimal part = chance of one additional mutation.

                                   0.7 → 70% chance of 1 mutation, 30% chance of none
                                   1.0 → always exactly 1 mutation
                                   1.4 → always 1 mutation + 40% chance of a second
                                   2.0 → always exactly 2 mutations

                                 Formula:
                                   guaranteed = floor(mutationChance)
                                   bonus      = mutationChance − floor(mutationChance)
                                   total      = guaranteed + (roll < bonus ? 1 : 0)

                                 If total mutations = 0, no new ephemeral PlantDef is
                                 created and the offspring inherits one parent's PlantDef
                                 unchanged. Each mutation randomly selects a numeric value
                                 to shift, with direction influenced by plot care quality.

RULE: HarvestDropTableId is always required.
RULE: codeName is unique per guild (DB-enforced).
RULE: isEphemeral = true rows are deleted when no PlotCrop.plantDefId and no
      Item.plantDefId references them. No lineage chain is maintained beyond
      rootPlantDefId — specific parentage is not tracked.

──────────────────────
Item.plantDefId (existing table — new field)
──────────────────────

  plantDefId   Int?   FK → PlantDef. Set on propagation items (seeds, spores,
                      cuttings, bulbs) to define which plant this item grows when
                      planted. Null for all non-propagation items.
                      Base seed items point to the base PlantDef.
                      Ephemeral variant seed items point to the ephemeral PlantDef.

The planting action reads Item.plantDefId to determine which PlantDef to
instantiate as a new PlotCrop. No other lookup is needed.

──────────────────────
PlantType
──────────────────────

Globally seeded lookup table of classification tags for PlantDefs (e.g. "Herb",
"Flower", "Mushroom", "Root Vegetable"). Static — never altered via the app.
Drives PlantType_EnvConditionEffect lookups: type-level responses apply to all
member plants unless overridden by a PlantDef_EnvConditionEffect row on the
specific plant.

  name   String   Unique display name / machine identifier.

──────────────────────
PlantDef_PlantType
──────────────────────

Classification tags on a PlantDef — many-to-many. Ephemeral PlantDefs inherit
the same type tags as their root PlantDef.

  plantDefId   Int   FK → PlantDef
  plantTypeId  Int   FK → PlantType

──────────────────────
PlantType_EnvConditionEffect
──────────────────────

Type-level env condition response. Applies to all PlantDefs carrying this
PlantType unless a PlantDef_EnvConditionEffect row on that specific plant
overrides it. Mirrors SpeciesType_EnvConditionEffect.

  plantTypeId    Int     FK → PlantType
  envConditionId Int     FK → EnvCondition
  effectTypeId   Int?    FK → EffectType. "cultivation" | "spawn_rate" | "spawn_weight" | "growth_rate" | "survival"
  relationTypeId Int     FK → RelationType. "requires" | "increase" | "decrease" | "block" | "kills"
  value          Float?  Delta magnitude, > 0.0. Null when "requires" or "block".

RULE: One row per (plantTypeId, envConditionId, relationTypeId, effectTypeId) — DB-enforced unique.
RULE: PlantDef_EnvConditionEffect takes precedence over PlantType_EnvConditionEffect for the same
      (envConditionId, effectTypeId) combination on a given plant.

──────────────────────
PlantDef_PlotType
──────────────────────

Restricts a plant to specific guild-defined plot types and defines a growth rate
modifier for each. Ephemeral PlantDefs carry their own rows.

  plantDefId          Int    FK → PlantDef
  plotTypeId          Int    FK → PlotType
  growthRateModifier  Float  Signed delta added to the growth total. 0.0 = neutral.
                             0.3 = +30%. -0.2 = -20% (worse plot for this plant).

RULE: No rows = plant can be placed in any plot type at 0.0 (neutral).
RULE: If rows exist, plant may only be placed in matching plot types.

──────────────────────
PlantDef_Biome
──────────────────────

Biome affinities for a plant. Controls both wild foraging find rates and
cultivated growth rate modifiers. Ephemeral PlantDefs carry their own rows
for growthRateModifier only — spawnRate is not inherited or mutated, as
ephemeral variants do not exist in the wild.

  plantDefId          Int    FK → PlantDef
  biomeId             Int    FK → Biome
  spawnRate           Float  Base weight of finding this plant per foraging attempt
                             in this biome. Scaled at runtime by PlantDef_EnvConditionEffect
                             spawn_rate rows for each active env condition at the location.
                             Only meaningful on base (non-ephemeral) PlantDefs.
  growthRateModifier  Float  Signed delta added to the cultivated growth total when this
                             plant is grown at a location in this biome. 0.0 = neutral.
                             Meaningful on both base and ephemeral PlantDefs.
                             Ephemeral PlantDefs inherit and may mutate this value;
                             spawnRate is not inherited (ephemerals don't appear in the wild).

RULE: No rows = grows in any biome at 0.0 (neutral) but is never found during wild foraging.
RULE: spawnRate is only read from the base (rootPlantDefId = null) PlantDef.
      Ephemeral variants do not appear in the wild.


──────────────────────
PlantDef_EnvConditionEffect
──────────────────────

Per-plant response to an active env condition. Covers all env-condition relationships
for a plant — cultivation requirements, foraging rates, growth rate, and survival.

  plantDefId       Int     FK → PlantDef
  envConditionId   Int     FK → EnvCondition
  effectTypeId     Int?    FK → EffectType. "cultivation" | "spawn_rate" | "spawn_weight" | "growth_rate" | "survival"
  relationTypeId   Int     FK → RelationType. "requires" | "increase" | "decrease" | "block" | "kills"
  value            Float?  Delta magnitude, > 0.0. Null when "requires" or "block".

  cultivation / requires
    Planting prerequisite. The condition must be present in the combined active
    set (location env + PlotType_EnvCondition rows + structure env_inject stacks) for planting to be allowed
    AND for growth to advance each tick. If the condition is lost after planting,
    growth pauses until it is restored. No value.
    effectType must always be "cultivation" for all "requires" rows.

  spawn_rate   — wild foraging find chance (scales PlantDef_Biome.spawnRate)
  spawn_weight — quantity found per forage attempt
  growth_rate  — cultivated growth tick rate (farming only)
  survival     — per-tick death probability. Used exclusively with "kills" relationshipType.
                 value = base probability (0.0–1.0) that the crop is destroyed on each
                 growth tick while this condition is active. Multiple kills rows (different
                 conditions) are checked independently — each rolls separately.
                 Structure env_override upgrades targeting this condition reduce the
                 effective probability: effectiveKillChance = value × (1.0 − conditionOverride).
                 e.g. Winter kills 0.05 — every winter tick has a 5% chance to kill the crop.
                 A greenhouse_cover upgrade with env_override +0.5 on Winter → 0.025 effective.

Seasonal behaviour is encoded as env condition rows referencing the seasonal conditions:
  - Year-round plants: no seasonal rows needed — 0.0 is the default.
  - Season-boosted plants: increase growth_rate for the relevant seasonal condition.
  - Season-penalised plants: decrease growth_rate for the relevant seasonal condition.
  - Dormant plants: block growth_rate for the off-season conditions.
  - Frost-killed plants: kills survival for the winter condition (with optional override).
  Seasons link to their own named env condition (spring/summer/autumn/winter via
  Season_EnvCondition). Plants reference those via PlantDef_EnvConditionEffect.

One plant can have multiple rows for the same env condition with different effectTypes.
e.g. Damp on Rice: requires(cultivation) + increase(growth_rate 0.3)

STACKING FORMULA (per effectType, across all active conditions and their stacks):
  netModifier = 1.0 + Σ(increase.value × stackCount) − Σ(decrease.value × stackCount)
  "block" on any effectType excludes the plant — takes precedence over all other modifiers.
  "kills" rows roll independently per active condition each tick.

RULE: Only one row per (plantDefId, envConditionId, effectType) — DB-enforced unique.
RULE: spawn_rate and spawn_weight rows are only read from the base (non-ephemeral)
      PlantDef. Ephemeral variants do not appear in the wild.
RULE: growth_rate netModifier is combined with biome, plot type, and soil quality
      in the growth formula. No separate season delta — seasonal effects are
      just env condition rows referencing the seasonal env condition.


──────────────────────
PlantTrait
──────────────────────

Seeded lookup table of heritable trait definitions. Static — never altered via the app.

  codeName      String   Machine identifier.
  name          String   Display name.
  description   String?

Seeded values:
  growth_rate          Signed delta added to the growth total. 0.0 = no inherent speed modifier.
  yield                Multiplier on harvest quantity rolls. 1.0 = default.
  potency              Feeds into StoredItem.craftBonus on herb/medicine outputs.
  nutrition            Feeds into StoredItem.craftBonus on food outputs.
  decay_resistance     Multiplier on rotCap of harvested output StoredItems.
  propagation_yield    Multiplier on propagation item drop rate and quantity only.

──────────────────────
PlantDef_Trait
──────────────────────

Trait values for a PlantDef. Ephemeral PlantDefs carry their own rows reflecting
their actual mutated values — used for display and as inputs to cross-breeding.

  plantDefId     Int    FK → PlantDef
  plantTraitId   Int    FK → PlantTrait
  value          Float  Actual value for this trait on this plant.
  minValue       Float  Floor — cross-breeding cannot go below this.
  maxValue       Float  Ceiling — cross-breeding cannot go above this.

Not every plant needs every trait. Trait values on ephemeral PlantDefs are already
baked into their drop tables and growth values — PlantDef_Trait rows exist for
display and cross-breeding input, not for runtime modifier application.

RULE: minValue and maxValue are always copied verbatim from the root PlantDef
      when an ephemeral PlantDef is created. They never drift — only value drifts.
      The root PlantDef's bounds are the permanent ceiling and floor for the
      entire lineage.

──────────────────────
PlotType
──────────────────────

Guild-defined plot environment type. Server admins create and name these freely —
there are no globally seeded values. Examples: "Open Farmland", "Hydroponics Bay",
"Mushroom Cave", "Tidal Bed", "Shaded Grove".

  guildId        String   Owning guild.
  name           String   Display name. Unique per guild.
  description    String?  Optional flavour text.
  soilQualityCap Float    Maximum soilQuality delta achievable via composting. Default 1.0
                          (+100% maximum contribution from soil). A hydroponics bay might
                          allow 1.5; rocky terrain might cap at 0.3.

──────────────────────
PlotType_EnvCondition
──────────────────────

Env conditions that are always active for plants growing in this plot type,
regardless of the actual location environment. These stack additively with
whatever env conditions the location itself has active.

  plotTypeId     Int   FK → PlotType
  envConditionId Int   FK → EnvCondition

Examples:
  "Hydroponics Bay"  → Cultivated, Watered     (always growing-season conditions)
  "Mushroom Cave"    → Damp, Dark               (fungi-friendly environment)
  "Open Farmland"    → (no rows — growth driven purely by location environment)
  "Toxic Vat"        → Toxic, Damp              (only toxic-tolerant plants thrive)

RULE: If a condition is active from both the location and the plot type, the stacks
      combine — a plant in a Hydroponics Bay at a Farmland biome has two stacks of
      Cultivated (one from the biome's inherent condition, one from the plot type).
      Guild admins should design plot types knowing this additive behaviour.

──────────────────────
Plot
──────────────────────

A single growing slot within a farming structure. One Plot = one PlotCrop at a time.
Plots are created when a farming structure is built (basePlotCount rows) and when
plot_count upgrades complete. PlotType and starting soilQuality are defined on the
owning StructureDef_FarmingConfig — see structure-system.md section 4a.

  structureId       Int      FK → Structure. The farming structure this plot belongs to.
  name              String?  Optional label (e.g. "Plot 1", "East Bed").
  soilQuality       Float    Signed delta added to the growth and harvest totals.
                             0.0 = neutral (no contribution). Positive = enriched soil.
                             Negative = degraded soil (slows growth but does not block it).
                             Initialized from StructureDef_FarmingConfig.defaultSoilQuality.

Location and PlotType are derived at runtime via Plot → Structure → Camp and
Plot → Structure → StructureDef → StructureDef_FarmingConfig respectively.

Soil quality interaction (app-maintained on daily tick):
  - Filth env condition active   → soilQuality degrades slowly (decrements delta)
  - Toxic env condition active   → soilQuality degrades faster
  - Compost applied (crafting)   → soilQuality increases, capped at PlotType.soilQualityCap

──────────────────────
Plot_Buff
──────────────────────

Active timed buffs — and debuffs — on a plot. Positive values come from skilled
farmer tending actions via Ability_ActionTrigger. Negative values are written by
the event system when blights, droughts, infestations, or other negative events
target a plot. Both use the same table — effectValue may be positive or negative.

  plotId          Int      FK → Plot
  sourceEntityId  Int      FK → Entity. Who applied the buff.
  effectType      String   growth_rate | yield | decay_resistance
  effectValue     Float    Additive delta applied while buff is active.
  appliedAt       DateTime
  expiresAt       DateTime appliedAt + ability-defined durationHours.

PK is (plotId, sourceEntityId, effectType) — one active buff per effect type per
entity per plot. This allows multiple entities to stack buffs of the same type
independently while preventing the same entity from applying the same buff twice.
stackBehavior on Ability_ActionTrigger (for ability-sourced buffs) and on the
event system (for event-sourced debuffs) governs whether duplicate rows are
refreshed, stacked, or ignored. A blight event may write a negative growth_rate
buff that partially or fully cancels an ability-sourced growth_rate buff from the
same or different source entity — they resolve independently by (plotId, sourceEntityId, effectType).

Active Plot_Buff rows with effectType = growth_rate contribute to the growth formula:
  structure_growth_modifier already covers structure-level upgrades.
  Plot-level buffs add to the formula as an additional divisor:
    plot_buff_growth_modifier = 1.0 + SUM(effectValue for active growth_rate buffs on this plot)

Ability connection — handled by Ability_ActionTrigger (see ability-system.md section 4h).
  triggerSystemType = "farming_water" | "farming_prune" | "farming_fertilize"
  targetScope       = "action_target"
  effectType        = "plot_buff"
  buffEffectType    = growth_rate | yield | decay_resistance
  triggerChance     = 0.0–1.0 (higher-tier skill tree nodes grant higher values)
  stackBehavior     = "refresh" (default for plot buffs)

──────────────────────
PlotCrop
──────────────────────

A live instance of a plant growing at a plot.

  plotId            Int       FK → Plot
  plantDefId        Int       FK → PlantDef. Points to base or ephemeral PlantDef.
  plantedAt         DateTime  Timestamp used to calculate growth progress.
  currentStage      Int       Current growth stage (0 = seedling, growthStages = harvestable).
  harvestCount      Int       Number of times this crop has been harvested. Default 0.
                              Incremented on each harvest_crop resolution. When
                              harvestCount >= PlantDef.maxHarvests, harvest_crop is
                              blocked — only uproot_crop is available.
                              Each harvest resets currentStage to 0 (full regrow).

HARVEST YIELD DECAY FORMULA
─────────────────────────────
  Each successive harvest yields proportionally less than the first.
  The yield multiplier at any harvest is:

    yieldMultiplier = (maxHarvests − harvestCount) / maxHarvests

  where harvestCount is the value BEFORE this harvest (i.e. 0 on the first harvest).

  Examples:
    maxHarvests = 3: first 100%, second 66%, third 33%
    maxHarvests = 4: first 100%, second 75%, third 50%, fourth 25%
    maxHarvests = 1: always 100% (single harvest before exhaustion)

  Applied to all quantity rolls from PlantDef.harvestDropTableId at resolution time.

  growthProgression Float     Accumulated growth points this stage. Increments each daily tick by
                              dailyGrowthRate (see formula). Resets to 0 when a stage advances.
  carePoints        Int       Accumulated tending care points since planting. Default 0.
                              Incremented by tending actions. Used at cross-breeding time
                              to compute carePercentage for mutation direction bias.

See section 5 for the full growth tick formula, pre-flight checks, and examples.

Replanting (normal seed):
  Normal seeds always produce exact copies. No mutation at harvest.
  - New PlotCrop.plantDefId = parent PlotCrop.plantDefId (exact copy)
  - No lineage tracking — the new crop is independent once planted.

Cross-breeding (one entity, two parent crops):
  Eligibility:
    resolveRoot(plantDefId) = PlantDef.rootPlantDefId ?? PlantDef.id
    Two crops are eligible if their resolved roots match. This means:
      - Two base yarrow plants → both resolve to yarrow → eligible
      - Base yarrow × yarrow variant → both resolve to yarrow → eligible
      - Two different yarrow variants → both resolve to yarrow → eligible
      - Yarrow × grape vine → different roots → ineligible
  Performed by a single entity. Gated behind ActionType_DisciplineRequirement
  (Farming discipline, scope = "leader").

  Roll against PlantDef.mutationChance (see PlantDef field definition for formula):
    Mutations → for each mutation that fires, one numeric value is randomly
              selected from the plant's full set of values (traits, biome
              modifiers, plot type modifiers, env condition effect values).
              That value is shifted by a small random amount.
              Direction (positive or negative) is driven by the average care percentage
              of the two parent crops at the time of cross-breeding:

              carePercentage (per crop) =
                PlotCrop.carePoints ÷ daysSincePlanting
                where daysSincePlanting = (now − PlotCrop.plantedAt) in whole days

              mutationCareScore = average(parent1.carePercentage, parent2.carePercentage)

              High score (near 1.0) → mutations trend positive.
              Low score (near 0.0)  → mutations trend negative.
              Exact bias formula to be determined at implementation time.
              Hard caps: PlantDef_Trait.minValue / maxValue (from root PlantDef)
              apply to trait values. Other values have no hard cap beyond
              reasonable limits enforced at implementation time.
              New PlantDef.rootPlantDefId = resolveRoot of either parent
              (both resolve to the same value by eligibility — no other
              lineage is recorded).
              A matching ephemeral seed Item (Item.plantDefId → new PlantDef)
              is also created.
    Failure → offspring inherits one parent's PlantDef unchanged. No new
              PlantDef row created.

  Exact inheritance formula (weighted average, pick-dominant, etc.)
  to be determined at implementation time.

──────────────────────
PlotCrop_TendRecord
──────────────────────

Tracks when each tending action type was last performed on a crop. Enforces
the per-systemType cooldown and prevents care point double-dipping.

  plotCropId       Int     FK → PlotCrop
  systemType       String  FK → ActionSystemType. e.g. "farming_water"
  lastPerformedAt  DateTime

PK is (plotCropId, systemType).

On tending action resolution:
  1. Check: lastPerformedAt + ActionSystemType.cooldownHours > now → blocked, show cooldown.
  2. If allowed: update lastPerformedAt, add ActionSystemType.progressPoints to PlotCrop.carePoints.
  3. If entity has a matching Ability_PlotBuff: upsert Plot_Buff on the target plot.


─────────────────────────────────────────────
4. HARVEST OUTPUT
─────────────────────────────────────────────

Two harvest modes, each using a different drop table on PlantDef:

  Harvest (without uprooting)
    Uses PlantDef.harvestDropTableId. PlotCrop remains and regrows.

  Uproot
    Uses PlantDef.harvestDropTableId. PlotCrop is deleted after resolution. 

──────────────────────
Base PlantDef output:
  Standard Item StoredItems produced. No ephemeral Items.

──────────────────────
Ephemeral PlantDef output:
  The drop tables on the ephemeral PlantDef already have the variant's values
  baked in — higher quantities, different items, etc. The drop table is the
  source of truth; no modifier application needed at harvest time.

  Outputs that differ in item properties (potency, nutrition, decay_resistance):
    Ephemeral Items produced, craftBonus or effective rotCap set from the
    variant's PlantDef_Trait values. Same pattern as crafted ephemeral items.

  Outputs that differ only in quantity (yield, propagation_yield):
    Standard Items produced in greater or lesser quantities. No ephemeral needed.

  Propagation item outputs:
    Reference the ephemeral PlantDef's own propagation Item (Item.plantDefId →
    this ephemeral PlantDef). Planting that seed creates a PlotCrop with
    plantDefId → this ephemeral PlantDef — an exact copy of the parent.

──────────────────────
Comparing variants:
  PlantDef.rootPlantDefId points to the founding base PlantDef.
  Compare the ephemeral PlantDef's PlantDef_Trait values against the root
  PlantDef's PlantDef_Trait values to see how far the variant has drifted.
  Specific breeding history is not tracked — only the root is known.


─────────────────────────────────────────────
5. GROWTH RATE CALCULATION
─────────────────────────────────────────────

All modifier rows are read from the crop's PlantDef directly — base or ephemeral.

Active env conditions for a plot = location's actual conditions
                                 + PlotType_EnvCondition rows for the plot's type
                                 + env_inject upgrade stacks from the farming structure.
All three sets are merged and treated as one combined set for tick checks and modifiers.

Pre-flight checks (if any fail, skip the tick entirely):
  1. All PlantDef_EnvConditionEffect cultivation/requires rows are present in the
     combined active set. Missing required condition = growth paused.
  2. PlantDef has PlantDef_PlotType rows but none match this Plot's plotTypeId.
     Incompatible plot type — planting is blocked at the app layer, so this is a
     safety guard only.
  3. Any active condition has a PlantDef_EnvConditionEffect block on growth_rate.

Before advancing growth, check kills:
  For each PlantDef_EnvConditionEffect survival/"kills" row whose condition is active:
  roll against effectiveKillChance = value × (1.0 − conditionOverride).
  If any roll succeeds, the crop is destroyed. Multiple kills rows roll independently.

Seasonal behaviour is encoded in env condition rows (block growth_rate for dormant
seasons; kills survival for frost-kill seasons).

  env_condition_growth_delta =
    SUM over all active env conditions that have a PlantDef_EnvConditionEffect
    growth_rate row for this plant:
      rawDelta(c) = Σ(increase.value × stackCount) − Σ(decrease.value × stackCount)
      effectiveDelta(c) = rawDelta(c) × (1.0 − conditionOverride(c))
      conditionOverride(c) = MIN(1.0, SUM of effectValues of env_override upgrades
                             applied to this structure targeting env condition c)
    Each condition is overridden independently.
    override 0 = full delta applies; override 1 = delta fully counteracted (0).

  totalGrowthMod =
      1.0
      + biome_delta                     (PlantDef_Biome; 0.0 if no row)
      + plotType_delta                  (PlantDef_PlotType; 0.0 if no row)
      + soilQuality                     (Plot.soilQuality delta)
      + env_condition_growth_delta      (net from all active conditions; 0.0 if none)
      + growth_rate_trait_delta         (PlantDef_Trait growth_rate; 0.0 if no row)
      + structure_growth_delta          (SUM of growth_rate upgrade effectValues; 0.0 if none)
      + plot_buff_growth_delta          (SUM of active Plot_Buff growth_rate effectValues; 0.0 if none)

  dailyGrowthRate = max(totalGrowthMod, floor)
  growthProgression += dailyGrowthRate each tick.
  Stage advances when growthProgression >= PlantDef.growthCap.

Example — good conditions (spring env active, native biome, composted, thriving variant):
  growthCap = 3
  env_delta (spring boost)=0.3, biome_delta=0.2, plotType_delta=0.1, soilQuality=0.2
  growth_rate_trait=0.1
  dailyGrowthRate = 1.0 + 0.3 + 0.2 + 0.1 + 0.2 + 0.1 = 1.9 points/day
  → stage advances after 3 / 1.9 ≈ 1.6 days

Example — unfavourable conditions (cold env active, wrong biome, neglected soil):
  growthCap = 3
  env_delta (cold penalty)=-0.2, biome_delta=0.0, plotType_delta=0.0, soilQuality=-0.1
  growth_rate_trait=0.0
  dailyGrowthRate = 1.0 − 0.2 − 0.1 = 0.7 points/day
  → stage advances after 3 / 0.7 ≈ 4.3 days

Example — bad plot type, no other penalties:
  growthCap = 3, plotType_delta=-0.3, everything else 0.0
  dailyGrowthRate = 0.7 points/day → stage advances after ≈ 4.3 days


─────────────────────────────────────────────
6. WILD FORAGING
─────────────────────────────────────────────

Wild foraging integrates with the existing foraging action type. When an entity
forages at a location, two parallel lookups run:

  1. Location item drop table  — resolves general items as normal (existing system).
  2. Plant foraging            — checks PlantDef_Biome for all biomes at the location:
       For each PlantDef with a spawnRate row matching a biome at this location:
         If any active condition has a block on spawn_rate for this plant → skip.
         effectiveChance = spawnRate × spawn_rate_netMod
           spawn_rate_netMod = 1.0 + Σ(increase.value × stacks) − Σ(decrease.value × stacks)
           across all active conditions with a PlantDef_EnvConditionEffect spawn_rate row.
         Roll against effectiveChance — on success, resolve PlantDef.harvestDropTableId.
         spawn_weight_netMod (same formula, spawn_weight rows) applied to quantity rolls.

Wild plants always use the base PlantDef and its harvestDropTableId. Outputs match
generation-0 cultivated yields — same drop table, same quantities before env modifiers.
Wild-foraged outputs are standard Items (never ephemeral — no variant lineage).

A location with multiple biomes can surface plants from any of those biomes.
A plant with findChance rows for multiple biomes present at the same location
only rolls once (deduplicated by plantDefId before rolling).


─────────────────────────────────────────────
7. FARMING ACTION TYPES

─────────────────────────────────────────────

Each farming activity is a distinct ActionType with its own systemTypeId.
All are guild-extensible. Seeded as global defaults.

  plant_crop           systemType = "farming_plant"
    Entity places a propagation item from storage into an open plot slot.
    Consumes the StoredItem. Creates a PlotCrop at stage 0.
    Reads Item.plantDefId to determine which PlantDef to instantiate.
    Solo or small group (1–N participants; implementation decides cap).
    Rewards: Farming XP.

  harvest_crop         systemType = "farming_harvest"
    Entity harvests a mature PlotCrop (currentStage = growthStages).
    Resolves PlantDef.harvestDropTableId with yield multiplier applied:
      yieldMultiplier = (maxHarvests − harvestCount) / maxHarvests
    PlotCrop remains; currentStage resets to 0; harvestCount increments by 1.
    Blocked when harvestCount >= PlantDef.maxHarvests — uproot_crop only.
    Solo or small group.
    Rewards: Farming XP.

  uproot_crop          systemType = "farming_uproot"
    Entity uproots a PlotCrop at any stage (does not require maturity).
    Resolves PlantDef.harvestDropTableId. PlotCrop is deleted.
    Solo or small group.
    Rewards: Farming XP.

  cross_breed          systemType = "farming_crossbreed"
    Entity cross-breeds two mature PlotCrops sharing the same resolved root.
    Solo only (maxEntities = 1). Can be gated behind ActionType_DisciplineRequirement
    Once a day per plant only.
    (Farming discipline, minLevel set by guild, scope = "leader").
    On success: new ephemeral PlantDef + ephemeral seed Item created.
    On failure: no new PlantDef; offspring is simply another instance of original plant def.
    Rewards: Farming XP (higher than standard harvest).

  tend_plot            systemType = "farming_tend"
    Entity applies Compost (crafting output) to a Plot, increasing soilQuality.
    Consumes the Compost StoredItem from storage. Adjusts Plot.soilQuality
    by a fixed amount (implementation decides increment and cap).
    Solo or small group.
    Rewards: Farming XP.

TENDING ACTIONS (care point + buff system)
───────────────────────────────────────────
Tending actions are available to all entities. Any entity earns Farming XP on
completion. Only entities with a matching Ability_PlotBuff write a Plot_Buff.
All tending actions update PlotCrop_TendRecord and increment PlotCrop.carePoints.

Cooldowns and care points are defined on ActionSystemType (cooldownHours,
progressPoints) — engine-level values, not guild-configurable.

  water_crop           systemType = "farming_water"
    Daily watering. cooldownHours = 24. progressPoints = 1.
    Ability buff effectType: growth_rate.
    Solo or small group.
    Rewards: Farming XP.

  prune_crop           systemType = "farming_prune"
    Weekly pruning. cooldownHours = 168. progressPoints = 7.
    Ability buff effectType: yield.
    Solo or small group.
    Rewards: Farming XP.

  fertilize_crop       systemType = "farming_fertilize"
    Weekly fertilizing. cooldownHours = 168. progressPoints = 7.
    Ability buff effectType: decay_resistance.
    Solo or small group.
    Rewards: Farming XP.

RULE: harvest_crop requires PlotCrop.currentStage = PlantDef.growthStages.
      uproot_crop has no stage requirement — can remove a crop at any stage. However, doing so before it is ready for harvest will result in no harvest. Binary, there is no 'almost grown' reward, it must be fully grown.
RULE: cross_breed requires both target PlotCrops to be mature
      (currentStage = growthStages) and share the same resolved root.
RULE: Tending actions are blocked if lastPerformedAt + cooldownHours > now
      (checked via PlotCrop_TendRecord).


─────────────────────────────────────────────
8. ANIMAL FARMING

─────────────────────────────────────────────

Farmed animals do not require new tables. They are Entities with a species,
owned by a guild, living at a location.

  Lineage         — Entity_Relationship (mother/father) already handles this.
  Generational stats — NOT in current scope. Deferred until a clear design exists.
  Animal pens     — Depend on the structure system (not yet implemented).

Current scope: farmed animals are just entities. Breeding records are
Entity_Relationship rows. No pen or plot linkage yet.
Will be handled in a separate farming-system-livestock document. 


─────────────────────────────────────────────
9. OUT OF SCOPE (DEFERRED)
─────────────────────────────────────────────
  - Plant disease / blight conditions (condition system can support this later)

─────────────────────────────────────────────
10. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Environment    — PlantDef_EnvConditionEffect growth_rate rows drive env-based
                   growth modifiers per plant. Toxic + Filth degrade Plot.soilQuality.

  Crafting       — Compost feeds into Plot.soilQuality.
                   Harvested outputs feed into herb/recipe ingredient slots.
                   Ephemeral variant outputs use the same pattern as crafted
                   ephemeral items — craftBonus carries through chains.

  Actions        — Harvest and uproot are ActionTypes granting Farming XP.
                   Cross-breeding is a solo ActionType gated behind
                   ActionType_DisciplineRequirement (Farming, scope = "leader").
                   See action-system.md.

  Disciplines    — Farming discipline gates cross-breeding and may gate other
                   advanced farming actions. See discipline-system.md.

  Items          — Propagation items carry Item.plantDefId → the PlantDef they grow.
                   Ephemeral variant seeds carry Item.plantDefId → ephemeral PlantDef.
                   Variant harvest outputs with property deviations are ephemeral Items
                   with craftBonus from PlantDef_Trait values.

  Drop Tables    — harvestDropTableId uses the Species drop table pattern. Ephemeral PlantDefs have their own drop tables with variant values already baked in. 
                  harvestDropTableId is also used for wild foraging — wild plants resolve the same table as a generation-0 cultivated harvest.

  Foraging       — Wild foraging runs PlantDef_Biome.findChance lookups alongside
                   the location's standard item drop table. PlantDef_EnvConditionEffect
                   spawn_rate rows scale find probability per active condition;
                   spawn_weight rows scale quantity rolls. Only base PlantDefs appear
                   in the wild. See section 6.

─────────────────────────────────────────────
11. OPEN QUESTIONS
─────────────────────────────────────────────
  [ ] Is there a visual growth stage description per stage (for display text),
      or just the integer currentStage?

  [ ] Cross-breeding inheritance formula — weighted average, dominant-parent,
      or pick-one-per-trait? To be determined at implementation time.

  [ ] What is the mutation variance range per cross-breeding event?
      To be determined at balancing time.
