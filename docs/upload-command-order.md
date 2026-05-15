UPLOAD COMMAND ORDER
====================
Tracks all /model Discord commands, what they seed, and the order they must
be run when initializing a new guild. Follow this order — later commands
depend on earlier ones being present.

Legend:
  [x]  Command built and working
  [ ]  Command not yet built


═══════════════════════════════════════════════════════════════════════
PHASE 2 — GUILD CONFIGURATION
Run these before any game content. They define the rules everything else
references (env modifiers, proficiency definitions, etc.).
═══════════════════════════════════════════════════════════════════════

[x]  /model envconditions
     Seeds:   EnvCondition_Modifier, EnvCondition_StatModifier,
              EnvCondition_ProficiencyModifier
     Depends: nothing (references global EnvCondition lookup table)
     Subcommands: upload, upload-sheet, template, download, reset

[x]  /model proficiencies
     Seeds:   ProficiencyDef
     Depends: nothing
     Subcommands: upload, upload-sheet, template, reset


═══════════════════════════════════════════════════════════════════════
PHASE 3 — WEATHER SYSTEM
Self-contained within the guild. Referenced by species, events, and
environmental systems. Can be seeded in any order among themselves.
═══════════════════════════════════════════════════════════════════════

[x]  /model weatherstate
     Seeds:   WeatherState
     Depends: nothing
     Subcommands: upload, upload-sheet, template, download, reset

[x]  /model weatherpattern
     Seeds:   WeatherPattern, WeatherPatternStep,
              WeatherPatternStep_SeasonWeight
     Depends: WeatherState (from /model weatherstate)
     Subcommands: upload, upload-sheet, template, download, reset


═══════════════════════════════════════════════════════════════════════
PHASE 4 — CORE GAME CONTENT
Seed in strict order. Each step depends on the previous ones.
═══════════════════════════════════════════════════════════════════════

Step 1 — Conditions
────────────────────────────────────────────────────────────────────
[ ]  /model conditions
     Seeds:   ConditionDef, ConditionDef_StatEffect,
              ConditionDef_ProficiencyEffect, ConditionDef_DamageModifier,
              ConditionDef_CombatEffect, ConditionDef_CombatStatEffect,
              ConditionDef_EnvRule, ConditionDef_SymptomTag,
              ConditionDef_Link, ConditionBehaviorEffect
     Depends: ProficiencyDef (Phase 2), EnvCondition_Modifier (Phase 2)
     Note:    ConditionDef_GrantedItem is excluded from the first pass —
              re-upload this command after Step 5 (Consumables) to add
              granted-item links if your conditions require them.
     Subcommands: upload, upload-sheet, template, reset


Step 2 — Drop Items (raw prey/plant drops, raw materials)
────────────────────────────────────────────────────────────────────
[ ]  /model items upload-drops
     Seeds:   Item, Item_Type, ItemFoodProfile,
              ItemConditionEffect (links items to existing conditions)
     Depends: ConditionDef (Step 1)
     Note:    Items that exist in drop tables and food sources.
              No equipment or action tabs.
     Subcommands: upload-drops, upload-sheet-drops, template-drops, reset


Step 3 — Gear (equipment: natural weapons, armor, tools)
────────────────────────────────────────────────────────────────────
[ ]  /model items upload-gear
     Seeds:   Item, Item_Type, ItemEquipmentProfile,
              ItemConditionEffect
     Depends: ConditionDef (Step 1)
     Note:    Natural weapons and species default loadout items must
              exist here before species can be seeded.
     Subcommands: upload-gear, upload-sheet-gear, template-gear, reset


Step 4 — Species
────────────────────────────────────────────────────────────────────
[ ]  /model species
     Seeds:   Species, Species_SpeciesType, Species_Biome,
              Species_EnvConditionEffect, Species_EquipmentLoadout
     Depends: Items/gear (Step 3) for equipment loadouts and natural
              weapons. Drop items (Step 2) for loot tables.
              EnvCondition_Modifier (Phase 2).
     Subcommands: upload, upload-sheet, template, reset


Step 5 — Consumables (potions, food items with use actions)
────────────────────────────────────────────────────────────────────
[ ]  /model items upload-consumables
     Seeds:   Item, Item_Type, ItemAction, ItemEffect (symptom-based),
              ItemConditionEffect
     Depends: ConditionDef (Step 1) for condition links.
              Species (Step 4) optional, for species-scoped effects.
     Note:    After this step, re-upload conditions if you need to add
              ConditionDef_GrantedItem links (see Step 1 note).
     Subcommands: upload-consumables, upload-sheet-consumables,
                  template-consumables, reset


Step 6 — Action Configs
────────────────────────────────────────────────────────────────────
[ ]  /model actions
     Seeds:   ActionType step configs, Guild_ActionStep_Config,
              Guild_Species_ActionStep_Config
     Depends: Species (Step 4), ProficiencyDef (Phase 2)
     Subcommands: upload, upload-sheet, template, reset


═══════════════════════════════════════════════════════════════════════
FUTURE / NOT YET PLANNED
Depends on all of Phase 4 being complete.
═══════════════════════════════════════════════════════════════════════

[ ]  /model combateffects
     Seeds:   CombatStatEffectDef, CombatStatEffectDef_StatMod,
              CombatStatEffectDef_RollMod, CombatStatEffectDef_AcMod,
              CombatStatEffectDef_DamageOverTime, CombatStatEffectDef_HealOverTime,
              CombatStatEffectDef_DamageModifier, CombatStatEffectDef_RollAdvantage
     Depends: TBD — likely conditions and species

[ ]  /model recipes
     Seeds:   Recipe, RecipeSlot, RecipeSlotOption, RecipeOutput
              and their sub-tables
     Depends: Items (all phases), Species (Step 4)

[ ]  /model plants
     Seeds:   PlantDef and growth/biome/trait sub-tables
     Depends: Items (drop items, Step 2), EnvCondition_Modifier (Phase 2)

[ ]  /model droptables
     Seeds:   DropTable, DropTable_Entry
     Depends: Items (Steps 2–5), Species (Step 4)

[ ]  Bulk folder upload
     Description: Pass a Google Drive folder link; bot discovers sheets
                  by naming convention and runs all applicable commands
                  in seeding order automatically.
     Depends: All individual upload commands above being complete.
