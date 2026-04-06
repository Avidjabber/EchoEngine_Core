ABILITY SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-06

This file is the authoritative reference for how abilities work in EchoPaw.
Read this before touching any ability seeding, species defaults, or skill tree code.


─────────────────────────────────────────────
1. WHAT ARE ABILITIES?
─────────────────────────────────────────────

Abilities are passive or active effects attached to entities. They are the
mechanical output of species identity, discipline progression, equipped items,
and events. An ability definition (AbilityDef) describes what the ability does;
Entity_Ability records that a specific entity currently has it and why.

Abilities are NOT conditions. Conditions have ticks, rolls, progression values,
and treatment. Abilities are static grants — they are either active or not.

Abilities are guild-extensible: guildId = "global" for seeded defaults (species
traits, base skill tree nodes); guilds may define their own.

AbilityDef.maxInstances (default 1) caps how many active Entity_Ability rows an
entity may have for this def simultaneously, regardless of source. If an entity
would receive an ability that is already at its cap, the grant is silently skipped.
Set maxInstances > 1 only for abilities that are explicitly designed to stack —
most abilities should stay at 1.


─────────────────────────────────────────────
2. SOURCES
─────────────────────────────────────────────

Every Entity_Ability row carries a sourceType and optional sourceId so the
system knows why an entity has the ability and can remove it correctly.

  sourceType    │ sourceId points to       │ When removed
  ──────────────┼──────────────────────────┼──────────────────────────────────
  species       │ speciesId                │ Never (inherent to species)
  skill_tree    │ skill tree node id       │ Never (permanently earned)
  item          │ itemId (equipped item)   │ When item is unequipped
  event         │ eventDefId or activeEventId │ When event ends or grants expire


─────────────────────────────────────────────
3. SPECIES-INHERENT ABILITIES
─────────────────────────────────────────────

Species_DefaultAbility defines which AbilityDef rows are granted to every
entity of that species at creation. The app creates one Entity_Ability row per
entry with sourceType = "species".

Examples: Night Vision, Poison Immunity, Aquatic Movement.

NOTE: The legacy "Trait" ConditionType served this purpose previously. New
inherent species traits should use Species_DefaultAbility, not Trait conditions.


─────────────────────────────────────────────
4. EFFECT TABLES
─────────────────────────────────────────────

One AbilityDef can have rows in any combination of the seven effect tables.
All effects on the ability are active simultaneously while the entity holds it.

─────────────────────────────────────────────
4a. Ability_StatModifier
─────────────────────────────────────────────

Flat bonus or penalty to a base stat.

  statId    — FK → Stat. Which stat is modified.
  value     — positive = bonus, negative = penalty
  context   — situational key; null = always applies
              e.g. "dodge" = only applies when resolving dodge rolls
                   "attack" = only applies on attack rolls
  biomeId        — FK → Biome. Only active in this biome; null = all biomes.
  weatherStateId — FK → WeatherState. Only active during this weather state; null = all weather.

─────────────────────────────────────────────
4b. Ability_ProficiencyModifier
─────────────────────────────────────────────

Flat bonus to a specific proficiency check roll.

  proficiencyDefId — FK → ProficiencyDef. Which proficiency is modified.
  value            — flat bonus added to the 1d20 roll
  hasAdvantage     — roll twice, take the higher result
  hasDisadvantage  — roll twice, take the lower result
  biomeId          — FK → Biome. Gate by biome; null = all biomes.
  weatherStateId   — FK → WeatherState. Gate by weather; null = all weather.

hasAdvantage and hasDisadvantage should not both be true; app layer enforces.

─────────────────────────────────────────────
4c. Ability_MultiplierEffect
─────────────────────────────────────────────

Multiplier applied to a rate or yield. 1.0 = no change, 1.2 = +20%, 0.8 = −20%.

  targetTypeId   — FK → AbilityTargetType. What is being multiplied (see table below).
  targetId       — narrows the target; null = applies to all of that type
  multiplier     — the scaling factor
  biomeId        — FK → Biome. Gate by biome; null = all biomes.
  weatherStateId — FK → WeatherState. Gate by weather; null = all weather.

  AbilityTargetType name   │ targetId means       │ Example
  ─────────────────────────┼──────────────────────┼──────────────────────────────
  discipline_xp            │ disciplineId         │ +20% Farming XP
  drop_herb                │ —                    │ +30% herb gather yield
  drop_prey                │ —                    │ +15% prey hunt yield
  drop_forage              │ —                    │ +10% general forage yield
  crafting_yield           │ —                    │ +1 output on crafted items
  crafting_quality         │ —                    │ higher quality tier on craft
  recovery_rate            │ conditionTypeId?     │ passive condition recovery faster
  energy_cost              │ actionTypeId         │ −20% energy cost for patrols
  treatment_given          │ —                    │ +25% effectiveness when treating
  treatment_received       │ —                    │ +25% effectiveness of treatment received
  construction_speed       │ structureTypeId?     │ +20% construction progress per action
  faction_rep_gain         │ factionId?           │ +15% rep from all rep-granting actions
  scouting_range           │ —                    │ wider patrol/territory detection radius
  healing_received         │ —                    │ +40% HP restored from all healing sources
  healing_given            │ —                    │ +40% HP restored when healing others

─────────────────────────────────────────────
4d. Ability_GrantedAction
─────────────────────────────────────────────

Grants access to an item's actions without the item being in inventory.
Routes through the item system — the item defines the action; the ability
grants access to it. Mirrors ConditionDef_GrantedItem.

  itemId                — FK → Item. The item whose actions become available.
  grantedToSource       — false = granted to ability holder
                          true  = granted to Entity_Ability.sourceId entity
  usesPerGrant          — total uses while this ability is active; null = unlimited
  usageContext          — when the action is available:
                            "any"               — usable in and out of combat (default)
                            "combat_only"       — only during an active combat instance
                            "out_of_combat_only"— only when not in combat
  outOfCombatDailyLimit — max uses per day when used outside combat; null = limited
                          only by energy. Has no effect when usageContext = "combat_only".

Examples: Combat level 5 unlocks "Precision Strike" (combat_only).
          Night Vision grants "Scout in Darkness" action (any).
          Healing spell grants "Mend" (any, outOfCombatDailyLimit = 2).

─────────────────────────────────────────────
4e. Ability_CombatBehavior
─────────────────────────────────────────────

Modifies how combat actions are processed. Mirrors ConditionBehaviorEffect.

  perspective    — "outgoing" (actions BY holder) or "incoming" (actions AT holder)
  behaviorTypeId — FK → ConditionBehaviorType. redirect | cancel | bias | restrict
  actionTypeId   — FK → ItemActionType. Which action type is affected; null = all.
  triggerChance  — probability this behavior fires (1.0 = always, 0.5 = 50%)

  redirect:  redirectTargetId (FK → BehaviorRedirectTarget), triggerChance
  cancel:    triggerChance (e.g. Parry — chance to cancel incoming attack)
  bias:      redirectTargetId, biasWeight (positive = toward, negative = away)
  restrict:  restrictActionTypeId (FK → ItemActionType), restrictIsBlock
               false = entity may ONLY use this action type
               true  = entity may NOT use this action type

─────────────────────────────────────────────
4f. Ability_ConditionResistance
─────────────────────────────────────────────

Resistance or immunity to a condition or an entire condition type.

  conditionDefId  — FK → ConditionDef. Target a specific condition (e.g. GreenCough).
  conditionTypeId — FK → ConditionType. Target a whole type (e.g. all Progressive conditions).
  resistDcBonus   — CON roll bonus when resisting; null when isImmune = true
  isImmune        — true = entity can never receive this condition

Use conditionDefId for specific resistances, conditionTypeId for broad immunity.

─────────────────────────────────────────────
4g. Ability_DamageModifier
─────────────────────────────────────────────

Modifies damage taken or dealt for a specific damage type.

  damageTypeId — FK → DamageType. Which damage type.
  modifier     — 1.0 = normal, 0.5 = resistance (half), 2.0 = vulnerability (double)
  isImmune     — true = no damage of this type; overrides modifier

─────────────────────────────────────────────
4h. Ability_ActionTrigger
─────────────────────────────────────────────

Fires an effect when the entity performs a specific action type. Unlike the other
effect tables (which are passive and always-on), these effects are event-driven —
they activate on action resolution.

One ability can have multiple Ability_ActionTrigger rows for different actions or
different effects on the same action.

  triggerSystemType   String        FK → ActionSystemType. The action that fires this trigger.
  targetScopeId       Int           FK → TargetScope (isAbilityTarget = true). Who receives the effect:
                                      "self"                — the performing entity
                                      "action_target"       — the direct target of the action
                                                              (a plot for farming, an entity for
                                                              combat/social actions)
                                      "action_participants" — all entities in the action instance
                                      "area"                — all valid targets at the camp or location
  triggerOnId         Int           FK → TriggerTiming. When the trigger fires:
                                      "completion" — on action completion regardless of outcome (default)
                                      "success"    — only on a successful outcome
                                      "failure"    — only on a failed outcome
  triggerChance       Float         0.0–1.0. Probability the trigger fires each time. Default 1.0.
  abilityEffectTypeId Int           FK → AbilityEffectType. What kind of effect to apply:
                                      "plot_buff"       — writes a Plot_Buff on the target plot(s)
                                      "condition_grant" — applies a ConditionDef to a target entity
                                      "energy_restore"  — restores energy to a target entity
                                      "double_output"   — duplicates the full recipe output at no
                                                          extra cost; only valid for crafting actions
                                      "xp_grant"        — awards bonus discipline XP to the performing
                                                          entity
  stackBehaviorId     Int           FK → StackBehavior. How multiple applications interact:
                                      "refresh" — updates/extends an existing effect (default)
                                      "stack"   — applies additively on top of existing effect
                                      "ignore"  — does not apply if the effect is already present

  Effect-specific fields (null when not applicable to the abilityEffectType):

  abilityEffectType = "plot_buff":
    effectTypeId    Int?   FK → EffectType (growth_rate | yield | decay_resistance, etc.)
    effectValue     Float? Delta applied to the plot buff.
    durationHours   Int?   How long the buff lasts before expiring.

  abilityEffectType = "condition_grant":
    conditionDefId  Int?   FK → ConditionDef. The condition applied to the target entity.
                           Duration, ticks, stat effects, and all other behaviour are
                           defined on the ConditionDef — no extra fields needed here.

  abilityEffectType = "energy_restore":
    energyAmount    Float? Amount restored. Capped at entity's max energy.

  abilityEffectType = "double_output":
    No extra fields. The entire recipe output is duplicated once on trigger.
    triggerChance governs the probability per craft. Only valid when
    triggerSystemType is a crafting action.

  abilityEffectType = "xp_grant":
    disciplineDefId Int?   FK → DisciplineDef. Which discipline receives the XP.
    xpAmount        Int?   Flat XP awarded when the trigger fires.

EXAMPLE — Farming skill tree, two tiers of the same watering buff:
  "Green Thumb I"  (Farming level 3, SkillTreeNode):
    triggerSystemType   = "farming_water"
    targetScopeId       → "action_target"
    triggerOnId         → "completion"
    triggerChance       = 0.3
    abilityEffectTypeId → "plot_buff"
    effectTypeId        → "growth_rate"
    effectValue         = 0.2
    durationHours       = 24
    stackBehaviorId     → "refresh"

  "Green Thumb II"  (Farming level 6, SkillTreeNode):
    Same as above but triggerChance = 0.6


─────────────────────────────────────────────
4i. Ability_ThresholdTrigger
─────────────────────────────────────────────

Fires a condition grant when a tracked entity value crosses a defined threshold.
Checked after any event that changes the relevant value (damage taken, healing,
eating, drinking). If the threshold is newly crossed and the condition is not
already active on the entity, the trigger fires.

  thresholdTypeId Int     FK → AbilityThresholdType. Which value to watch:
                            "hp"         — current HP as a fraction of max HP
                            "nutrition"  — current nutrition as a fraction of max
                            "hydration"  — current hydration as a fraction of max

  thresholdValue  Float   The crossing point (0.0–1.0).
                            e.g. 0.3 = triggers when the value reaches 30% or below

  thresholdBelow  Boolean Fires when value drops to or below thresholdValue. Default true.
  thresholdAbove  Boolean Fires when value rises to or above thresholdValue. Default false.
                          Both can be true to gate on a range (fires when value exits
                          the range on either side).

  conditionDefId  Int     FK → ConditionDef. The condition granted when the trigger fires.
                          The condition can be combat-scoped (combatInstancedOnly = true)
                          or permanent — whatever is defined on the ConditionDef.
                          All stat changes, damage modifiers, and other effects are
                          defined on the ConditionDef; nothing is stored here.

  stackBehaviorId Int     FK → StackBehavior. "refresh" | "stack" | "ignore" — what happens
                          if the condition is already active on the entity when the trigger fires.

EXAMPLE — "Berserker Rage" (Combat skill tree node):
  thresholdTypeId → "hp"
  thresholdValue  = 0.3
  thresholdBelow  = true
  thresholdAbove  = false
  conditionDefId  = <BerserkerRage condition>   (combatInstancedOnly = true, grants
                                                  +4 attack damage until combat ends)
  stackBehaviorId → "ignore"   (don't reapply if already raging)

EXAMPLE — "Drought Adaptation" (species trait):
  thresholdTypeId → "hydration"
  thresholdValue  = 0.2
  thresholdBelow  = true
  thresholdAbove  = false
  conditionDefId  = <DroughtAdaptation condition>   (permanent, grants CON +2 and
                                                      reduced hydration drain while active)
  stackBehaviorId → "ignore"


─────────────────────────────────────────────
4j. Ability_PresenceEffect
─────────────────────────────────────────────

Always-on passive effects that activate based on the entity's housing assignment.
Unlike Ability_ActionTrigger (which fires on action completion), presence effects
are evaluated once per day for each valid target in scope.

  presenceScopeId      Int   FK → TargetScope (isPresenceScope = true). Who or what is targeted:
                               "housing_structure"  — the structure the entity is housed in
                               "housing_plots"      — each active plot in the housing structure
                               "colocated_entities" — each entity sharing the same housing structure
                               "colocated_patients" — each entity with an active condition in the
                                                      same housing structure
                               "camp_entities"      — each entity in the same camp
                               "camp_structures"    — each filth-participating structure in the camp

  triggerChance        Float  0.0–1.0. Per-target daily roll. Each target in scope is
                              evaluated independently — 0.5 means each entity, plot, or
                              structure has a 50% chance of receiving the effect that day.
                              1.0 = guaranteed for every target in scope.

  abilityEffectTypeId  Int   FK → AbilityEffectType. What kind of effect to apply:
                               "condition_grant" — applies a ConditionDef to the target entity.
                                                  Valid scopes: colocated_entities,
                                                  colocated_patients, camp_entities.
                               "multiplier"      — applies a rate/yield multiplier to the target
                                                  entity, using the same AbilityTargetType vocabulary
                                                  as Ability_MultiplierEffect (recovery_rate,
                                                  treatment_received, discipline_xp, etc.).
                                                  Valid scopes: colocated_entities,
                                                  colocated_patients, camp_entities.
                               "structure_buff"  — modifies a property of the target structure
                                                  (growth_rate, rot_modifier, filth_reduction,
                                                  damage_resistance, etc.).
                                                  Valid scopes: housing_structure, camp_structures.
                               "plot_buff"       — writes a Plot_Buff on the target plot.
                                                  Valid scopes: housing_plots.

  stackBehaviorId      Int   FK → StackBehavior. How multiple applications interact:
                               "refresh" — updates/extends an existing effect (default)
                               "stack"   — applies additively on top of existing effect
                               "ignore"  — does not apply if the effect is already present

  Effect-specific fields (null when not applicable):

  abilityEffectType = "condition_grant":
    conditionDefId         Int?   FK → ConditionDef. The condition applied to the target entity.

  abilityEffectType = "multiplier":
    multiplierTargetTypeId Int?   FK → AbilityTargetType. The rate/yield being multiplied
                                  (recovery_rate, treatment_received, discipline_xp, etc.)
    multiplierValue        Float? The scaling factor. 1.2 = +20%, 0.8 = −20%.
    multiplierId           Int?   Narrows the target (e.g. a specific disciplineId); null = all.

  abilityEffectType = "structure_buff" or "plot_buff":
    effectTypeId   Int?   FK → EffectType. The property being modified
                          (growth_rate, rot_modifier, filth_reduction, yield, decay_resistance, etc.)
    effectValue    Float? Delta applied to the property.
    durationHours  Int?   How long the buff lasts (plot_buff only; structure_buff is persistent).

  If the target does not exist (no plots in the structure, no patients present,
  no structures in camp, etc.) the effect does nothing — no error, no activation.

EXAMPLE — Combat skill tree, "Inspiring Presence":
  presenceScopeId     → "colocated_entities"
  triggerChance       = 0.25
  abilityEffectTypeId → "condition_grant"
  conditionDefId      = <combat_focus condition>   (grants hit chance bonus, short duration)
  stackBehaviorId     → "refresh"

EXAMPLE — Farming skill tree, "Green Aura":
  presenceScopeId     → "housing_plots"
  triggerChance       = 0.5
  abilityEffectTypeId → "plot_buff"
  effectTypeId        → "growth_rate"
  effectValue         = 0.1
  durationHours       = 24
  stackBehaviorId     → "refresh"

EXAMPLE — Healing skill tree, "Restorative Presence":
  presenceScopeId     → "colocated_patients"
  triggerChance       = 0.6
  abilityEffectTypeId → "multiplier"
  multiplierTargetTypeId → "recovery_rate"
  multiplierValue     = 1.25
  stackBehaviorId     → "refresh"


─────────────────────────────────────────────
5. CONTEXT GATES
─────────────────────────────────────────────

Context gates live on individual effect rows, not on AbilityDef. This means
a single ability can have different effects in different environments or states.
All gates are independently optional — any combination may be set on one row.

ENVIRONMENT GATES (biomeId / weatherStateId)
─────────────────────────────────────────────
  biomeId        — FK → Biome. Only active when the entity is in this biome; null = all biomes.
  weatherStateId — FK → WeatherState. Only active during this weather state; null = all weather.

  Example — "Aquatic" species ability:
    Ability_StatModifier  DEX +4  biomeId → River   (faster in water)
    Ability_StatModifier  CON +2  biomeId → River   (endurance boost in water)
    Ability_StatModifier  DEX −2  biomeId → Desert  (sluggish in dry heat)

ENTITY STATE GATES (valueThresholdMin / valueThresholdMax)
───────────────────────────────────────────────────────────
Available on all passive effect tables (StatModifier, ProficiencyModifier,
MultiplierEffect, CombatBehavior, DamageModifier). Both values are fractions
of the entity's current maximum (0.0–1.0). Null = no gate on that axis.

The "relevant tracked value" is determined by context — for most gates this
means the entity's HP, nutrition, or hydration fraction. Use the pair together
to express a range, or use only one side for a floor/ceiling gate.

  valueThresholdMin — only active when the relevant tracked value fraction >= this
                      e.g. 0.5 = "only when at half health or above"
  valueThresholdMax — only active when the relevant tracked value fraction <= this
                      e.g. 0.3 = "only when at 30% or below" (berserker rage, starvation)

  Example — "Berserker Rage":
    Ability_StatModifier  STR +4  context = "attack"  valueThresholdMax = 0.3
    Ability_StatModifier  CON +2                      valueThresholdMax = 0.3

  Example — "Survival Instinct":
    Ability_ProficiencyModifier  Perception +3  valueThresholdMax = 0.2


─────────────────────────────────────────────
6. SCHEMA SUMMARY
─────────────────────────────────────────────

  AbilityDef                 — definition; guild-extensible
  Entity_Ability             — per-entity active ability with source tracking
  Species_DefaultAbility     — abilities granted at entity creation by species
  SkillTreeNode              — guild-defined node; links discipline level → AbilityDef
  SkillTreeNode_Relation     — REQUIRES / BLOCKS / UPGRADES edges between nodes
  Entity_SkillTreeNode       — records which nodes an entity has obtained

  Ability_StatModifier        — stat bonuses/penalties with optional context/environment/state gates
  Ability_ProficiencyModifier — proficiency roll bonuses with optional gates
  Ability_MultiplierEffect    — rate/yield multipliers with optional gates
  Ability_GrantedAction       — unlocked item actions
  Ability_CombatBehavior      — combat behavior intercepts
  Ability_ConditionResistance — condition resistance/immunity
  Ability_DamageModifier      — damage type modifiers
  Ability_ActionTrigger       — action-triggered effects: plot buffs, condition grants, energy restore, xp grants
  Ability_ThresholdTrigger    — condition grant fired when HP/nutrition/hydration crosses a threshold
  Ability_PresenceEffect      — daily housing-based passive effects: condition grants, multipliers, structure/plot buffs

  Lookup tables (seeded):
  AbilityEffectType           — effect categories for ActionTrigger and PresenceEffect
  AbilityTargetType           — multiplier target categories for MultiplierEffect and PresenceEffect
  AbilityThresholdType        — tracked value types for ThresholdTrigger (hp, nutrition, hydration)
  TargetScope                 — target/scope values for ActionTrigger and PresenceEffect
  TriggerTiming               — when an ActionTrigger fires (completion, success, failure)
  StackBehavior               — how multiple applications interact (refresh, stack, ignore)


─────────────────────────────────────────────
7. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Conditions  — dynamic health/combat states with ticks and progression.
                Abilities are static grants with no progression value.

  Disciplines — track XP and level. SkillTreeNode rows (guild-defined) grant
                AbilityDef entries when an entity reaches the required level.
                See discipline-system.md for node lifecycle and schema.

  Stats       — stat points (earned via EXP) are spendable on skill tree nodes
                (statPointCost > 0) or on raw proficiency bonuses
                (Entity_Proficiency.bonus). Entities choose how to spend them.

  Species     — Species_DefaultAbility replaces legacy "Trait" conditions for
                inherent species traits.

  Farming     — Ability_ActionTrigger with targetScope = "action_target" and
                abilityEffectType = "plot_buff" is how farming skill tree nodes
                write Plot_Buff rows on tended plots. triggerChance naturally
                expresses skill progression — higher-tier nodes grant higher
                chance variants. See farming-system.md for Plot_Buff and
                PlotCrop_TendRecord details.

  Actions     — Ability_ActionTrigger.triggerSystemType links to ActionSystemType.
                Any action systemType can be a trigger — farming, combat, scouting, etc.
