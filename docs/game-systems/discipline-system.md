DISCIPLINE SYSTEM — DESIGN REFERENCE
=====================================
Last updated: 2026-04-03

This file is the authoritative reference for how disciplines work in EchoPaw.
Read this before touching any discipline seeding or discipline-adjacent code.


─────────────────────────────────────────────
1. WHAT ARE DISCIPLINES?
─────────────────────────────────────────────

Disciplines are universal leveled skills that every entity has, regardless of
guild or species. They represent long-term mastery gained through doing — an
entity gets better at crafting by crafting, better at combat by fighting, etc.

They are distinct from Proficiencies, which are DnD-stat-based checks (Perception,
Deception, etc.) and are guild-scoped. Disciplines are global and fixed.

They also differ from Abilities, which are passive or active effects granted by
species, skill tree nodes, items, or events. Disciplines track progress;
abilities are the rewards that progress unlocks.


─────────────────────────────────────────────
2. THE SEVEN DISCIPLINES
─────────────────────────────────────────────

  Name     | Description
  ---------|----------------------------------------------------
  Healing  | Treating wounds, illness, and conditions
  Crafting | Creating items via recipes
  Farming  | Growing and gathering plant-based resources
  Combat   | Fighting effectiveness and battle experience
  Scouting | Patrol, territory awareness, and threat detection
  Social   | Leadership, diplomacy, and faction influence
  Training | Mentoring other entities and accelerating their growth

NOTE: DisciplineDef also contains one stat progression row (isStatProgression = true).
That row is not a discipline — it tracks EXP toward stat points using a flat threshold
instead of the level curve. It is excluded from discipline listings in the app.
It also carries a dailyXpCap (100 XP/day) — once an entity hits that cap, further
actions that day do not grant stat XP, though they still yield all other rewards
(items, clan rep, discipline XP, event triggers).
See stats-proficiencies-disciplines.md section 2 for full details.


─────────────────────────────────────────────
3. PROGRESSION
─────────────────────────────────────────────

Every entity starts with one Entity_Discipline row per discipline (7 rows) plus one
row for the stat progression entry — 8 rows total, all at level 0, currentXp 0.
These rows are created automatically at entity creation (app layer responsibility).

Schema fields per entity (Entity_Discipline):
  - level      Int  — current discipline level
  - currentXp  Int  — XP accumulated toward the next level

XP TO NEXT LEVEL FORMULA
─────────────────────────
  xpRequired(level) = floor(baseXp × level^1.5)

Where baseXp is stored on DisciplineDef (default: 100).

Example thresholds at baseXp = 100:

  Level │ XP to reach
  ──────┼────────────
    1   │       100
    2   │       283
    3   │       520
    4   │       800
    5   │     1,118
   10   │     3,162
   20   │     8,944

The formula produces a smooth, progressive curve. Early levels are accessible
for casual play; high levels represent genuine long-term achievement.

baseXp is defined per DisciplineDef, so individual disciplines can be tuned
to progress faster or slower if needed in the future.


─────────────────────────────────────────────
4. XP SOURCES
─────────────────────────────────────────────

Discipline XP reaches an entity through three paths:

  Actions (ActionType_DisciplineReward)
    Pure activity actions (border patrol, training session, etc.) grant XP
    to one or more disciplines on completion. Every action that grants stat
    point XP will have a row pointing to the StatProgression DisciplineDef.

  Recipes (Recipe_DisciplineReward)
    Each crafting recipe independently defines which disciplines it rewards
    and how much. The same verb (Dry) rewards different disciplines depending
    on what is being processed — drying yarrow rewards Healing and Crafting,
    drying meat rewards Farming. The "Crafting Session" ActionType has no
    DisciplineReward rows of its own; all XP flows from executed recipes.

  Combat (Species.combatXpReward)
    Defeating an enemy entity grants Combat discipline XP to the winning side.
    The amount is defined on the defeated entity's Species. Distributed to all
    non-fled, non-defeated participants on the winning side.
    See combat-system.md section 9 for full XP rules.


─────────────────────────────────────────────
5. SCHEMA
─────────────────────────────────────────────

  DisciplineDef         — global seeded table, one row per discipline + one stat progression row
                          key fields: baseXp, isStatProgression, dailyXpCap
  Entity_Discipline     — per-entity progression tracking (level, currentXp)

DisciplineDef has no guildId — disciplines are the same across all guilds.


─────────────────────────────────────────────
6. SKILL TREE
─────────────────────────────────────────────

Each guild defines its own skill tree nodes for each discipline. Guilds cannot
alter the disciplines themselves, but they fully own their node layouts, level
thresholds, costs, and prerequisites.

NODE SCHEMA
────────────
  SkillTreeNode
    guildId         — owning guild
    disciplineDefId — which discipline tree this node belongs to
    abilityDefId    — the AbilityDef granted when the node is obtained
    levelRequired   — entity's discipline level must reach this to unlock
    statPointCost   — stat points required to purchase; 0 = auto-granted
    isAutoGranted   — true when the node is granted automatically on level-up

  SkillTreeNode_Prerequisite
    nodeId / prerequisiteNodeId — directed edge; prerequisite must be obtained first

  Entity_SkillTreeNode
    entityId / nodeId — records which nodes an entity has obtained

NODE LIFECYCLE
───────────────
  Locked:      entity's discipline level < levelRequired (or prereqs not met)
  Unlocked:    level reached AND all prerequisites obtained
  Auto-granted: isAutoGranted = true → Entity_SkillTreeNode row created automatically on level-up
  Purchasable: unlocked + not yet obtained + statPointCost > 0 → entity spends stat points

PREREQUISITES
──────────────
Prerequisites are within the same guild's tree. The app layer enforces this.
Circular prerequisites are rejected at the app layer.

STAT POINTS
────────────
Stat points are also spendable on proficiency bonuses (Entity_Proficiency.bonus),
giving entities a choice between raw proficiency bonuses and ability unlocks.

See ability-system.md for the full ability effect reference.
