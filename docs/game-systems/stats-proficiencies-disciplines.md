STATS, PROFICIENCIES & DISCIPLINES — DESIGN REFERENCE
=======================================================
Last updated: 2026-04-04

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
    dailyXpCap  — maximum stat-progression XP an entity may earn per day; keeps casual
                  and power users roughly in step for stat points while letting dedicated
                  players earn more discipline XP freely. Discipline rows have no daily cap.

  Entity_Discipline (for the stat progression row)
    currentXp   — XP accumulated toward the next stat point; resets on each point earned
    level       — total stat points ever earned by this entity (not a discipline "level" —
                  the field name is shared; meaning depends on isStatProgression flag)

  EntityStats
    skillPoints — unallocated stat points waiting to be spent

The app excludes the isStatProgression row from discipline listings and applies
the flat threshold instead of the level^1.5 curve used by real disciplines.

SPENDING & REFUNDS
───────────────────
  EntityStats.skillPoints holds the current unallocated count.
  Points may be spent in three ways — there is no separate pool for each:

  1. Raw stat increase: spend 1 point to increase any base stat (Strength, Dexterity,
     Constitution, Intelligence, Wisdom, Charisma) by 1. No upper limit beyond any
     species-level or admin-defined cap already in place.
     App writes: EntityStats.<stat> += 1, skillPoints -= 1

  2. Proficiency bonus: spend points to increase Entity_Proficiency.bonus on any
     proficiency. No enforced cap on bonus value.
     App writes: Entity_Proficiency.bonus += amount, skillPoints -= amount

  3. Skill tree node: spend the node's statPointCost to purchase an unlocked node.
     App writes: Entity_SkillTreeNode row created, skillPoints -= statPointCost

  On node removal (respec): statPointCost is immediately refunded to skillPoints.
  A spend is rejected if skillPoints < cost at the time of the request.
  Stat increases and proficiency bonus purchases are not refundable.

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

XP formula: floor(baseXp × level^1.5)   where baseXp = 100 (default)
Discipline XP has no daily cap. Only the stat progression row has a dailyXpCap.

Every entity starts with a row for each discipline at level 0, currentXp 0,
created automatically at entity creation.

DISCIPLINE LEVEL CAP
─────────────────────
GuildSettings.disciplineLevelCap (Int?) sets the max discipline level for all
disciplines in the guild. null = no cap. See discipline-system.md for full details.


─────────────────────────────────────────────
5. HOW THE THREE SYSTEMS RELATE
─────────────────────────────────────────────

  Stats ──────► Proficiency rolls (stat modifier feeds into 1d20 check)
     │
     └──────────► Stat points (tracked via Entity_Discipline on the isStatProgression row)
                    ├─► spend 1:1 on raw stat increases (EntityStats.<stat> += 1)
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
