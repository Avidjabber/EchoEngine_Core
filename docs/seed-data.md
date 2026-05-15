GLOBAL SEED DATA — REFERENCE
==============================
Last updated: 2026-05-01

This file defines all global seed values for EchoPaw. Work through each
table one at a time. Mark a table as DONE when its values are finalised.

Tables are grouped by category. "Static" tables are fixed engine reference data
and never change at runtime. "Guild-scoped" tables are owned by guilds — base
rows are seeded per guild at initialization; guilds and modules add their own.


═══════════════════════════════════════════════════════════════════════
STATIC LOOKUP TABLES
(no guildId — fixed values, never altered via the app)
═══════════════════════════════════════════════════════════════════════

──────────────────────────────────────────────
Season                                  [ DONE ]
──────────────────────────────────────────────
Each season carries a direct envConditionId FK (1:1). Contributes 1 stack of that condition always.

  name    envConditionId (codeName)
  Spring  spring
  Summer  summer
  Autumn  autumn
  Winter  winter


──────────────────────────────────────────────
Status                            [ DONE ]
──────────────────────────────────────────────
Values:                isEntity     isStructure
  Active               true         true
  Inactive             true         true
  Hiatus               true         false
  Broken               false        true
  Destroyed            false        true
  Under_Construction   false        true



──────────────────────────────────────────────
EntityType                              [ DONE ]
──────────────────────────────────────────────
  name             canModifyStats  canParticipateCombat  canParticipateEvents  adminOnly
  NPC              false           true                  false                 true
  Side Character   false           true                  true                  false
  Main Character   true            true                  true                  false
  Ephemeral        false           true                  true                  true


──────────────────────────────────────────────
SpeciesType                             [ DONE ]
──────────────────────────────────────────────
Role types (connect to gameplay systems):
  Playable
  Prey
  Predator
  Pet
  Livestock
  Vermin

Biological types (taxonomy; a species can carry both a role and a biological type):
  Mammal
  Bird
  Reptile
  Amphibian
  Fish
  Insect
  Arachnid
  Crustacean

Habitat types (environment; orthogonal to biology — e.g. a whale is Mammal + Aquatic):
  Aquatic
  Aerial
  Subterranean


──────────────────────────────────────────────
PlantType                               [ DONE ]
──────────────────────────────────────────────
Classification tags for plant defs — many-to-many via PlantDef_PlantType.
A plant def can carry multiple tags from different groups (e.g. a pine = Tree + Coniferous + Forest).
Type-level env condition responses set via PlantType_EnvConditionEffect apply to all member
plants, overridden per-plant by PlantDef_EnvConditionEffect.

Growth Form (physical structure):
  Herb       Soft-stemmed, low-growing; annual or perennial.
  Shrub      Woody, multi-stemmed; knee- to chest-height.
  Bush       Dense, rounded branching; commonly fruiting or flowering.
  Tree       Single woody trunk; tall-growing.
  Vine       Climbing or trailing stems; requires support or ground-spreads.
  Grass      Narrow-leaved; includes sedges and reeds.
  Fern       Frond-bearing; reproduces by spores, not seeds.
  Moss       Low mat-forming, non-vascular; grows on surfaces.
  Fungus     Mushrooms and toadstools; game-treated as a plant category.
  Succulent  Water-storing; thick fleshy leaves or stems.

Botanical Group (natural classification; orthogonal to growth form):
  Coniferous  Cone-bearing; needle or scale leaves; typically evergreen.
  Deciduous   Sheds leaves seasonally.
  Evergreen   Retains foliage year-round (broadleaf evergreens not tagged Coniferous).
  Flowering   Produces visible flowers; angiosperms.

Habitat (primary growing environment; orthogonal to both above):
  Aquatic   Grows in or on water.
  Wetland   Boggy, swampy, or riparian margins.
  Alpine    High-altitude; cold-adapted.
  Arid      Desert or scrubland; drought-adapted.
  Forest    Shaded woodland understory or canopy.
  Meadow    Open, sun-exposed grassland or plains.
  Coastal   Salt-tolerant; seaside or tidal margins.
  Cave      Low-light or underground; includes cave fungi.

Lifecycle / Cultivation (orthogonal to all above):
  Annual      Completes its lifecycle in one growing season; must be replanted each year.
  Perennial   Regrows from established roots each season; persists across years.
  Cultivated  Grown intentionally in plots; tag drives farming-context filtering and interactions.


──────────────────────────────────────────────
Sex                                     [ DONE ]
──────────────────────────────────────────────
Values:
  Male
  Female
  Intersex

──────────────────────────────────────────────
Gender                                  [ DONE ]
──────────────────────────────────────────────
Values:
  Male
  Female
  Non-binary
  Other


──────────────────────────────────────────────
Stat                                    [ DONE ]
──────────────────────────────────────────────
Values:
  Strength
  Dexterity
  Constitution
  Intelligence
  Wisdom
  Charisma


──────────────────────────────────────────────
Location ownership (no separate table)
──────────────────────────────────────────────
There is no LocationStatus model. Ownership is expressed via Location_Faction.relationTypeId,
using RelationType rows with isOwnershipSystem = true:

  RelationType  Meaning
  ──────────    ─────────────────────────────────────────────────────────
  owns          Faction owns this territory
  contesting    Faction is contesting this territory

  Shared   = multiple Location_Faction rows with relationType = owns
  Unclaimed = no Location_Faction rows for this location


──────────────────────────────────────────────
ItemType                                [ DONE ]
──────────────────────────────────────────────
Values:
  Weapon
  Armor
  Shield
  Trait
  Ability
  Spell
  Tool
  Plant
  Medicine
  Food
  Ore
  Ingot
  Gem
  Leather
  Battery


──────────────────────────────────────────────
ItemInteraction                         [ DONE ]
──────────────────────────────────────────────
  name     description
  eat      Consumed orally as solid food or a bolus.
  drink    Consumed orally as a liquid, broth, or tea.
  apply    Applied directly to skin, fur, or a wound as a poultice or salve.
  inhale   Breathed in as vapour, steam, or airborne particles.
  burn     Set alight to produce smoke or char for direct use.


──────────────────────────────────────────────
ItemActionType                          [ DONE ]
──────────────────────────────────────────────
  name    dealsDamage  restoresHealth  appliesCondition  isHarmful
  attack  true         false           false             true
  heal    false        true            false             false
  buff    false        false           true              false
  debuff  false        false           true              true
  summon  false        false           false             false


──────────────────────────────────────────────
RelationType
──────────────────────────────────────────────
Developer-seeded only. Boolean flags control which systems each value is valid for.

  name        isConditionSystem  isStructureSystem  isSkillSystem  isItemSystem  isCraftingSystem   isEnvConditionSystem  isOwnershipSystem
  ──────────  ─────────────────  ─────────────────  ─────────────  ────────────  ────────────────   ────────────────────  ─────────────────
  requires    false              true               true           false         true               true                  false
  block       true               true               true           false         false              true                  false
  upgrades    false              true               true           false         false              false                 false
  treat       false              false              false          true          false              false                 false
  worsen      true               false              false          true          false              false                 false
  cure        false              false              false          true          false              false                 false
  transform   false              false              false          true          false              false                 false
  recover     true               false              false          false         false              false                 false
  spawn       true               false              false          false         false              false                 false
  spreads_as  true               false              false          false         false              false                 false
  improves    false              false              true           false         true               false                 false
  increase    false              false              true           false         true               true                  false
  decrease    false              false              true           false         true               true                  false
  kills       false              false              true           false         true               true                  false
  owns        false              false              false          false         false              false                 true
  contesting  false              false              false          false         false              false                 true


──────────────────────────────────────────────
EffectType                              [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Boolean flags control which systems each value is valid for.
Also used for Plot_Buff.effectTypeId — valid plot buff types are those with isPlant = true.
isEnvModifier = true marks types valid for EnvCondition_Modifier (per-guild world effects; guilds define their own values, no global defaults).
isLocation = true marks types valid for Location_Effect writes (location-wide temporary buffs/debuffs, e.g. spawn weights, hunting difficulty); used as locationBuffEffectTypeId on EventEffect.
isEvent = true marks types valid for EventEffect.effectTypeId — see EventEffectType section for the full list.

  name              isItem  isPlant  isSpecies  isAbility  isEnvModifier  isLocation  isEvent
  ──────────        ──────  ───────  ─────────  ─────────  ─────────────  ──────────  ───────
  spawn_rate        true    true     true       false      false          true        false
  spawn_weight      true    true     true       false      false          true        false
  growth_rate       false   true     true       true       false          true        false
  harvest_yeild     false   true     false      true       false          true        false
  rot_rate          true    true     false      true       false          true        false
  damage_resistance false   false    false      true       false          false       false
  cultivation       false   true     false      false      false          false       false
  survival          false   true     false      false      false          false       false
  filth             false   false    false      false      true           false       false
  spoilage          false   false    false      false      true           false       false


──────────────────────────────────────────────
AbilityEffectType                       [ DONE ]
──────────────────────────────────────────────
  name
  ──────────────
  condition_grant   applies a ConditionDef to target entity
  multiplier        applies a rate/yield multiplier to target entity
  structure_buff    modifies a structure property (e.g. rot modifier, capacity)
  plot_buff         writes a Plot_Buff on a target plot (uses EffectType + effectValue + durationHours)
  energy_restore    restores energy to the ability holder
  xp_grant          grants discipline XP to the ability holder

──────────────────────────────────────────────
TargetType                              [ DONE ]
──────────────────────────────────────────────
isAbility = true — valid for Ability_MultiplierEffect / Ability_PresenceEffect.

  name                 isAbility
  ──────────           ─────────
  discipline_xp        true
  drop_plant           true
  drop_species         true
  drop_forage          true
  drop_item            true
  crafting_yield       true
  crafting_quantity    true
  recovery_rate        true
  energy_cost          true
  treatment_given      true
  treatment_recieved   true
  constuction_speed    true
  faction_rep          true
  scouting_range       true
  healing_recieved     true
  healing_given        true

──────────────────────────────────────────────
AbilityThresholdType                    [ DONE ]
──────────────────────────────────────────────
  name
  ──────────
  hp
  nutrition
  hydration

──────────────────────────────────────────────
TargetScope                             [ DONE ]
──────────────────────────────────────────────
  isAbilityTarget           — valid for Ability_ActionTrigger.targetScopeId
  isPresenceScope           — valid for Ability_PresenceEffect.presenceScopeId
  isPowerScope              — valid for StructureDef_FuelConfig.scopeId
  isEfficiencyConsumerScope — valid for StructureDef_Upgrade_Effect.efficiencyConsumerScopeId

  name                       isAbilityTarget  isPresenceScope  isPowerScope  isEfficiencyConsumerScope
  ──────────                 ───────────────  ───────────────  ────────────  ─────────────────────────
  self                       true             false            false         false
  action_target              true             false            false         false
  action_participant         true             false            false         false
  area                       true             false            false         false
  housing_structure          false            true             false         false   // structure entity is housed at
  housing_plot               false            true             false         false   // plots at entity's housing structure
  colocated_entities         false            true             false         false   // other entities housed at same structure
  camp_entities              false            true             false         false   // all entities in same camp
  camp_structures            false            true             false         false   // all structures in same camp
  work_structure             false            true             false         false   // structure entity is work-assigned to
  work_plots                 false            true             false         false   // plots at entity's work structure
  work_colocated_entities    false            true             false         false   // other entities work-assigned to same structure
  structure                  false            false            true          false
  camp                       false            false            true          false
  location                   false            false            true          false
  faction                    false            false            true          false
  all                        false            false            false         true
  structures_only            false            false            false         true
  upgrades_only              false            false            false         true


──────────────────────────────────────────────
TargetTrigger                           [ DONE ]
──────────────────────────────────────────────
  name
  ──────────
  completion
  success
  failure

──────────────────────────────────────────────
StackBehavior                           [ DONE ]
──────────────────────────────────────────────
  name
  ──────────
  refresh
  stack
  ignore

──────────────────────────────────────────────
FuelType                                [ DONE ]
──────────────────────────────────────────────
Static seed values. Declares the category of energy a power source produces or accepts.

Two kinds of fuel items:
  Consumable (no Battery ItemType tag) — destroyed on deposit; fuelValue added to source's fuel pool.
  Battery    (Battery ItemType tag)    — never destroyed; charge transferred via the battery UI
                                         (structure must have allowsBatteryUse = true). fuelValue is
                                         the battery's max charge capacity; StoredItem.currentFuelLevel
                                         tracks remaining charge. Transfer direction is selectable:
                                         discharge (battery → structure) or charge (structure → battery).
                                         Amount is capped by whichever side has less headroom.

Consumers (StructureDef.isPowered / StructureDef_Upgrade.isPowered) declare which output
FuelTypes satisfy them via StructureDef_AcceptedFuelType and
StructureDef_Upgrade_AcceptedFuelType. A source satisfies a consumer when at least one of
the source's output types is in the consumer's accepted set. Empty accepted set = any
output type satisfies it.

Examples: a bonfire consumer has AcceptedFuelType = Burnable — only a Burnable-output
source powers it. An air conditioner has AcceptedFuelType = Electric — only an
Electric-output source powers it.

Values:
  Burnable
  Electric
  Steam
  Alchemical
  Renewable


──────────────────────────────────────────────
StructureType                           [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Guilds reference these when defining their own StructureDefs.
Each type has a corresponding config table (except storage, which uses Structure_Storage directly).

  name      config table                    notes
  ────────  ──────────────────────────────  ────────────────────���─────────────────────────────────
  storage   Structure_Storage               capacity, rot modifier, item type restrictions
  farming   StructureDef_FarmingConfig      plot count, plot type, soil quality
  housing   StructureDef_HousingConfig      comfortable/max capacity, overcrowding filth bonus
  medical   StructureDef_MedicalConfig      treatment/exam roll bonus, recovery modifier, contagion resist
  compost   StructureDef_CompostConfig      conversion days, weight/volume capacity; MUST pair with storage
  crafting  StructureDef_CraftingConfig     crafting roll bonus, output quantity bonus, supported interactions
  power     StructureDef_FuelConfig         isPassive (passive generator flag), scopeId (FK → TargetScope), capacity, burn rate;
            —                               isPassive=false: active generator — accepts item deposits matching fuelTypeId
            —                               isPassive=true:  passive generator — generates from env conditions via StructureDef_FuelConfig_EnvCondition
            —                               allowsBatteryUse=true: entity may discharge or charge Battery-type items via this structure
            —                               scope structure: satisfies only the structure this source is built into (multi-type def)
            —                               scope camp:      satisfies all isPowered in the same camp
            —                               scope location:  satisfies all isPowered across all camps in the location
            —                               scope faction:   satisfies all isPowered across the entire faction
  work_slot   StructureDef_WorkSlotConfig     worker assignment slots; can pair with any other type;
              —                               totalSlots + requiredSlots: slot count and minimum threshold for workEfficiency > 0
              —                               energyCostPerHour + disciplineDefId + xpGrantPerHour: passive per-worker tick effects
              —                               StructureDef_WorkSlotConfig_Requirement: discipline level hard gates on assignment
              —                               Entity_WorkAssignment: one active assignment per entity (like housing)
              —                               workEfficiency = filledSlots < requiredSlots ? 0.0 : filledSlots / totalSlots
  production  StructureDef_ProductionConfig   cycle-based item generation; MUST pair with storage;
              —                               inputs:  zero or more StructureDef_ProductionInput rows (items consumed per cycle)
              —                               outputs: one or more StructureDef_ProductionOutput rows (items produced per cycle, with dropChance)
              —                               baseCyclesPerHour: passive rate with no staff/power; 0 = purely staff/power-driven
              —                               staffCyclesPerHour: extra cycles/hr per stationed entity with energy > 0
              —                               poweredCyclesBonus: extra cycles/hr when a satisfied power source is active (soft boost)
              —                               filthPerCycle: filth added to Structure.filthLevel per completed cycle (0 = no cycle-driven filth)
              —                               StructureDef_ProductionConfig_EnvCondition: per-condition cycle rate modifiers (may be negative)
              —                               slot count, energy, XP, discipline gates → StructureDef_WorkSlotConfig / _Requirement (not on production config)
              —                               worker efficiency → workEfficiency from WorkSlotConfig scales staffCyclesPerHour contribution


──────────────────────────────────────────────
ConstructionType                        [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Identifies the kind of work a Construction record
represents. Referenced via constructionTypeId FK on the Construction model.
Guilds cannot add or modify these values.

  name     Purpose
  ───────  ──────────────────────────────────────────────────────────────────
  build    Initial construction of a new structure from a StructureDef.
           On completion: Structure.status → active; currentDurability set to
           StructureDef.baseDurability.

  upgrade  Applying a specific StructureDef_Upgrade to an existing structure.
           Construction.upgradeId is required (non-null). On completion:
           Structure_AppliedUpgrade row created; upgrade effects apply immediately.
           For plot_count upgrades, new Plot rows are also created.

  repair   Restoring a broken structure's durability. Item cost is proportional
           to the damage fraction at initiation time (repairCostProportion).
           On completion: Structure.currentDurability restored to baseDurability;
           Structure.status → active.

  rebuild  Demolishing and reconstructing a destroyed structure in one pass,
           restoring all upgrades that were recorded at initiation. Item cost
           covers the full build cost plus all prior upgrade costs. On completion:
           all prior Structure_AppliedUpgrade rows replaced; Structure.status →
           active; currentDurability restored to baseDurability.


──────────────────────────────────────────────
UpgradeEffectType                       [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Each row names an upgrade effect and declares which
StructureType categories accept it. The worker switches on name to apply logic.

Column meanings:
  validFor          — which structure type categories accept this effect; "all" = every type.
                      The app validates this at upgrade definition time.
  requiresEnvTarget — when true, the upgrade effect row must specify a targetEnvConditionId
                      (which env condition to target). Required for env_override (condition to
                      suppress) and env_inject (condition to add). Null targetEnvConditionId
                      is a misconfiguration when this is true — flagged at app layer.
  isPower           — whether this effect is valid for power-type structures. Stored as a
                      separate boolean (isPower) in the schema alongside isStorage, isFarming,
                      etc. because each structure type has its own flag column. For "all"
                      effects this is true; for type-specific effects it matches the type.

  name                   validFor                                    requiresEnvTarget  isPower  isProduction  isWorkSlot
  ─────────────────────  ──────────────────────────────────────────  ─────────────────  ───────  ────────────  ──────────
  solid_capacity         storage                                     false              false    false         false
  liquid_capacity        storage                                     false              false    false         false
  rot_modifier           storage                                     false              false    false         false
  security_rating        storage                                     false              false    false         false
  plot_count             farming                                     false              false    false         false
  growth_rate            farming                                     false              false    false         false
  env_override           all                                         true               true     true          true
  env_inject             all                                         true               true     true          true
  soil_quality           farming                                     false              false    false         false
  comfortable_capacity   housing                                     false              false    false         false
  max_capacity           housing                                     false              false    false         false
  treatment_bonus        medical                                     false              false    false         false
  exam_bonus             medical                                     false              false    false         false
  recovery_modifier      medical                                     false              false    false         false
  contagion_resist       medical                                     false              false    false         false
  crafting_roll_bonus    crafting                                    false              false    false         false
  output_quantity_bonus  crafting                                    false              false    false         false
  conversion_speed       compost                                     false              false    false         false
  fuel_capacity          power                                       false              true     false         false
  fuel_efficiency        power                                       false              true     false         false
  passive_gen_rate       power                                       false              true     false         false
  weight_capacity        compost                                     false              false    false         false
  volume_capacity        compost                                     false              false    false         false
  damage_resistance      all                                         false              true     true          true
  filth_reduction        all                                         false              true     true          true
  production_rate        production                                  false              false    true          false
  staff_rate             production                                  false              false    true          false
  powered_rate           production                                  false              false    true          false
  station_xp_bonus       any def with WorkSlotConfig                 false              false    false         true
  energy_drain_reduction any def with WorkSlotConfig                 false              false    false         true
  work_slots             any def with WorkSlotConfig                 false              false    false         true


──────────────────────────────────────────────
MeasurementType                         [ DONE ]
──────────────────────────────────────────────
  name    unit
  Weight  g
  Count   units
  Volume  ml


──────────────────────────────────────────────
IngredientType                          [ DONE ]
──────────────────────────────────────────────
  null measurementType = descriptive/modifier tag with no canonical measurement

  name        measurementType
  Dried       —
  Cooked      —
  Rotten      —
  Sweet       —
  Bitter      —
  Sour        —
  Savory      —
  Spicy       —
  Mild        —
  Tea         —
  Poultice    —
  Salve       —
  Tincture    —
  Broth       —
  Meal        —
  Meat        Weight
  Fat         Weight
  Clay        Weight
  Ground      Weight
  Paste       Weight
  Mash        Weight
  Shredded    Weight
  Char        Weight
  Flower      Count
  Leaf        Count
  Stalk       Count
  Root        Count
  Seed        Count
  Bark        Count
  Berry       Count
  Bud         Count
  Mushroom    Count
  Pelt        Count
  Feather     Count
  Bone        Count
  Sinew       Count
  Egg         Count
  Wood        Count
  Stone       Count
  Vine        Count
  Reed        Count
  Shell       Count
  Fiber       Count
  Cobweb      Count
  Moss        Count
  Ore         Count
  Ingot       Count
  Gem         Count
  Hide        Count
  Leather     Count
  Cloth       Count
  Ceramic     Count
  Coal        Weight
  Slag        Weight
  Liquid      Volume
  Juice       Volume
  Oil         Volume
  Resin       Volume


──────────────────────────────────────────────
CraftingInteraction                     [ DONE ]
──────────────────────────────────────────────
  name     description
  Brew     Steep ingredients in hot water to extract properties into a drinkable liquid.
  Dry      Remove moisture from an ingredient through air or gentle heat, preserving it and concentrating its properties.
  Grind    Break down dried or hard ingredients into a powder or paste using friction.
  Mash     Crush soft ingredients into a wet, pulpy mash without drying.
  Bake     Apply sustained dry heat to transform ingredients into a solid, edible form.
  Render   Melt animal fat over low heat to produce a purified liquid oil.
  Crush    Apply sharp pressure to break apart hard ingredients such as seeds, shells, or bark.
  Butcher  Break down a carcass or prey item into usable parts such as meat, fat, bone, and pelt.
  Craft    Assemble raw materials into a finished item using skill and tools.
  Carve    Shape bone, stone, or wood into a finished form using a cutting tool.
  Weave    Interlace fibers, vines, or reeds into cloth, cord, or woven goods.
  Tan      Treat a raw hide to produce durable leather.
  Smelt    Melt raw ore in a furnace to produce refined metal ingots.
  Forge    Shape a heated ingot into tools, weapons, or armor using hammer and anvil.
  Temper   Harden and refine metal through repeated cycles of heating and cooling.
  Kiln     Fire clay or ceramic items at high heat to produce hardened, permanent forms.

  NOTE: structure requirements (e.g. Smelt requires a forge) are NOT baked into the interaction
  definition. They are configured per-guild via Guild_CraftingInteractionRule. Global defaults
  may be provided in a future seeding pass once guilds have defined their structure defs.


──────────────────────────────────────────────
RecipeOutputMode                        [ DONE ]
──────────────────────────────────────────────
Values:
  fixed
  proportional


──────────────────────────────────────────────
EquipmentSlotType                       [ DONE ]
──────────────────────────────────────────────
  name   defaultCapacity  isUnlimited
  Hand   2                false
  Chest  1                false
  Head   1                false
  Innate 1                true


──────────────────────────────────────────────
CombatTargetScope                       [ DONE ]
──────────────────────────────────────────────
  name         targetsSelf  targetsSingle  targetsAllies  targetsEnemies
  self         true         false          false          false
  single       false        true           false          false
  all_allies   false        false          true           false
  all_enemies  false        false          false          true
  all          false        false          true           true


──────────────────────────────────────────────
CombatInitiationType                    [ DONE ]
──────────────────────────────────────────────
  name   canResultInDeath  isScripted  allowsFleeing  usesDeathSaves
  spar   false             false       false          false
  fight  true              false       false          true
  event  true              false       true           true
  boss   true              true        true           true


──────────────────────────────────────────────
CombatOutcome                           [ DONE ]
──────────────────────────────────────────────
  name       isVictory  isDefeat  isDraw  isExpired
  win        true       false     false   false
  lose       false      true      false   false
  draw       false      false     true    false
  completed  false      false     false   true


──────────────────────────────────────────────
CombatActionCategory                    [ DONE ]
──────────────────────────────────────────────
  name              actionsAllowedPerRound  description
  Main Action       1                       Standard action — one allowed per turn.
  Bonus Action      1                       Supplemental action — one allowed per turn alongside a Main Action.
  Item Interaction  1                       Item use slot — one allowed per turn (using, throwing, or activating a held item).


──────────────────────────────────────────────
CombatTargetStrategy                    [ DONE ]
──────────────────────────────────────────────
Values:
  lowest_health
  highest_health
  lowest_strength
  random


──────────────────────────────────────────────
CombatEffectType                        [ DONE ]
──────────────────────────────────────────────
Note: damage_per_round, heal_per_round, advantage, and disadvantage were removed — these are
now defined as CombatStatEffectDef sub-tables (DamageOverTime, HealOverTime, RollAdvantage).
Flags isPerRound, dealsDamage, restoresHealth, grantsAdvantage, grantsDisadvantage were
removed from the model for the same reason.

  name              modifiesRoll  modifiesStat  deniesActions  modifiesAC  redirectsDamage  forcesTargeting  isReactive  absorbsDamage  grantsEvasion  enablesCounterattack  suppressesReactive  removesEffects  preventedAsTarget  reflectsDamage
  hit_mod           true          false         false          false       false            false            false       false          false          false                 false               false           false              false
  damage_mod        true          false         false          false       false            false            false       false          false          false                 false               false           false              false
  stat_mod          false         true          false          false       false            false            false       false          false          false                 false               false           false              false
  action_denial     false         false         true           false       false            false            false       false          false          false                 false               false           false              false
  ac_mod            false         false         false          true        false            false            false       false          false          false                 false               false           false              false
  guard             false         false         false          false       true             false            false       false          false          false                 false               false           false              false
  taunt             false         false         false          false       false            true             false       false          false          false                 false               false           false              false
  parry             false         false         false          false       false            false            true        false          false          false                 false               false           false              false
  absorb            false         false         false          false       false            false            false       true           false          false                 false               false           false              false
  dodge_stance      false         false         false          false       false            false            false       false          true           false                 false               false           false              false
  counterattack     false         false         false          false       false            false            true        false          false          true                  false               false           false              false
  suppress          false         false         false          false       false            false            false       false          false          false                 true                false           false              false
  dispel            false         false         false          false       false            false            false       false          false          false                 false               true            false              false
  untargetable      false         false         false          false       false            false            false       false          false          false                 false               false           true               false
  reflect           false         false         false          false       false            false            false       false          false          false                 false               false           false              true


──────────────────────────────────────────────
CombatRollType                          [ DONE ]
──────────────────────────────────────────────
Used by CombatStatEffectDef_RollMod and CombatStatEffectDef_RollAdvantage to identify
which roll a modifier or advantage/disadvantage effect targets.

Values:
  hit     — the 1d20 attack roll against target AC
  damage  — the damage dice roll
  heal    — the heal dice roll


──────────────────────────────────────────────
DamageCategory                          [ DONE ]
──────────────────────────────────────────────
Values:
  Physical  — reduced by physical armor/defense
  Magical   — bypasses physical armor; checked against magical resistance
  True      — bypasses all defenses; cannot be resisted or immuned


──────────────────────────────────────────────
ConditionContext                        [ DONE ]
──────────────────────────────────────────────
Values:
  illness
  injury
  biological
  buff
  debuff


──────────────────────────────────────────────
Symptom                                 [ DONE ]
──────────────────────────────────────────────
  defaultRoll: 0 = immediately obvious, 20 = borderline impossible without near-perfect roll

  RESPIRATORY
  name                            defaultRoll
  Runny Nose                      3
  Sneezing                        0
  Nasal Bleeding                  2
  Congestion                      5
  Coughing                        0
  Sore Throat                     12
  Wheezing                        3
  Rattling Breath                 2
  Rapid Breathing                 2
  Labored Breathing               2
  Difficulty Breathing            3
  Open-mouth Breathing            0
  Gasping for Air                 0
  Cyanosis (Bluish Tongue/Gums)   8
  Choking                         0

  NEUROLOGICAL
  name                                      defaultRoll
  Unconsciousness                           0
  Seizure                                   0
  Tremors                                   5
  Disorientation                            5
  Dizziness                                 8
  Confusion                                 7
  Memory Loss                               15
  Head Tilt                                 3
  Circling                                  3
  Loss of Coordination (Ataxia)             5
  Hyperactivity                             3
  Depression (Low Mood / Unresponsiveness)  8
  Hallucination-like Behavior               5
  Sensitivity to Sound                      12
  Sudden Personality Change                 10

  DIGESTIVE
  name                    defaultRoll
  Vomiting                0
  Nausea                  8
  Diarrhea                3
  Constipation            12
  Loss of Appetite        5
  Bellyache               10
  Bloating                5
  Excessive Gas           5
  Straining to Defecate   5
  Blood in Stool          8
  Black/Tarry Stool       8
  Regurgitation           3
  Difficulty Swallowing   8

  CARDIOVASCULAR
  name                  defaultRoll
  Irregular Heartbeat   15
  Weak Pulse            15
  Fainting (Syncope)    3
  Cold Extremities      8

  URINARY / REPRODUCTIVE
  name                               defaultRoll
  Frequent Urination                 8
  Painful Urination                  10
  Blood in Urine                     8
  Incontinence                       5
  Strong Urine Odor                  5
  Swollen Abdomen (Fluid Buildup)    5
  Low Milk Production                12

  MUSCULOSKELETAL
  name                      defaultRoll
  Limping                   0
  Paralysis                 0
  Stiffness                 5
  Joint Pain                10
  Broken Bone               5
  Sprain                    8
  Muscle Cramps             8
  Muscle Rigidity           8
  Muscle Wasting            7
  Trembling When Standing   3
  Reluctance to Move        5
  Difficulty Rising         3
  Loss of Balance           5
  Numbness                  18

  SYSTEMIC / GENERAL
  name                  defaultRoll
  Fever                 8
  Chills                5
  Fatigue               7
  Lethargy              5
  Weakness              7
  Shivering             3
  Panting               3
  Dehydration           8
  Excessive Thirst      5
  Weight Loss           5
  Visible Ribs          3
  Emaciation            0
  Pot Belly             3
  Hunger Pangs          12
  Shock                 5
  Sudden Collapse       0
  Failure to Thrive     8
  Heat Intolerance      10
  Cold Intolerance      10
  Night Sweats          12
  Enlarged Organs       15
  Swollen Lymph Nodes   12
  Aggression            3
  Restlessness          5
  Anxiety               8
  Withdrawal            8

  WOUNDS / SKIN
  name                    defaultRoll
  Bleeding                0
  Wound                   3
  Pain                    8
  Burn                    5
  Blistering              8
  Bruising                10
  Itching                 5
  Pus                     8
  Swelling                5
  Rash                    10
  Discharge               8
  Inflammation            8
  Infection               10
  Festering Wound         5
  Hair Loss               3
  Matted Fur              0
  Dry Skin                8
  Hot Spots               8
  Scabs                   5
  Flaky Skin (Dandruff)   5
  Thickened Skin          10
  Skin Discoloration      8

  HEAD / SENSES
  name                    defaultRoll
  Glazed Eyes             3
  Sunken Eyes             5
  Cloudy Eye              3
  Squinting               3
  Red Eyes                3
  Eye Discharge           3
  Dilated Pupils          5
  Unequal Pupil Size      8
  Loss of Vision          10
  Sensitivity to Light    8
  Blurred Vision          15
  Loss of Hearing         15
  Head Shaking            3
  Ear Discharge           5
  Ear Odor                5
  Bad Breath              5
  Gum Swelling            8
  Pale Gums               7
  Yellowing Gums          8
  Foaming at Mouth        0
  Toothache               15

  OTHER
  name                  defaultRoll
  Hypersensitivity      12
  Respiratory Illness   5
  Poisoning             10
  Drooling              3


──────────────────────────────────────────────
SymptomFlavorText                       [ DONE ]
──────────────────────────────────────────────
  Global ambient message templates emitted during the daily tick when an entity has an
  undiscovered condition carrying a linked symptom. Text supports a {name} placeholder
  replaced with the entity's name at emit time. Not guild-extensible.

  One template seeded per symptom (see Symptom_FlavorText below for the join).
  Additional templates can be added later to any symptom for random variation.

  RESPIRATORY
  symptom                         text
  Runny Nose                      {name}'s nose has been running all day, leaving damp traces on their face.
  Sneezing                        {name} let out a sudden sneeze that scattered the nearby bedding.
  Nasal Bleeding                  A thin trail of blood was spotted beneath {name}'s nose.
  Congestion                      {name} has been breathing through their mouth, their nose seemingly blocked.
  Coughing                        {name} was heard coughing fitfully in the night.
  Sore Throat                     {name} winced when swallowing their meal, favoring one side of their throat.
  Wheezing                        A faint wheeze follows {name}'s every breath.
  Rattling Breath                 {name}'s breathing carries an unsettling rattle.
  Rapid Breathing                 {name} has been breathing rapidly, even while resting.
  Labored Breathing               Each breath {name} takes appears to cost them considerable effort.
  Difficulty Breathing            {name} has been pausing frequently, struggling to catch their breath.
  Open-mouth Breathing            {name} has been keeping their mouth open, even in the cool air.
  Gasping for Air                 {name} was seen gasping for air near the food stores.
  Cyanosis (Bluish Tongue/Gums)   {name}'s tongue and gums have taken on an unusual bluish hue.
  Choking                         {name} was seen gagging and clawing at their throat.

  NEUROLOGICAL
  symptom                                    text
  Unconsciousness                            {name} was found unresponsive and could not be roused.
  Seizure                                    {name} collapsed suddenly, their limbs seizing uncontrollably for several heartbeats.
  Tremors                                    A subtle trembling runs through {name}'s body, even at rest.
  Disorientation                             {name} wandered past their own bedding twice before settling.
  Dizziness                                  {name} stumbled when turning their head, nearly losing their footing.
  Confusion                                  {name} stared blankly when spoken to, slow to respond.
  Memory Loss                                {name} asked about a meal they had already eaten this morning.
  Head Tilt                                  {name} has been holding their head at an odd angle all day.
  Circling                                   {name} was spotted walking in tight circles near the camp entrance.
  Loss of Coordination (Ataxia)              {name}'s limbs seem to be working against each other.
  Hyperactivity                              {name} has barely rested, moving restlessly from place to place without purpose.
  Depression (Low Mood / Unresponsiveness)   {name} has been sitting alone at the edge of camp, uninterested in the day's activities.
  Hallucination-like Behavior                {name} startled at nothing, their gaze fixed on an empty patch of ground.
  Sensitivity to Sound                       {name} flinched sharply at a sound no one else seemed to notice.
  Sudden Personality Change                  Those who know {name} well have noticed something unsettling in how they carry themselves today.

  DIGESTIVE
  symptom                 text
  Vomiting                {name} was found retching alone before dawn.
  Nausea                  {name} turned away from their food without eating, looking unwell.
  Diarrhea                {name} has made several trips to the latrine today.
  Constipation            {name} was seen straining at the latrine but returned without relief.
  Loss of Appetite        {name} left their food untouched again today.
  Bellyache               {name} has been curled tightly around their belly for most of the afternoon.
  Bloating                {name}'s belly appears more rounded than usual.
  Excessive Gas           An unpleasant odor has been following {name} around camp today.
  Straining to Defecate   {name} returned from the latrine with discomfort plain on their face.
  Blood in Stool          Something troubling was discovered at the latrine, apparently left by {name}.
  Black/Tarry Stool       A dark, foul-smelling deposit was found at the latrine, believed to be {name}'s.
  Regurgitation           {name} regurgitated their meal shortly after eating.
  Difficulty Swallowing   {name} struggled to get even a small bite of food down without discomfort.

  CARDIOVASCULAR
  symptom               text
  Irregular Heartbeat   {name}'s heartbeat seemed to skip and stutter when listened to closely.
  Weak Pulse            {name}'s pulse is faint and difficult to find.
  Fainting (Syncope)    {name} went limp without warning and had to be steadied before hitting the ground.
  Cold Extremities      {name}'s extremities were noticeably cold to the touch despite the mild weather.

  URINARY / REPRODUCTIVE
  symptom                            text
  Frequent Urination                 {name} has visited the latrine far more often than usual today.
  Painful Urination                  {name} was heard making small sounds of pain at the latrine.
  Blood in Urine                     Something alarming was noticed at the latrine, suggesting {name} may be unwell.
  Incontinence                       A damp patch was found near where {name} had been sleeping.
  Strong Urine Odor                  An unusually sharp odor seems to follow {name} from the latrine.
  Swollen Abdomen (Fluid Buildup)    {name}'s belly has been swelling in a way that doesn't look like healthy weight gain.
  Low Milk Production                {name}'s offspring have been crying more than usual, unsatisfied after nursing.

  MUSCULOSKELETAL
  symptom                   text
  Limping                   {name} has been favoring one leg today, placing less weight on it with each step.
  Paralysis                 {name} was found unable to move their hindquarters.
  Stiffness                 {name} rose from their resting place slowly this morning, each movement careful and deliberate.
  Joint Pain                {name} winced quietly when their leg was brushed, though they tried to hide it.
  Broken Bone               {name} cried out when putting weight on one leg and has been reluctant to walk on it since.
  Sprain                    {name} returned from patrol with a pronounced limp.
  Muscle Cramps             {name} was found frozen mid-step, waiting for a cramp to pass.
  Muscle Rigidity           {name}'s movements have become unusually stiff and stilted.
  Muscle Wasting            {name} appears thinner than before, particularly around the haunches.
  Trembling When Standing   {name} trembled visibly while trying to hold themselves upright.
  Reluctance to Move        {name} has remained in their resting place all day, reluctant to stir.
  Difficulty Rising         {name} struggled to push themselves upright this morning.
  Loss of Balance           {name} stumbled sideways while simply standing still.
  Numbness                  {name} showed no reaction when their foot was carefully prodded.

  SYSTEMIC / GENERAL
  symptom               text
  Fever                 {name}'s body radiates an unusual heat, their nose dry to the touch.
  Chills                {name} has been shivering despite the warmth of the den.
  Fatigue               {name} dozed off mid-sentence while talking to a companion.
  Lethargy              {name} has barely stirred from their resting place, moving only when necessary.
  Weakness              {name} struggled to carry even a small amount of food back to camp.
  Shivering             {name} has been shivering steadily since returning from patrol.
  Panting               {name} has been panting heavily, their tongue lolling even in the shade.
  Dehydration           {name}'s skin tented slightly when gently pinched — they haven't been drinking enough.
  Excessive Thirst      {name} has visited the water source more times today than anyone can count.
  Weight Loss           {name} looks notably leaner than they did recently.
  Visible Ribs          {name}'s ribs are visible when they stretch, despite eating regularly.
  Emaciation            {name} looks gaunt, their bones pressing visibly through their thinning skin.
  Pot Belly             {name}'s belly hangs low and round, out of proportion with the rest of their frame.
  Hunger Pangs          {name} was caught raiding the food stores in the early morning hours.
  Shock                 {name} was found sitting with a blank stare, unresponsive and limp.
  Sudden Collapse       {name} dropped without warning during the morning gathering.
  Failure to Thrive     {name} has not grown as expected and seems weaker than others their age.
  Heat Intolerance      {name} retreated to the shadiest corner of camp and refused to move during the afternoon.
  Cold Intolerance      {name} pressed close to their companions for warmth even though the air is mild.
  Night Sweats          {name}'s bedding was found damp with sweat despite the cool night air.
  Enlarged Organs       {name}'s belly feels firm and swollen in a way that didn't used to be there.
  Swollen Lymph Nodes   Small, firm lumps were felt beneath {name}'s jaw during an examination.
  Aggression            {name} snapped at a companion without apparent cause.
  Restlessness          {name} paced the length of the camp deep into the night.
  Anxiety               {name} startled at every sound today, unable to settle.
  Withdrawal            {name} has been avoiding their usual company, retreating to a quiet corner.

  WOUNDS / SKIN
  symptom                   text
  Bleeding                  {name} was seen with blood matting around a wound.
  Wound                     {name} was spotted tending to a fresh injury on their side.
  Pain                      {name} flinched when a companion brushed against them.
  Burn                      {name}'s skin is visibly singed, raw and tender to the touch.
  Blistering                Fluid-filled swellings were found on {name}'s flank.
  Bruising                  Dark patches were found beneath {name}'s skin, tender to the touch.
  Itching                   {name} has been scratching at the same spot relentlessly.
  Pus                       A foul-smelling yellow discharge was found seeping from a wound on {name}.
  Swelling                  A notable lump has appeared on {name}'s leg, warm and firm.
  Rash                      A patch of irritated, reddened skin was found on {name}'s flank.
  Discharge                 An unusual fluid was found seeping from one of {name}'s wounds.
  Inflammation              The skin around {name}'s injury is hot, tight, and visibly swollen.
  Infection                 {name}'s wound has taken on an angry red color and an unpleasant smell.
  Festering Wound           {name}'s wound has not closed and appears to be worsening.
  Hair Loss                 A bare patch has appeared on {name}'s coat.
  Matted Fur                {name}'s coat is tangled and matted, something unusual for them.
  Dry Skin                  {name}'s coat has been dull and flaky lately.
  Hot Spots                 {name} has been worrying at one spot on their flank until it is raw.
  Scabs                     Several crusty scabs have formed along {name}'s back.
  Flaky Skin (Dandruff)     A dusting of white flakes falls from {name}'s coat when they move.
  Thickened Skin            A rough, leathery patch has formed on the sole of {name}'s foot.
  Skin Discoloration        An area of {name}'s skin has changed to an unusual color.

  HEAD / SENSES
  symptom                   text
  Glazed Eyes               {name}'s eyes have a distant, unfocused quality to them.
  Sunken Eyes               {name}'s eyes look sunken, the hollows around them more pronounced than usual.
  Cloudy Eye                One of {name}'s eyes has a milky cloudiness to it.
  Squinting                 {name} has been squinting against the daylight.
  Red Eyes                  The whites of {name}'s eyes are rimmed with red.
  Eye Discharge             Crusty discharge has been collecting in the corners of {name}'s eyes.
  Dilated Pupils            {name}'s pupils are wide even in bright light.
  Unequal Pupil Size        {name}'s pupils are mismatched, one noticeably larger than the other.
  Loss of Vision            {name} misjudged a jump they would normally make with ease.
  Sensitivity to Light      {name} kept their eyes half-closed and turned away from the sun all day.
  Blurred Vision            {name} has been squinting and moving closer to examine things they normally see clearly.
  Loss of Hearing           {name} didn't respond when called from across camp.
  Head Shaking              {name} has been shaking their head repeatedly throughout the day.
  Ear Discharge             A dark, waxy discharge was spotted inside {name}'s ear.
  Ear Odor                  An unpleasant smell was noticed when {name} shook their head nearby.
  Bad Breath                {name}'s breath has been notably unpleasant today.
  Gum Swelling              {name}'s gums look red and puffy when they open their mouth.
  Pale Gums                 {name}'s gums are pale, nearly white.
  Yellowing Gums            {name}'s gums have taken on a yellowish tint.
  Foaming at Mouth          {name} was found with foam gathering at the corners of their mouth.
  Toothache                 {name} has been avoiding chewing on one side.

  OTHER
  symptom               text
  Hypersensitivity      {name} recoiled sharply when touched, as if the lightest contact caused pain.
  Respiratory Illness   {name} has been struggling with their breathing throughout the day.
  Poisoning             {name} is showing signs of severe distress — something is deeply wrong.
  Drooling              Drool has been gathering at the corners of {name}'s mouth.


──────────────────────────────────────────────
Symptom_FlavorText                      [ DONE ]
──────────────────────────────────────────────
  Join table linking symptoms to flavor text templates (many-to-many).
  Seeded as a 1:1 pairing at launch — one template per symptom.
  Adding a second row for any symptom is all that's needed for random variation.

  (No explicit table shown — fully derived from SymptomFlavorText data above.)


──────────────────────────────────────────────
ConditionType                           [ DONE ]
──────────────────────────────────────────────
  name         tracksDays  tracksProgression  canSelfResolve  canSpawn  description
  Timed        true        false              true            true      Counts calendar days against maxDays. No roll. Advances or removes at cap via links.
  LifeCycle    true        false              true            false     Counts calendar days against maxDays. No roll. Advances cleanly through its chain with no complications.
  Progressive  false       true               true            true      Daily CON roll vs. dailyRollDC. Value moves bidirectionally. Removes or advances at endpoints via links.
  Chronic      false       true               false           true      Daily CON roll vs. dailyRollDC. Floors at 0 and cap — never self-removes. Spawn checks keep firing at cap until treated.
  Permanent    false       false              false           false     No progression, no roll. Condition persists indefinitely applying its modifiers. Removed only by admin.


──────────────────────────────────────────────
ConditionBehaviorType                   [ DONE ]
──────────────────────────────────────────────
  name      description
  redirect  Move the action to a different target. Uses redirectTarget + triggerChance.
  cancel    Prevent the action entirely. triggerChance = probability of cancel (Parry, Dodge).
  bias      Shift AI targeting weight toward or away from a target. Uses redirectTarget + biasWeight.
            Positive biasWeight = toward (Taunt). Negative = away (Fear, Intimidate).
  restrict  Limit which action types the entity may use. Uses restrictActionTypeId.
            restrictIsBlock=false → may ONLY use that type (Provoked).
            restrictIsBlock=true  → may NOT use that type (Silenced).


──────────────────────────────────────────────
BehaviorRedirectTarget                  [ DONE ]
──────────────────────────────────────────────
  name          description
  source        EntityCondition.sourceEntityId — whoever applied this condition.
                Used by Taunt, Guard, Hunter's Strike, exploitation marks.
  self          The entity holding the condition (Confusion self-hit).
  random_ally   A random member of the holder's own side.
  random_enemy  A random member of the opposing side.




──────────────────────────────────────────────
FactionStandingType                     [ DONE ]
──────────────────────────────────────────────
Values:
  Ally
  Neutral
  Hostile
  Enemy
  Truce


──────────────────────────────────────────────
RelationshipType                        [ DONE ]
──────────────────────────────────────────────
  name     label    isUnique
  mother   Mother   false
  father   Father   false
  mentor   Mentor   true


──────────────────────────────────────────────
EventTriggerType                        [ DONE ]
──────────────────────────────────────────────
Values:
  admin
  patrol
  hunt
  crafting
  foraging
  clean
  weather_onset
  threshold
  daily
  hourly


──────────────────────────────────────────────
EventScope                              [ DONE ]
──────────────────────────────────────────────
Values:
  global
  faction
  action
  camp


──────────────────────────────────────────────
EventStepType                           [ DONE ]
──────────────────────────────────────────────
Each type has exactly one responsibility. See event-system.md section 5 for full details.

  narrative          — displays prompt text; anyone clicks 'next' → nextStepId
  narrative_random   — displays prompt text; anyone clicks 'next'; worker rolls weighted
                       EventStepRandomBranch table to determine nextStepId
  choice_solo        — displays prompt + N choice buttons; first participant to click decides
  choice_leader      — same as choice_solo but only the group leader may interact
  choice_consensus   — all participants vote; plurality winner decides; ties broken by lowest
                       sortOrder; if window elapses, tallies existing votes (cancels if none)
  proficiency_check  — displays prompt + 'roll' button; worker rolls the configured proficiency
                       for the scoped participant(s) against checkDifficulty;
                       routes to passStepId (success) or failStepId (failure)
  condition_check    — automatic; checks whether scoped participant(s) have conditionCheckDefId
                       active; routes to passStepId (has condition) or failStepId (does not)
  item_check         — automatic; checks whether scoped participant(s) carry the required item
                       (itemCheckItemId or any item of itemCheckItemTypeId) in at least
                       itemCheckMinQuantity; routes to passStepId or failStepId
  threshold_check    — automatic; reads a world-state value (thresholdCheckTypeId) and compares
                       to thresholdCheckValue; routes to passStepId or failStepId
  combat             — displays prompt + 'initiate' button; spawns ActiveCombat;
                       resolves to winStepId or loseStepId
  effect             — applies EventEffect rows; displays results; anyone clicks 'next'/'finish'
                       → nextStepId (null = event ends naturally)
  exit               — terminal; optional closing text; marksUnresolved / endsAction flags; no nextStepId


──────────────────────────────────────────────
EventThresholdType                      [ DONE ]
──────────────────────────────────────────────
Values:
  filth


──────────────────────────────────────────────
EventParticipantScope                   [ DONE ]
──────────────────────────────────────────────
  name               appliesToAll  appliesToRandom  appliesToLeader  appliesToGroup  appliesToHoused
  all_participants   true          false            false            false            false
  random_participant false         true             false            false            false
  leader             false         false            true             false            false
  group              false         false            false            true             false
  housed_entities    false         false            false            false            true


──────────────────────────────────────────────
EventEffectType                         [ DONE ]
──────────────────────────────────────────────
These are EffectType rows with isEvent = true. The effectTypeId on EventEffect references this table.

  name                    notes
  ────────────────────    ─────────────────────────────────────────────────────────────────────────────
  condition               apply or remove a ConditionDef on targets
  item                    add or remove items from target inventories (fixed item, itemType, or dropTableId roll)
  location_buff           apply a temporary location-wide buff/debuff (locationBuffEffectTypeId + locationBuffValue)
  stat_modifier           apply a temporary stat bonus/penalty (statModifierStatId + statModifierValue)
  proficiency_modifier    apply a temporary proficiency modifier, advantage, or disadvantage
  faction_rep             grant or remove faction reputation (factionRepValue)
  discipline_xp           grant discipline experience (disciplineXpDisciplineDefId + disciplineXpValue)
  structure_damage        deal flat or proportional damage to structures in the camp (structureDamageValue + fields)
  action_output_modifier  multiply the output quantity of the triggering action (outputMultiplier); action-scoped only
  event_weight_modifier   add a positive or negative modifier to another event's spawn weight
                          (eventWeightTargetEventDefId + eventWeightValue + eventWeightDurationHours)


──────────────────────────────────────────────
EventCheckMode — REMOVED
──────────────────────────────────────────────
Skill/stat checks on choices were removed from the event system. Choices are purely
player-driven (deterministic navigation). System-driven randomness is handled by the
narrative_random step type and its EventStepRandomBranch weight table.


═══════════════════════════════════════════════════════════════════════
ENGINE-GLOBAL EXTENSIBLE TABLES
(no guildId — seeded once; guilds reference but do not own these rows)
═══════════════════════════════════════════════════════════════════════

──────────────────────────────────────────────
DisciplineDef                           [ DONE ]
──────────────────────────────────────────────
Includes the 7 disciplines + 1 stat progression row (isStatProgression = true).

XP formula for disciplines: xpRequired(level) = floor(baseXp × level^1.5)
Stat progression uses a flat threshold: baseXp XP per stat point, every time.
dailyXpCap is null for all disciplines; only the stat progression row sets it.

  codeName          name             description                                                      baseXp  isStatProgression  dailyXpCap
  ────────────────  ───────────────  ───────────────────────────────────────────────────────────────  ──────  ─────────────────  ──────────
  healing           Healing          Treating wounds, illness, and conditions                            100   false              null
  crafting          Crafting         Creating items via recipes                                          100   false              null
  farming           Farming          Growing, gathering, and tending plant-based resources               100   false              null
  combat            Combat           Fighting effectiveness and battle experience                        100   false              null
  stat_progression  StatProgression  Tracks XP toward stat points; excluded from discipline listings    6000  true               100

NOTE — stat progression calibration:
  dailyXpCap = 100 XP/day. Casual player (~18 active days/mo) earns ~1,800 XP/mo →
  ~1.44 stat points/month → 60 points in ~3.5 years.
  Active player (~28 active days/mo, capped daily) earns ~2,800 XP/mo →
  ~2.24 stat points/month → 60 points in ~2.2 years.
  Actions remain worth doing past the daily cap for their tangible rewards
  (food, items, faction rep, event triggers).


──────────────────────────────────────────────
DamageType                              [ DONE ]
──────────────────────────────────────────────
Engine-defined fixed set. Not guild-extensible — contact the engine team to request additions.

  codeName   name       category
  blunt      Blunt      Physical
  slashing   Slashing   Physical
  piercing   Piercing   Physical
  fire       Fire       Magical
  frost      Frost      Magical
  lightning  Lightning  Magical
  poison     Poison     Magical
  arcane     Arcane     Magical
  nature     Nature     Magical
  shadow     Shadow     Magical
  radiant    Radiant    Magical
  sonic      Sonic      Magical
  acid       Acid       Magical
  wind       Wind       Magical
  void       Void       True


──────────────────────────────────────────────
Biome                                   [ DONE ]
──────────────────────────────────────────────
Engine-defined fixed set. Not guild-extensible — contact the engine team to request additions.
Drop tables are NOT seeded here — guilds assign per-biome drop tables via Guild_BiomeDrop at init.

color: Discord-style integer (decimal value of RRGGBB hex). Hex shown in parentheses for reference.
inherentConditions: codeName:stacks — always active regardless of weather or season.
Conversion: parseInt('RRGGBB', 16) in seeding code.

Removed from original list as redundant:
  Tundra          — covered by Arctic Tundra and Alpine Tundra
  Jungle          — same ecosystem as Rainforest, different name only
  Monsoon Forest  — too similar to Tropical Dry Forest
  Underground     — covered by Cave System

  FORESTS
  codeName              name                color                  inherentConditions
  forest                Forest              2976301   (#2D6A2D)    shaded:1  damp:1
  deciduous_forest      Deciduous Forest    4881471   (#4A7C3F)    shaded:1  damp:1
  coniferous_forest     Coniferous Forest   1727530   (#1A5C2A)    shaded:1  cold:1
  mixed_forest          Mixed Forest        4028997   (#3D7A45)    shaded:1
  taiga                 Taiga               2776122   (#2A5C3A)    shaded:1  cold:2
  rainforest            Rainforest          1796922   (#1B6B3A)    shaded:1  humid:2  damp:1
  tropical_dry_forest   Tropical Dry Forest 8227642   (#7D8B3A)    shaded:1  dry:1
  cloud_forest          Cloud Forest        6065258   (#5C8C6A)    shaded:1  misty:2  damp:1
  bamboo_forest         Bamboo Forest       7187290   (#6DAB5A)    shaded:1  damp:1
  mangrove_forest       Mangrove Forest     4880988   (#4A7A5C)    humid:1   damp:2   muddy:1

  GRASSLANDS
  codeName              name                  color                  inherentConditions
  grassland             Grassland             9287772   (#8DB85C)    (none)
  savanna               Savanna               13150283  (#C8A84B)    warm:1  dry:1
  steppe                Steppe                11049820  (#A89B5C)    dry:1   windy:1
  meadow                Meadow                8243322   (#7DC87A)    dappled_light:1
  floodplain_grassland  Floodplain Grassland  7055472   (#6BA870)    damp:1  muddy:1

  DESERTS
  codeName          name              color                  inherentConditions
  arid_desert       Arid Desert       15255674  (#E8C87A)    arid:2  heat:1
  semi_arid_desert  Semi-Arid Desert  13150298  (#C8A85A)    arid:1  dry:1
  rocky_desert      Rocky Desert      12089930  (#B87A4A)    arid:1  dusty:1
  salt_flats        Salt Flats        15788758  (#F0EAD6)    arid:2  harsh_sunlight:1
  badlands          Badlands          12081722  (#B85A3A)    dusty:1  arid:1

  TUNDRA / ICE
  codeName       name           color                  inherentConditions
  arctic_tundra  Arctic Tundra  9222344   (#8CB8C8)    freezing:2  windy:1
  alpine_tundra  Alpine Tundra  10139816  (#9AB8A8)    cold:2      windy:1
  glacier        Glacier        12114152  (#B8D8E8)    freezing:2  icy:1
  snowfield      Snowfield      15266040  (#E8F0F8)    freezing:1  icy:1

  FRESHWATER
  codeName   name                 color                  inherentConditions
  river      River                4889272   (#4A9AB8)    damp:1
  stream     Stream               6992072   (#6AB0C8)    damp:1
  lake       Lake                 3832488   (#3A7AA8)    damp:1  misty:1
  pond       Pond                 5937320   (#5A98A8)    damp:1
  wetlands   Wetlands             5933674   (#5A8A6A)    damp:2  humid:1
  swamp      Swamp                3828298   (#3A6A4A)    damp:2  humid:1  muddy:1
  marsh      Marsh                5933658   (#5A8A5A)    damp:2  muddy:1
  bog        Bog                  4876858   (#4A6A3A)    damp:2  humid:1
  fen        Fen                  5929546   (#5A7A4A)    damp:1  humid:1

  COASTAL / MARINE
  codeName       name           color                  inherentConditions
  estuary        Estuary        5937802   (#5A9A8A)    damp:1  humid:1
  coastal_shore  Coastal Shore  13944986  (#D4C89A)    breezy:1  damp:1
  coral_reef     Coral Reef     16743002  (#FF7A5A)    damp:1
  ocean          Ocean          2775690   (#2A5A8A)    breezy:1  damp:1
  deep_ocean     Deep Ocean     1718890   (#1A3A6A)    (none — surface conditions don't apply)

  ELEVATED
  codeName          name              color                  inherentConditions
  mountains         Mountains         8026762   (#7A7A8A)    cold:1   windy:2
  foothills         Foothills         9079402   (#8A8A6A)    breezy:1
  highland_plateau  Highland Plateau  10132090  (#9A9A7A)    windy:1  bright:1
  cliffs            Cliffs            9075306   (#8A7A6A)    windy:2  bright:1

  SPECIAL
  codeName  name     color                  inherentConditions
  volcano   Volcano  9058858   (#8A3A2A)    scorching:1  dusty:1
  oasis     Oasis    4896906   (#4AB88A)    damp:2
  canyon    Canyon   13138506  (#C87A4A)    dusty:1  dry:1

  HUMAN-MADE / BUILT
  codeName  name      color                  inherentConditions
  urban     Urban     9079450   (#8A8A9A)    fouled:1  dusty:1
  suburban  Suburban  11053210  (#A8A89A)    cultivated:1
  ruins     Ruins     8024160   (#7A7060)    dusty:1
  farmland  Farmland  11061360  (#A8C870)    cultivated:1

  UNDERGROUND
  codeName     name         color                  inherentConditions
  cave_system  Cave System  5921386   (#5A5A6A)    dark:2  damp:1  cold:1

──────────────────────────────────────────────
EnvCondition                            [ DONE ]
──────────────────────────────────────────────
EnvConditions are a global vocabulary — no guildId. codeName is the stable unique lookup key.
EnvCondition_Modifier values (filth, spoilage) are per-guild and not seeded here — guilds define their own.
Conditions with no inherent world modifiers are marked with —. Their effects on plants,
species, and illnesses are expressed via per-entity tables (PlantDef_EnvConditionEffect,
Species_EnvConditionEffect, ConditionDef_EnvRule) seeded separately.

  TEMPERATURE
  codeName   name       modifiers
  cold       Cold       spoilage=-0.3
  frost      Frost      spoilage=-0.5
  freezing   Freezing   spoilage=-0.6
  warm       Warm       spoilage=0.2
  heat       Heat       spoilage=0.5
  scorching  Scorching  spoilage=0.8

  PRECIPITATION
  Intensity scale for liquid precipitation. Compose with other conditions for full weather states
  (e.g. heavy rain = drenched + overcast; thunderstorm = drenched + gusting + overcast).
  codeName  name      modifiers
  wet       Wet       filth=0.3  spoilage=0.2
  drenched  Drenched  filth=0.5  spoilage=0.2
  flooded   Flooded   filth=0.5

  HUMIDITY
  Ambient moisture scale — biome baseline and persistent atmospheric conditions.
  codeName  name   modifiers
  arid      Arid   spoilage=-0.5
  dry       Dry    —
  damp      Damp   filth=0.2  spoilage=0.3
  humid     Humid  filth=0.2  spoilage=0.6

  WIND
  codeName  name     modifiers
  still     Still    —
  breezy    Breezy   filth=0.1
  windy     Windy    filth=0.3
  gusting   Gusting  filth=0.4
  gale      Gale     filth=0.6

  AIR / GROUND CONDITIONS
  codeName  name    modifiers
  icy       Icy     —
  muddy     Muddy   filth=0.3
  dusty     Dusty   filth=0.2
  misty     Misty      —
  fog       Fog        —
  dense_fog Dense Fog  —
  hazy      Hazy       —
  fouled    Fouled     filth=0.5
  putrid    Putrid     filth=0.8
  pollen    Pollen  —
  smoke     Smoke   —
  toxic     Toxic   —

  LIGHT / SKY
  codeName       name           modifiers
  overcast       Overcast       —
  sunny          Sunny          spoilage=0.2
  harsh_sunlight Harsh Sunlight spoilage=0.3
  bright         Bright         —
  dappled_light  Dappled Light  —
  shaded         Shaded         —
  dim            Dim            —
  dark           Dark           —

  LAND USE
  codeName   name       modifiers
  cultivated Cultivated —
  (No global modifiers. Effects on plants/species seeded via per-entity tables.)

  ENGINE-RESERVED (hardcoded engine behavior — no guild modifiers)
  codeName    name        modifiers  notes
  power_loss  Power Loss  —          Worker skips all power processing while active; isFuelActive
                                     cannot be set to true. Attach to any WeatherState to create
                                     power-disabling weather (solar flares, arcane storms, etc.).

  SEASONAL (contributed by season rows only — one condition per season)
  Per-plant and per-species seasonal effects are seeded via PlantDef_EnvConditionEffect
  and Species_EnvConditionEffect rows referencing these codeNames directly.

  codeName  name    modifiers
  spring    Spring  filth=0.1
  summer    Summer  spoilage=0.6  filth=0.2
  autumn    Autumn  —
  winter    Winter  spoilage=-0.65

──────────────────────────────────────────────
ActionSystemType                        [ DONE ]
──────────────────────────────────────────────
  id        description
  ────────  ───────────────────────────────────────────────────────────────────────────
  patrol    Event-chance patrol system: rolls for random events at location; otherwise grants rewards
  hunting   Prey weight rolls at location; may spawn a combat instance against prey species
  foraging  Drop table / gather rolls based on location biome and active env conditions
  spar      Spawns a non-lethal ActiveCombat (CombatInitiationType = spar); XP at 50%
  fight     Spawns a lethal ActiveCombat (CombatInitiationType = fight)
  crafting  Opens the crafting UI for participants; XP flows from Recipe_DisciplineReward
  healing   Opens the treatment UI for the healer; XP flows from treatment subsystem
  diagnose  Opens the diagnosis UI; reveals symptoms and attempts condition identification
  clean     Interactive camp cleaning UI; player chooses target (base / food / herb storage)

  -- Farming: two player-facing system types; sub-types are internal (used for Plot_TendRecord
  -- and Action_EntityDailyRecord tracking only, no ActionType row points to them)
  farming_crop       Crop work UI: plant, harvest, uproot, or cross-breed a PlotCrop
  farming_tend       Tending UI: water, prune, or fertilize a PlotCrop
  farming_compost    Deposit compost items into a compost structure; increases soil quality
  farming_plant      [internal] Plant a propagation item into an open plot slot
  farming_harvest    [internal] Harvest a mature PlotCrop
  farming_uproot     [internal] Uproot a PlotCrop at any stage
  farming_crossbreed [internal] Cross-breed two mature PlotCrops; solo only
  farming_water      [internal] Daily tending; cooldownHours=24;  progressPoints=1
  farming_prune      [internal] Weekly tending; cooldownHours=168; progressPoints=7
  farming_fertilize  [internal] Weekly tending; cooldownHours=168; progressPoints=7

──────────────────────────────────────────────
ActionType                              [ DONE ]
──────────────────────────────────────────────
Seeded fields: name · displayName · systemTypeId
               requiresCanMentor · allowApprenticesWithAdult · requiresCanLeadEvents · minAge

Costs and rewards (energyCost, dailyLimit, minEntities, maxEntities, durationMinutes, baseFactionReward,
DisciplineRewards) are NOT seeded globally — each guild configures these via Guild_ActionConfig
and ActionType_DisciplineReward.

  name           displayName          systemTypeId   requiresCanMentor  allowApprenticesWithAdult  requiresCanLeadEvents  minAge  notes
  ─────────────  ───────────────────  ─────────────  ─────────────────  ─────────────────────────  ─────────────────────  ──────  ──────────────────────────────────────────────────────────────
  border_patrol  Border Patrol        patrol         false              true                       false                  null
  hunting        Hunting Run          hunting        false              true                       false                  null    Combat XP distributed by engine, not DisciplineReward
  foraging       Foraging Run         foraging       false              true                       false                  null
  spar           Spar                 spar           false              true                       false                  null    Combat XP at 50% from engine; StatProgression split winners/losers
  fight          Fight                fight          false              false                      false                  null    Faction rep outcome determined by app layer based on target faction
  training       Training Session     null           true               true                       false                  null    App layer applies bonus XP multiplier for registered mentors
  crafting       Crafting Session     crafting       false              true                       false                  null    Main XP flows from Recipe_DisciplineReward
  treat          Treat Patient        healing        false              true                       false                  null    Main XP flows from healing subsystem
  diagnose       Diagnose             diagnose       false              true                       false                  null    Reveals hidden symptoms; may identify condition
  clean          Clean Camp           clean          false              true                       false                  null
  crop_work      Crop Work            farming_crop     false              true                       false                  null    Plant, harvest, uproot, or cross-breed; see farming-system.md
  tend_crops     Tend Crops           farming_tend     false              true                       false                  null    Water, prune, or fertilize; tending sub-type tracked on Plot_TendRecord
  compost        Deposit to Compost   farming_compost  false              true                       false                  null    Deposits items into a compost structure; gatable via DisciplineRequirement


──────────────────────────────────────────────
ActionType_Step                         [ DONE ]
──────────────────────────────────────────────
Engine-defined resolution steps per action type. Global — every guild uses the same step
definitions for a given action type. Guilds assign which proficiency or stat to use per step
via Guild_ActionStep_Config. Species-side step participation is seeded in Species_ActionStep;
guild-side proficiency for species rolls lives in Guild_Species_ActionStep_Config.

All crafting steps default to Intelligence. Each recipe invokes exactly one interaction.

  actionType  codeName  defaultStat  description
  ──────────  ────────  ───────────  ──────────────────────────────────────────────────────────────────
  crafting    brew      INT          Crafter rolls to steep and extract properties from ingredients
  crafting    dry       INT          Crafter rolls to dry ingredients without losing potency
  crafting    grind     INT          Crafter rolls to grind ingredients to the correct consistency
  crafting    mash      INT          Crafter rolls to mash ingredients into a workable pulp
  crafting    bake      INT          Crafter rolls to bake ingredients at the correct heat and duration
  crafting    render    INT          Crafter rolls to render animal fat cleanly without scorching
  crafting    crush     INT          Crafter rolls to apply the right pressure to break down ingredients
  crafting    butcher   INT          Crafter rolls to cleanly butcher and recover usable parts
  crafting    craft     INT          Crafter rolls to assemble components into the finished item
  crafting    carve     INT          Crafter rolls to shape the material precisely with a cutting tool
  crafting    weave     INT          Crafter rolls to interlace fibers into a consistent, durable form
  crafting    tan       INT          Crafter rolls to treat the hide through the tanning process
  crafting    smelt     INT          Crafter rolls to correctly melt and refine the raw ore
  crafting    forge     INT          Crafter rolls to shape the heated metal into the desired form
  crafting    temper    INT          Crafter rolls to complete the tempering cycle without cracking the metal
  crafting    kiln      INT          Crafter rolls to fire the clay or ceramic at the correct temperature

Hunter-side steps (locate_prey, pursuit) are resolved via Guild_ActionStep_Config.
Prey-side steps (avoid_detection, escape) are resolved via Guild_Species_ActionStep_Config
using the Species_ActionStep codeName to cross-reference.

  actionType     codeName         defaultStat  description
  ─────────────  ───────────────  ───────────  ──────────────────────────────────────────────────────────────────
  hunting        locate_prey      WIS          Hunter rolls to detect prey in the location

  actionType     codeName         defaultStat  description
  ─────────────  ───────────────  ───────────  ──────────────────────────────────────────────────────────────────
  border_patrol  patrol_start     WIS          

  actionType     codeName         defaultStat  description
  ─────────────  ───────────────  ───────────  ──────────────────────────────────────────────────────────────────
  foraging       locate_plants    WIS          
  foraging       locate_items     WIS          

  actionType     codeName         defaultStat  description
  ─────────────  ───────────────  ───────────  ──────────────────────────────────────────────────────────────────
  border_patrol  patrol_start     WIS          

  actionType     codeName         defaultStat  description
  ─────────────  ───────────────  ───────────  ──────────────────────────────────────────────────────────────────
  treat          treat_patient    INT          
  diagnose       diagnose_patient INT          

──────────────────────────────────────────────
Species_ActionStep                      [ DONE ]
──────────────────────────────────────────────
Engine-defined lookup table of prey-side step types. Same role as CraftingInteraction —
a global slug list the engine dispatches on. Guilds connect their species to these steps
and assign proficiency/stat via Guild_Species_ActionStep_Config.

  codeName          defaultStat  description
  ────────────────  ───────────  ──────────────────────────────────────────
  avoid             DEX          Prey rolls to avoid being noticed
  counter_avoid     DEX          Hunter rolls to find this specific prey
  escape            DEX          Prey rolls to outpace the pursuer
  counter_escape    DEX          Hunter rolls to successfully counter the prey's escape attempt
