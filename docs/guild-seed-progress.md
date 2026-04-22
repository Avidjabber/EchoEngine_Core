GUILD SEED PROGRESS
===================
Tracks per-phase seeding status for guild initialization.
Global/static tables are handled by seed.ts and are not listed here.

Legend:
  [ ]  Not started
  [~]  In progress
  [x]  Done


═══════════════════════════════════════════════════════════════════════
PHASE 1 — GUILD INITIALIZATION
═══════════════════════════════════════════════════════════════════════

  [x]  EchoDens
  [x]  GuildSettings


═══════════════════════════════════════════════════════════════════════
PHASE 2 — GUILD CONFIGURATION
(rules and tuning; must exist before any content references them)
═══════════════════════════════════════════════════════════════════════

  [ ]  Guild_DisciplineLevelCap
  [ ]  EnvCondition_Modifier
  [ ]  EnvCondition_StatModifier
  [ ]  EnvCondition_ProficiencyModifier
  [ ]  Guild_ActionConfig
  [ ]  ActionType_DisciplineReward
  [ ]  ActionType_DisciplineRequirement
  [ ]  Guild_ActionStep_Config
  [ ]  Guild_CraftingInteractionConfig


═══════════════════════════════════════════════════════════════════════
PHASE 3 — FOUNDATIONAL DEFINITIONS
(self-contained within the guild; referenced by later phases)
═══════════════════════════════════════════════════════════════════════

  [ ]  WeatherState
  [ ]  WeatherPattern
  [ ]  WeatherPatternStep
  [ ]  GuildSeason_DefaultWeather
  [ ]  Guild_WeatherPatternCooldown

  [ ]  ProficiencyDef

  [ ]  PlotType
  [ ]  PlotType_EnvCondition


═══════════════════════════════════════════════════════════════════════
PHASE 4 — CORE GAME CONTENT
(seed in order — later rows in this phase depend on earlier ones)
═══════════════════════════════════════════════════════════════════════

  ── Conditions ──────────────────────────────────────────────────────
  [ ]  ConditionDef
  [ ]  ConditionDef_StatEffect
  [ ]  ConditionDef_ProficiencyEffect
  [ ]  ConditionDef_DamageModifier
  [ ]  ConditionDef_CombatEffect
  [ ]  ConditionDef_CombatStatEffect
  [ ]  ConditionDef_EnvRule
  [ ]  ConditionDef_SymptomTag
  [ ]  ConditionDef_GrantedItem
  [ ]  ConditionDef_Link
  [ ]  ConditionBehaviorEffect

  ── Combat stat effects ─────────────────────────────────────────────
  [ ]  CombatStatEffectDef
  [ ]  CombatStatEffectDef_StatMod
  [ ]  CombatStatEffectDef_RollMod
  [ ]  CombatStatEffectDef_AcMod
  [ ]  CombatStatEffectDef_DamageOverTime
  [ ]  CombatStatEffectDef_HealOverTime
  [ ]  CombatStatEffectDef_DamageModifier
  [ ]  CombatStatEffectDef_RollAdvantage

  ── Items ────────────────────────────────────────────────────────────
  [ ]  Item
  [ ]  Item_Type
  [ ]  Item_IngredientType
  [ ]  Item_CompostOutput
  [ ]  ItemWarning
  [ ]  Item_Warning
  [ ]  ItemEquipmentProfile
  [ ]  ItemEquipmentProfile_Condition
  [ ]  ItemEquipmentProfile_RequiredItem
  [ ]  ItemEquipmentProfile_StatEffect
  [ ]  ItemFoodProfile
  [ ]  ItemAction
  [ ]  ItemAction_Output
  [ ]  ItemEffect
  [ ]  ItemConditionEffect

  ── Plants ───────────────────────────────────────────────────────────
  [ ]  PlantDef
  [ ]  PlantDef_PlantType
  [ ]  PlantDef_Biome
  [ ]  PlantDef_EnvConditionEffect
  [ ]  PlantDef_Trait
  [ ]  PlantDef_GrowthStage
  [ ]  PlantDef_PlotType

  ── Drop tables ──────────────────────────────────────────────────────
  [ ]  DropTable
  [ ]  DropTable_Entry

  ── Ranks ────────────────────────────────────────────────────────────
  [ ]  Rank

  ── Abilities ────────────────────────────────────────────────────────
  [ ]  AbilityDef
  [ ]  Ability_StatModifier
  [ ]  Ability_ProficiencyModifier
  [ ]  Ability_MultiplierEffect
  [ ]  Ability_GrantedAction
  [ ]  Ability_CombatBehavior
  [ ]  Ability_ConditionResistance
  [ ]  Ability_DamageModifier
  [ ]  Ability_ActionTrigger
  [ ]  Ability_ThresholdTrigger
  [ ]  Ability_PresenceEffect

  ── Skill tree ───────────────────────────────────────────────────────
  [ ]  SkillTreeNode
  [ ]  SkillTreeNode_Relation
  [ ]  SkillTreeNode_DisciplineRequirement

  ── Species ──────────────────────────────────────────────────────────
  [ ]  Species
  [ ]  Species_SpeciesType
  [ ]  Species_Biome
  [ ]  Species_EnvConditionEffect
  [ ]  Species_EquipmentLoadout

  ── Recipes ──────────────────────────────────────────────────────────
  [ ]  Recipe
  [ ]  Recipe_DisciplineReward
  [ ]  Recipe_CraftingRequirement
  [ ]  RecipeSlot
  [ ]  RecipeSlotOption
  [ ]  RecipeSlotOption_RequiredTag
  [ ]  RecipeSlotOption_ExcludedTag
  [ ]  RecipeOutput
  [ ]  RecipeOutput_AddTag
  [ ]  RecipeOutput_RemoveTag
  [ ]  RecipeOutput_FoodOverride


═══════════════════════════════════════════════════════════════════════
PHASE 5 — SPECIES LINKS
(require Phase 4 species + abilities + items to exist)
═══════════════════════════════════════════════════════════════════════

  [ ]  Species_DefaultAbility
  [ ]  SpeciesCombatBehavior
  [ ]  SpeciesDefaultLoadout
  [ ]  Guild_Species_ActionStep_Config


═══════════════════════════════════════════════════════════════════════
PHASE 6 — WORLD STRUCTURES
═══════════════════════════════════════════════════════════════════════

  ── Factions & ranks ─────────────────────────────────────────────────
  [ ]  Faction
  [ ]  FactionStanding
  [ ]  Rank_Faction
  [ ]  Rank_DefaultItem

  ── Locations ────────────────────────────────────────────────────────
  [ ]  Location
  [ ]  Location_Biome
  [ ]  Location_Faction
  [ ]  Location_EnvCondition

  ── Biome drops ──────────────────────────────────────────────────────
  [ ]  Guild_BiomeDrop

  ── Structure definitions ────────────────────────────────────────────
  [ ]  StructureDef
  [ ]  StructureDef_StructureType
  [ ]  StructureDef_StorageConfig
  [ ]  StructureDef_FarmingConfig
  [ ]  StructureDef_HousingConfig
  [ ]  StructureDef_MedicalConfig
  [ ]  StructureDef_CraftingConfig
  [ ]  StructureDef_CraftingConfig_Interaction
  [ ]  StructureDef_CompostConfig
  [ ]  StructureDef_ProductionConfig
  [ ]  StructureDef_ProductionConfig_EnvCondition
  [ ]  StructureDef_ProductionInput
  [ ]  StructureDef_ProductionOutput
  [ ]  StructureDef_FuelConfig
  [ ]  StructureDef_FuelConfig_EnvCondition
  [ ]  StructureDef_FuelConfig_InputFuelType
  [ ]  StructureDef_FuelConfig_OutputFuelType
  [ ]  StructureDef_WorkSlotConfig
  [ ]  StructureDef_WorkSlotConfig_Requirement
  [ ]  StructureDef_BuildCost
  [ ]  StructureDef_CampRequirement
  [ ]  StructureDef_Relation
  [ ]  StructureDef_AcceptedFuelType

  ── Structure upgrades ───────────────────────────────────────────────
  [ ]  StructureDef_Upgrade
  [ ]  StructureDef_Upgrade_Effect
  [ ]  StructureDef_Upgrade_BuildCost
  [ ]  StructureDef_Upgrade_Relation
  [ ]  StructureDef_Upgrade_AcceptedFuelType
  [ ]  StructureDef_Upgrade_CraftingInteraction

  ── Crafting rules ───────────────────────────────────────────────────
  [ ]  Guild_CraftingInteractionRule


═══════════════════════════════════════════════════════════════════════
PHASE 7 — EVENTS
(depends on almost everything above)
═══════════════════════════════════════════════════════════════════════

  [ ]  EventDef
  [ ]  EventDef_TriggerType
  [ ]  EventDef_WeatherTrigger
  [ ]  EventDef_ActionType
  [ ]  EventDef_ThresholdTrigger
  [ ]  EventDef_Prerequisite
  [ ]  EventDef_Location
  [ ]  EnvCondition_EventDef
  [ ]  EventStepDef
  [ ]  EventStepChoice
  [ ]  EventStepRandomBranch
  [ ]  EventEffect
  [ ]  EventWeightModifier
