STATS, PROFICIENCIES & DISCIPLINES — DESIGN REFERENCE
=======================================================
Last updated: 2026-04-03

This file covers three related but distinct systems: base stats, proficiency
checks, and discipline progression. Read this before touching any seeding,
roll logic, or entity creation code.


─────────────────────────────────────────────
1. BASE STATS
─────────────────────────────────────────────

Six global seeded stats — the standard D&D set. Each stat is a row in the
Stat table (name only; used as FK target for modifier tables).

  Stat           │ Role
  ───────────────┼──────────────────────────────────────────────────────────
  Strength       │ Physical power, melee damage, grappling
  Dexterity      │ Movement, AC modifier, initiative, fine control
  Constitution   │ Health pool, illness resistance, endurance
  Intelligence   │ Learned knowledge, reasoning, problem-solving
  Wisdom         │ Instinct, perception, environmental judgment
  Charisma       │ Leadership, social influence, morale

Stat values are stored per-entity on EntityStats (default 10 each).
The modifier for any stat is: floor((value - 10) / 2)  — standard D&D formula,
computed at the app layer.

Species carry base stat values (e.g. baseStrength) that serve as the
starting floor during character creation; entities may spend stat points
to increase their stats further.


─────────────────────────────────────────────
2. EXP & STAT POINTS
─────────────────────────────────────────────

Stat point progression is tracked via the same tables as disciplines:

  DisciplineDef (isStatProgression = true)
    baseXp      — flat XP required to earn each stat point (universal, not per-guild)
                  earning your 15th point costs the same as your 1st — no scaling curve

  Entity_Discipline (for the stat progression row)
    currentXp   — XP accumulated toward the next stat point; resets on each point earned
    level       — total stat points ever earned by this entity

  EntityStats
    skillPoints — unallocated stat points waiting to be spent

The app excludes the isStatProgression row from discipline listings and applies
the flat threshold instead of the level^1.5 curve used by real disciplines.

Stat points are spent to increase proficiency bonuses (Entity_Proficiency.bonus)
or to purchase skill tree nodes (SkillTreeNode.statPointCost > 0).
See ability-system.md for the full ability effect reference.


─────────────────────────────────────────────
3. PROFICIENCIES
─────────────────────────────────────────────

Proficiencies are D&D-style stat-based skill checks — things like Perception
(Wisdom), Deception (Charisma), Athletics (Strength). They are guild-extensible:
guildId = "global" for seeded defaults, a guild snowflake for custom additions.

ROLL FORMULA
─────────────
  1d20 + stat modifier + bonus [+ proficiency bonus if proficient]

  stat modifier     = floor((EntityStats.<stat> - 10) / 2)
  bonus             = Entity_Proficiency.bonus (earned by spending stat points)
  proficiency bonus = GuildSettings.defaultProficiencyBonus (default: 2),
                      added only when Entity_Proficiency.isProficient = true

SCHEMA
───────
  ProficiencyDef       — definition; one governing stat per proficiency
  Entity_Proficiency   — per-entity row; stores bonus and isProficient

MODIFIERS
──────────
  ConditionDef_ProficiencyEffect   — out-of-combat condition modifier
    amount          Int?    flat bonus/penalty to the roll
    hasDisadvantage Boolean roll twice, take the lower result

  EnvCondition_ProficiencyModifier — environmental condition modifier
    value           Float   flat additive per active stack of the condition
    hasDisadvantage Boolean triggers if at least one stack is active

  Ability_ProficiencyModifier      — ability-sourced modifier (species, skill tree, item, event)
    value           Int     flat bonus to the roll
    hasAdvantage    Boolean roll twice, take the higher result
    hasDisadvantage Boolean roll twice, take the lower result
    biomeId?        Int     only active in this biome
    weatherStateId? Int     only active during this weather state

SEEDED PROFICIENCIES (global)
──────────────────────────────
  To be defined. At minimum should mirror standard D&D skills mapped to the
  six stats above (e.g. Perception → Wisdom, Stealth → Dexterity, etc.).


─────────────────────────────────────────────
4. DISCIPLINES
─────────────────────────────────────────────

Disciplines are universal leveled skills — the same seven apply to every
entity in every guild, regardless of species. They represent long-term mastery
gained through doing. See discipline-system.md for full details.

Quick reference:

  Name     │ Focus
  ─────────┼──────────────────────────────────────────────
  Healing  │ Treating wounds, illness, and conditions
  Crafting │ Creating items via recipes
  Farming  │ Growing and gathering plant-based resources
  Combat   │ Fighting effectiveness and battle experience
  Scouting │ Patrol, territory awareness, threat detection
  Social   │ Leadership, diplomacy, faction influence
  Training │ Mentoring and accelerating other entities' growth

XP formula: floor(baseXp × level^1.5)   where baseXp = 100 (default)

Every entity starts with a row for each discipline at level 0, currentXp 0,
created automatically at entity creation.


─────────────────────────────────────────────
5. HOW THE THREE SYSTEMS RELATE
─────────────────────────────────────────────

  Stats ──────► Proficiency rolls (stat modifier feeds into 1d20 check)
     │
     └──────────► Stat points (tracked via Entity_Discipline on the isStatProgression row)
                    ├─► spend on proficiency bonuses (Entity_Proficiency.bonus)
                    └─► spend on skill tree nodes (SkillTreeNode.statPointCost) → grants Abilities

  Disciplines ─► Leveled XP progression (tracked via Entity_Discipline)
                    └─► unlock skill tree nodes at level thresholds → grants Abilities

  Abilities ──► Passive/active effects on entities
                  Sources: species (inherent), skill tree (earned),
                           items (while equipped), events (granted)
                  Effects: stat modifiers, proficiency modifiers, multipliers,
                           granted actions, combat behaviors, condition resistances,
                           damage modifiers
