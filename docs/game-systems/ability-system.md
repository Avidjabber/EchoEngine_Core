ABILITY SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-03

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

  statId    — which stat is modified
  value     — positive = bonus, negative = penalty
  context   — situational key; null = always applies
              e.g. "dodge" = only applies when resolving dodge rolls
                   "attack" = only applies on attack rolls
  biomeId        — only active when entity is in this biome; null = all biomes
  weatherStateId — only active during this weather state; null = all weather

─────────────────────────────────────────────
4b. Ability_ProficiencyModifier
─────────────────────────────────────────────

Flat bonus to a specific proficiency check roll.

  proficiencyDefId — which proficiency is modified
  value            — flat bonus added to the 1d20 roll
  hasAdvantage     — roll twice, take the higher result
  hasDisadvantage  — roll twice, take the lower result
  biomeId          — gate by biome; null = all biomes
  weatherStateId   — gate by weather; null = all weather

hasAdvantage and hasDisadvantage should not both be true; app layer enforces.

─────────────────────────────────────────────
4c. Ability_MultiplierEffect
─────────────────────────────────────────────

Multiplier applied to a rate or yield. 1.0 = no change, 1.2 = +20%, 0.8 = −20%.

  targetType     — what is being multiplied (see table below)
  targetId       — narrows the target; null = applies to all of that type
  multiplier     — the scaling factor
  biomeId        — gate by biome; null = all biomes
  weatherStateId — gate by weather; null = all weather

  targetType         │ targetId means       │ Example
  ───────────────────┼──────────────────────┼──────────────────────────────
  discipline_xp      │ disciplineId         │ +20% Farming XP
  drop_herb          │ —                    │ +30% herb gather yield
  drop_prey          │ —                    │ +15% prey hunt yield
  drop_forage        │ —                    │ +10% general forage yield
  crafting_yield     │ —                    │ +1 output on crafted items
  crafting_quality   │ —                    │ higher quality tier on craft
  recovery_rate      │ conditionTypeId?     │ passive condition recovery faster
  energy_cost        │ actionTypeId         │ −20% energy cost for patrols
  treatment_given    │ —                    │ +25% effectiveness when treating
  treatment_received │ —                    │ +25% effectiveness of treatment received

─────────────────────────────────────────────
4d. Ability_GrantedAction
─────────────────────────────────────────────

Grants access to an item's actions without the item being in inventory.
Routes through the item system — the item defines the action; the ability
grants access to it. Mirrors ConditionDef_GrantedItem.

  itemId          — the item whose actions become available
  grantedToSource — false = granted to ability holder
                    true  = granted to Entity_Ability.sourceId entity
  usesPerGrant    — max uses while this ability is active; null = unlimited

Examples: Combat level 5 unlocks "Precision Strike" (via item action).
          Night Vision grants "Scout in Darkness" action.

─────────────────────────────────────────────
4e. Ability_CombatBehavior
─────────────────────────────────────────────

Modifies how combat actions are processed. Mirrors ConditionBehaviorEffect.

  perspective    — "outgoing" (actions BY holder) or "incoming" (actions AT holder)
  behaviorTypeId — redirect | cancel | bias | restrict  (ConditionBehaviorType seed)
  actionTypeId   — which action type is affected; null = all action types
  triggerChance  — probability this behavior fires (1.0 = always, 0.5 = 50%)

  redirect:  redirectTargetId, triggerChance
  cancel:    triggerChance (e.g. Parry — chance to cancel incoming attack)
  bias:      redirectTargetId, biasWeight (positive = toward, negative = away)
  restrict:  restrictActionTypeId, restrictIsBlock
               false = entity may ONLY use this action type
               true  = entity may NOT use this action type

─────────────────────────────────────────────
4f. Ability_ConditionResistance
─────────────────────────────────────────────

Resistance or immunity to a condition or an entire condition type.

  conditionDefId  — target a specific condition (e.g. GreenCough)
  conditionTypeId — target a whole type (e.g. all Progressive conditions)
  resistDcBonus   — CON roll bonus when resisting; null when isImmune = true
  isImmune        — true = entity can never receive this condition

Use conditionDefId for specific resistances, conditionTypeId for broad immunity.

─────────────────────────────────────────────
4g. Ability_DamageModifier
─────────────────────────────────────────────

Modifies damage taken or dealt for a specific damage type.

  damageTypeId — which damage type
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

  triggerSystemType  String  FK → ActionSystemType. The action that fires this trigger.
  targetScope        String  Who receives the effect:
                               "self"                — the performing entity
                               "action_target"       — the direct target of the action
                                                       (a plot for farming, an entity for
                                                       combat/social actions)
                               "action_participants" — all entities in the action instance
                               "area"                — all valid targets at the camp or location
  triggerOn          String  When the trigger fires:
                               "completion" — on action completion regardless of outcome (default)
                               "success"    — only on a successful outcome
                               "failure"    — only on a failed outcome
  triggerChance      Float   0.0–1.0. Probability the trigger fires each time. Default 1.0.
                             Skill progression naturally expresses itself here — a tier-1
                             ability at 0.3, a tier-2 ability at 0.6, a mastery node at 1.0.
                             Higher-tier SkillTreeNodes grant higher-chance variants of the
                             same conceptual ability.
  effectType         String  What kind of effect to apply:
                               "plot_buff"      — writes a Plot_Buff on the target plot(s)
                               "stat_mod"       — temporary stat modifier on a target entity
                               "energy_restore" — restores energy to a target entity
                             Extensible — new effectTypes added as systems require them.
  stackBehavior      String  How multiple applications interact on the same target:
                               "refresh" — updates/extends an existing effect (default)
                               "stack"   — applies additively on top of existing effect
                               "ignore"  — does not apply if the effect is already present

  Effect-specific fields (null when not applicable to the effectType):

  effectType = "plot_buff":
    buffEffectType  String?  growth_rate | yield | decay_resistance
    effectValue     Float?   Delta applied to the plot buff.
    durationHours   Int?     How long the buff lasts before expiring.

  effectType = "stat_mod":
    statId          Int?     FK → Stat. Which stat is temporarily modified.
    statValue       Float?   Positive = bonus, negative = penalty.
    durationHours   Int?

  effectType = "energy_restore":
    energyAmount    Float?   Amount restored. Capped at entity's max energy.

EXAMPLE — Farming skill tree, two tiers of the same watering buff:
  "Green Thumb I"  (Farming level 3, SkillTreeNode):
    triggerSystemType = "farming_water"
    targetScope       = "action_target"
    triggerOn         = "completion"
    triggerChance     = 0.3
    effectType        = "plot_buff"
    buffEffectType    = "growth_rate"
    effectValue       = 0.2
    durationHours     = 24
    stackBehavior     = "refresh"

  "Green Thumb II"  (Farming level 6, SkillTreeNode):
    Same as above but triggerChance = 0.6


─────────────────────────────────────────────
5. CONTEXT GATES (biomeId / weatherStateId)
─────────────────────────────────────────────

Context gates live on individual effect rows, not on AbilityDef. This means
a single ability can have different effects in different environments.

Example — "Aquatic" species ability:
  Ability_StatModifier  DEX +4  biomeId = River   (faster in water)
  Ability_StatModifier  CON +2  biomeId = River   (endurance boost in water)
  Ability_StatModifier  DEX −2  biomeId = Desert  (sluggish in dry heat)

Null biomeId or weatherStateId means the effect applies in all contexts.


─────────────────────────────────────────────
6. SCHEMA SUMMARY
─────────────────────────────────────────────

  AbilityDef                 — definition; guild-extensible
  Entity_Ability             — per-entity active ability with source tracking
  Species_DefaultAbility     — abilities granted at entity creation by species
  SkillTreeNode              — guild-defined node; links discipline level → AbilityDef
  SkillTreeNode_Prerequisite — prerequisite edges between nodes
  Entity_SkillTreeNode       — records which nodes an entity has obtained

  Ability_StatModifier        — stat bonuses/penalties with optional context gates
  Ability_ProficiencyModifier — proficiency roll bonuses with optional gates
  Ability_MultiplierEffect    — rate/yield multipliers with optional gates
  Ability_GrantedAction       — unlocked item actions
  Ability_CombatBehavior      — combat behavior intercepts
  Ability_ConditionResistance — condition resistance/immunity
  Ability_DamageModifier      — damage type modifiers
  Ability_ActionTrigger       — action-triggered effects: plot buffs, stat mods, energy restore


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
                effectType = "plot_buff" is how farming skill tree nodes write
                Plot_Buff rows on tended plots. triggerChance naturally expresses
                skill progression — higher-tier nodes grant higher chance variants.
                See farming-system.md for Plot_Buff and PlotCrop_TendRecord details.

  Actions     — Ability_ActionTrigger.triggerSystemType links to ActionSystemType.
                Any action systemType can be a trigger — farming, combat, scouting, etc.
