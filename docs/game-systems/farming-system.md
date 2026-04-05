FARMING SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-04


─────────────────────────────────────────────
1. INTENT
─────────────────────────────────────────────

The farming system allows entities to cultivate crops and plants at designated
locations. It builds on the existing environment and crafting systems rather
than introducing separate mechanics.

Design goals:
  - Guilds can establish herb gardens and crop fields at specific locations
  - Growth speed is driven by the environment stacking system (plant_growth modifier)
  - Compost from the crafting system feeds into soil quality
  - Cultivated locations benefit from the Cultivated EnvCondition
  - Plants can improve in quality across generations via selective cross-breeding
  - Mutated variants are self-contained ephemeral PlantDef rows — no modifier stacking


─────────────────────────────────────────────
2. EXISTING HOOKS (ALREADY IN PLACE)
─────────────────────────────────────────────

The following are already seeded and ready:

  plant_growth EnvModifierType
    Multiplier on crop/plant growth rate. Stacks with other env conditions.
    Values are set on all relevant EnvConditions in seed-data.md.

  Cultivated EnvCondition
    plant_growth=2.0 — major growth boost for managed land.
    Seeded as the inherent condition for Farmland and Suburban biomes.
    Can also be applied via Location_EnvCondition to any location with
    an active garden or herb plot.

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
    Already in place. herb_amount scales harvest yield.
    herb_chance scales the probability of finding plants during foraging.

  Ephemeral Item system
    Already used by the crafting system. Variant propagation items and
    variant harvest outputs reuse this pattern — ephemeral Items deleted
    when no StoredItems reference them. See item-definitions.md section 2.

  Entity RelationshipTypes: mother, father
    Already seeded. Farmed animals use these for lineage tracking.
    No new tables needed for animal generational tracking.


─────────────────────────────────────────────
3. PROPOSED SCHEMA
─────────────────────────────────────────────

Ten new tables are needed. Everything else reuses existing infrastructure.
Two existing tables gain new fields: Item gains plantDefId; PlantDef gains
isEphemeral and rootPlantDefId.

──────────────────────
PlantDef
──────────────────────

Definition of a growable plant. Base plants are seeded globally. Mutated variants
are ephemeral PlantDef rows created by the cross-breeding system — self-contained,
complete definitions that carry their own drop tables and modifier rows.

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
  growthCycleDays      Int       Base days to advance one growth stage.
  growthStages         Int       Number of stages from seedling to harvestable.
  maxHarvests          Int       How many times this plant can be harvested before
                                 exhaustion. After this count, only uproot_crop is
                                 available — harvest_crop is blocked. Configurable
                                 per plant; approximately 3 for most plants.
  harvestDropTableId   Int       FK → DropTable. Output when harvesting without uprooting.
                                 Plant remains and regrows.
  uprootDropTableId    Int       FK → DropTable. Output when uprooting entirely.
                                 Destroys the PlotCrop. Typically higher or different yield.
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

RULE: Both harvestDropTableId and uprootDropTableId are always required.
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
PlantDef_PlotType
──────────────────────

Restricts a plant to specific guild-defined plot types and defines a growth rate
modifier for each. Ephemeral PlantDefs carry their own rows.

  plantDefId          Int    FK → PlantDef
  plotTypeId          Int    FK → PlotType
  growthRateModifier  Int    Percentage. 100 = no modifier. 150 = 50% faster.

RULE: No rows = plant can be placed in any plot type. Growth is determined entirely
      by env condition matching between the plant and the plot type + location.
RULE: If rows exist, plant may only be placed in matching plot types. The
      growthRateModifier applies as a divisor in the growth formula.

──────────────────────
PlantDef_Biome
──────────────────────

Biome affinities for a plant. Controls both wild foraging find rates and
cultivated growth rate modifiers. Ephemeral PlantDefs carry their own rows
for growthRateModifier only — findChance is not inherited or mutated, as
ephemeral variants do not exist in the wild.

  plantDefId          Int    FK → PlantDef
  biomeId             Int    FK → Biome
  growthRateModifier  Int    Percentage applied to growth rate when cultivated
                             in this biome. 100 = no modifier. 150 = 50% faster.
  findChance          Float  Base probability (0.0–1.0) of finding this plant
                             per foraging attempt in this biome. Multiplied by
                             the active herb_chance env modifier at the location.
                             Only meaningful on base (non-ephemeral) PlantDefs.

RULE: No rows = grows in any biome at 100 but is never found during wild foraging.
RULE: findChance is only read from the base (rootPlantDefId = null) PlantDef.
      Ephemeral variants do not appear in the wild.

──────────────────────
PlantDef_RequiredEnvCondition
──────────────────────

Env conditions required for a plant to be planted AND to continue growing each tick.
ALL listed conditions must be present in the combined active set (location env
conditions + PlotType_EnvCondition rows for the plot's type).

  plantDefId     Int    FK → PlantDef
  envConditionId Int    FK → EnvCondition

No rows = no restriction. Plant grows anywhere using only the other formula factors
(season, biome, plot type compatibility, soil quality, traits, upgrades, buffs).

If conditions are satisfied at planting but later lost (e.g. a drought removes Wet),
growth pauses until the required conditions are restored. The PlotCrop is not
destroyed — it simply does not advance.

Examples:
  Rice           requires: Wet, Cultivated
  Bog Orchid     requires: Waterlogged
  Toxic Mushroom requires: Toxic, Damp
  Cave Lichen    requires: Dark
  Yarrow         (no rows — grows in any conditions)

RULE: The check uses the same combined active set as the rest of the growth formula.
      A guild-defined "Rice Paddy" plot type with Wet + Cultivated satisfies Rice even
      if the location itself is dry.

──────────────────────
PlantDef_Season
──────────────────────

Per-season growth rates. Ephemeral PlantDefs carry their own rows.

  plantDefId         Int    FK → PlantDef
  seasonId           Int    FK → Season
  growthRateModifier Float  0.0–1.0 multiplier on growth rate for this season.
                            1.0 = full base speed. 0.5 = half speed. 0.0 = effectively dormant.
                            1.0 is the intended maximum.

RULE: No row for a season = dormant. Tick is skipped entirely — growth does not advance.
RULE: Year-round plants require an explicit row per season at 1.0.

──────────────────────
PlantTrait
──────────────────────

Seeded lookup table of heritable trait definitions. Static — never altered via the app.

  codeName      String   Machine identifier.
  name          String   Display name.
  description   String?

Seeded values:
  growth_rate          Multiplier on growthCycleDays. 1.0 = default.
  yield                Multiplier on harvest quantity rolls. 1.0 = default.
  potency              Feeds into StoredItem.craftBonus on herb/medicine outputs.
  nutrition            Feeds into StoredItem.craftBonus on food outputs.
  decay_resistance     Multiplier on decayDays of harvested output StoredItems.
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
  soilQualityCap Float    Maximum soilQuality achievable in this plot type via composting.
                          Default 2.0. Prevents indefinite improvement — a hydroponics bay
                          might allow 3.0; rocky terrain might cap at 1.5.

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
  soilQuality       Float    Multiplier on growth rate and harvest yield.
                             Initialized from StructureDef_FarmingConfig.defaultSoilQuality
                             when the plot is created. Guild-defined starting value.

Location and PlotType are derived at runtime via Plot → Structure → Camp and
Plot → Structure → StructureDef → StructureDef_FarmingConfig respectively.

Soil quality interaction (app-maintained on daily tick):
  - Filth env condition active   → soilQuality degrades slowly
  - Toxic env condition active   → soilQuality degrades faster
  - Compost applied (crafting)   → soilQuality increases by a fixed amount,
                                   capped at PlotType.soilQualityCap

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
  The uproot drop table (uprootDropTableId) is not subject to this decay — uprooting
  always yields the full defined output regardless of harvestCount.
  carePoints        Int       Accumulated tending care points since planting. Default 0.
                              Incremented by tending actions. Used at cross-breeding time
                              to compute carePercentage for mutation direction bias.

Growth rate formula (app-side):
  All modifier rows are read from PlotCrop.plantDefId — the resolved PlantDef,
  base or ephemeral. No stacking of overrides needed.

  Active env conditions for a plot = location's actual conditions + PlotType_EnvCondition
  rows for the plot's type. Both sets are checked together as one combined set.

  Check in order — if any check fails, skip the tick entirely:
    1. PlantDef_Season row for current season (no row = dormant, skip tick)
    2. All PlantDef_RequiredEnvCondition rows are present in the combined active set
       (any missing required condition = growth paused, skip tick)
    3. PlantDef_PlotType modifier for this Plot's plotTypeId = 0 (skip tick)

  Otherwise:
  effectiveDaysPerStage =
      PlantDef.growthCycleDays
      ÷ effective_plant_growth_mod         (per-condition plant_growth from location/biome env conditions; each targeted independently by env_override upgrades)
      ÷ biome_growthRateModifier / 100     (from PlantDef_Biome; 100 if no row)
      ÷ season_growthRateModifier          (from PlantDef_Season; no row = tick skipped)
      ÷ plotType_growthRateModifier / 100  (from PlantDef_PlotType; 100 if no row)
      ÷ Plot.soilQuality
      ÷ growth_rate trait value            (from PlantDef_Trait; 1.0 if no row)
      ÷ structure_growth_modifier          (1.0 + SUM of growth_rate upgrade effectValues
                                            applied to this structure; 1.0 if no upgrades)

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
              selected from the plant's full set of values (traits, season
              modifiers, biome modifiers, plot type
              modifiers). That value is shifted by a small random amount.
              Direction (positive or negative) is driven by the average care percentage
              of the two parent crops at the time of cross-breeding:

              carePercentage (per crop) =
                PlotCrop.carePoints
                ÷ SUM over all tending systemTypes of:
                    progressPoints × floor(totalGrowthDays / cooldownDays)
                where totalGrowthDays = PlantDef.growthCycleDays × PlantDef.growthStages
                      cooldownDays    = ActionSystemType.cooldownHours / 24

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
    Uses PlantDef.uprootDropTableId. PlotCrop is deleted after resolution.
    Typically more or different output than a normal harvest.

──────────────────────
Base PlantDef output:
  Standard Item StoredItems produced. No ephemeral Items.

──────────────────────
Ephemeral PlantDef output:
  The drop tables on the ephemeral PlantDef already have the variant's values
  baked in — higher quantities, different items, etc. The drop table is the
  source of truth; no modifier application needed at harvest time.

  Outputs that differ in item properties (potency, nutrition, decay_resistance):
    Ephemeral Items produced, craftBonus or effective decayDays set from the
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
Tick is skipped entirely if: season is dormant (no PlantDef_Season row), any required
env condition is missing from the combined active set, or PlantDef_PlotType modifier = 0.

  Two modifiers are adjusted by structure upgrades before use:

    effectiveSeasonMod =
      seasonMod + (1.0 − seasonMod) × structure_season_override
      where structure_season_override = MIN(1.0, SUM of season_override upgrade effectValues)
      No PlantDef_Season row = tick skipped before the formula is reached.

    effective_plant_growth_mod =
      PRODUCT over all active env conditions with a plant_growth modifier:
        effectiveCondMod(c) = condPlantGrowthMod(c)
                              + (1.0 − condPlantGrowthMod(c)) × conditionOverride(c)
        conditionOverride(c) = MIN(1.0, SUM of effectValues of env_override upgrades
                               applied to this structure targeting env condition c)
      Each condition is overridden independently. A Drought Shield only counteracts
      Drought — Cold, Toxic, etc. are unaffected unless their own upgrade exists.
      Cannot boost any condition's modifier above 1.0.

  effectiveDaysPerStage =
      PlantDef.growthCycleDays
      ÷ effective_plant_growth_mod      (per-condition plant_growth from location/biome, each adjusted by its targeted env_override)
      ÷ biome_growthRateModifier / 100  (PlantDef_Biome; 100 if no row)
      ÷ effectiveSeasonMod              (PlantDef_Season 0.0–1.0; adjusted by season_override)
      ÷ plotType_growthRateModifier / 100  (PlantDef_PlotType; 100 if no row)
      ÷ Plot.soilQuality
      ÷ growth_rate trait value         (PlantDef_Trait; 1.0 if no row)
      ÷ structure_growth_modifier       (1.0 + SUM of growth_rate upgrade effectValues; 1.0 if none)
      ÷ plot_buff_growth_modifier       (1.0 + SUM of active Plot_Buff effectValues
                                         where effectType = growth_rate; 1.0 if none)

Example — prime conditions (Spring, native biome, composted plot, fast variant):
  growthCycleDays = 3, plant_growth effectiveMod = 2.5
  biome = 150, season = 1.0, plotType = 120
  soilQuality = 1.2, growth_rate = 1.1
  → effectiveDaysPerStage = 3 / 2.5 / 1.5 / 1.0 / 1.2 / 1.2 / 1.1 ≈ 0.45 days

Example — slow season, non-native, base plant:
  growthCycleDays = 3, plant_growth effectiveMod = 1.3
  biome = 100, season = 0.5, plotType = 100
  soilQuality = 1.0, growth_rate = 1.0
  → effectiveDaysPerStage = 3 / 1.3 / 1.0 / 0.5 / 1.0 / 1.0 / 1.0 ≈ 4.6 days


─────────────────────────────────────────────
6. WILD FORAGING
─────────────────────────────────────────────

Wild foraging integrates with the existing foraging action type. When an entity
forages at a location, two parallel lookups run:

  1. Location item drop table  — resolves general items as normal (existing system).
  2. Plant foraging            — checks PlantDef_Biome for all biomes at the location:
       For each PlantDef with a findChance row matching a biome at this location:
         effectiveChance = findChance × herb_chance_effectiveMod
         Roll against effectiveChance — on success, resolve PlantDef.harvestDropTableId.
         herb_amount_effectiveMod is applied to quantity rolls from the drop table.

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
    Resolves PlantDef.uprootDropTableId. PlotCrop is deleted.
    Solo or small group.
    Rewards: Farming XP (less than harvest, or none — implementation decision).

  cross_breed          systemType = "farming_crossbreed"
    Entity cross-breeds two mature PlotCrops sharing the same resolved root.
    Solo only (maxEntities = 1). Gated behind ActionType_DisciplineRequirement
    (Farming discipline, minLevel set by guild, scope = "leader").
    On success: new ephemeral PlantDef + ephemeral seed Item created.
    On failure: no new PlantDef; offspring inherits one parent's PlantDef.
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
      uproot_crop has no stage requirement — can remove a crop at any stage.
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


─────────────────────────────────────────────
9. OUT OF SCOPE (DEFERRED)
─────────────────────────────────────────────

  - Animal pens / Plot linkage for animals (requires structure system)
  - Generational stat drift for farmed animals (requires inheritance rules design)
  - Multi-parent plant cross-breeding (two-parent is in scope; more than two deferred)
  - Plant disease / blight conditions (condition system can support this later)
  - Guild-defined custom PlantDef (schema supports it via guildId; seed first)
  - Structure dependency for plots (Garden Bed, Herb Rack — structure system TBD)


─────────────────────────────────────────────
10. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Environment    — plant_growth modifier from env conditions is the primary
                   growth rate driver. Toxic + Filth degrade Plot.soilQuality.

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

  Drop Tables    — harvestDropTableId and uprootDropTableId use the Species drop
                   table pattern. Ephemeral PlantDefs have their own drop tables
                   with variant values already baked in. harvestDropTableId is also
                   used for wild foraging — wild plants resolve the same table as
                   a generation-0 cultivated harvest.

  Foraging       — Wild foraging runs PlantDef_Biome.findChance lookups alongside
                   the location's standard item drop table. herb_chance scales find
                   probability; herb_amount scales quantity rolls. Only base
                   PlantDefs appear in the wild. See section 6.

  Entity System  — Farmed animals are Entities. Lineage via Entity_Relationship.


─────────────────────────────────────────────
11. OPEN QUESTIONS
─────────────────────────────────────────────

  [x] Should plotting require a specific structure (Garden Bed)?
      Resolved — plots now belong to farming structures via Plot.structureId.
      PlotType is defined on StructureDef_FarmingConfig, not on the individual plot.

  [x] After a harvest (without uprooting), does the PlotCrop reset to stage 0
      or to a mid-point stage?
      Resolved — resets to stage 0. harvestCount increments; yield decreases
      each cycle. After PlantDef.maxHarvests harvests, only uproot_crop is available.

  [x] growth_rate PlantDef_Trait design.
      Resolved — works as a standard multiplier on growthCycleDays (1.0 = default).
      Plant-level inherent speed, mutatable via cross-breeding. Separate from
      Plot_Buff growth_rate which is an external boost from skilled farmer tending.

  [x] Does soilQuality have a hard floor?
      Resolved — no floor. soilQuality can reach 0, rendering the plot completely
      inert (no growth). Sustained neglect and toxic/filth conditions can fully
      degrade a plot. Tends and compost are the recovery path.

  [ ] Is there a visual growth stage description per stage (for display text),
      or just the integer currentStage?

  [ ] Cross-breeding inheritance formula — weighted average, dominant-parent,
      or pick-one-per-trait? To be determined at implementation time.

  [ ] What is the mutation variance range per cross-breeding event?
      To be determined at balancing time.
