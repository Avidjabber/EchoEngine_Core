DISCIPLINE SYSTEM — DESIGN REFERENCE
=====================================
Last updated: 2026-04-06

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
2. THE FIVE DISCIPLINES
─────────────────────────────────────────────

  Name     | Description
  ---------|----------------------------------------------------
  Healing  | Treating wounds, illness, and conditions
  Crafting | Creating items via recipes
  Farming  | Growing and gathering plant-based resources
  Combat   | Fighting effectiveness and battle experience
  Scouting | Patrol, territory awareness, and threat detection

NOTE: DisciplineDef also contains one stat progression row (isStatProgression = true).
That row is not a discipline — it tracks EXP toward stat points using a flat threshold
instead of the level curve. It is excluded from discipline listings in the app.
It carries a dailyXpCap — once an entity hits that cap, further actions that day do
not grant stat XP, though they still yield all other rewards (items, faction rep,
discipline XP, event triggers). Discipline XP itself has no daily cap.
See stats-proficiencies-disciplines.md section 2 for full details.

DISCIPLINE LEVEL CAP
─────────────────────
Level caps are resolved per discipline using a two-tier lookup:
  1. Guild_DisciplineLevelCap — per-discipline override for this guild (takes precedence)
  2. GuildSettings.disciplineLevelCap — guild-wide fallback; null = no cap

If no Guild_DisciplineLevelCap row exists for a given discipline, the guild-wide
fallback applies. A guild can cap Combat at 20 while allowing Farming to go to 50
by seeding one row for Combat and leaving the others to the fallback.
Stat points are not subject to any cap.


─────────────────────────────────────────────
3. PROGRESSION
─────────────────────────────────────────────

Every entity starts with one Entity_Discipline row per discipline (6 rows) plus one
row for the stat progression entry — 7 rows total, all at level 0, currentXp 0.
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

  DisciplineDef                — global seeded table, one row per discipline + one stat progression row
                                 key fields: codeName, baseXp, isStatProgression, dailyXpCap
  Entity_Discipline            — per-entity progression tracking (level, currentXp)
  Guild_DisciplineLevelCap     — per-guild per-discipline level cap override; fallback is GuildSettings.disciplineLevelCap
  SkillTreeNode                — guild-defined node: name, ability granted, level threshold, cost; name unique per guild
  SkillTreeNode_Relation       — directed edges between nodes; relationTypeId FK → RelationType (REQUIRES / BLOCKS / UPGRADES)
  SkillTreeNode_DisciplineRequirement — cross-discipline level gate on a node
  Entity_SkillTreeNode         — records which nodes an entity has obtained

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
    abilityDefId    — the AbilityDef granted when the node is obtained; null = gate-only node (no ability grant)
    name            — human-readable display name (e.g. "Enhance Strength I"); unique per guild across all trees
    levelRequired   — entity's discipline level must reach this to unlock
    statPointCost   — stat points required to purchase; 0 = free but still requires explicit player purchase

  SkillTreeNode_DisciplineRequirement
    nodeId          — the node being gated
    disciplineDefId — a different discipline the entity must also meet
    levelRequired   — minimum level required in that discipline
    A node may have zero or more cross-discipline requirement rows.
    All must be satisfied (in addition to the node's own levelRequired)
    before the node is considered unlocked.
    Example: a "Combat Medic" node in the Healing tree could require
    Combat level 5 AND Healing level 3 (its own levelRequired).

  SkillTreeNode_Relation
    nodeId          — the node being constrained
    relationTypeId  — FK → RelationType (REQUIRES | BLOCKS | UPGRADES)
    targetNodeId    — the node being referenced
    Both nodeId and targetNodeId must belong to the same guildId.
    A node may have any number of relation rows.

  Entity_SkillTreeNode
    entityId / nodeId — records which nodes an entity has obtained

NODE LIFECYCLE
───────────────
  Locked:       entity's discipline level < levelRequired (or prereqs not met)
  Unlocked:     level reached AND all prerequisites obtained; available for purchase
  Purchasable:  unlocked + not yet obtained; entity spends stat points from
                EntityStats.skillPoints (0 cost nodes are free but still require
                explicit purchase — nothing is granted automatically)

RESPEC / NODE REMOVAL
──────────────────────
A purchased node can be removed (respec). On removal:
  - Entity_SkillTreeNode row is deleted
  - Entity_Ability row for that node is deleted (ability is no longer accessible)
  - statPointCost for that node is immediately refunded to EntityStats.skillPoints
  - Any nodes that listed this node as a prerequisite are also removed recursively,
    with their costs refunded as well

NODE RELATIONS
───────────────
  Relations are directional — the app checks all SkillTreeNode_Relation rows
  where nodeId = the node being purchased.

  REQUIRES — nodeId cannot be purchased unless at least one application of
             targetNodeId is already in the entity's obtained set. Enforced at
             purchase time. REQUIRES edges also define the dependency graph for
             recursive respec removal: if targetNodeId is removed, nodeId is
             also removed (and its cost refunded).

  BLOCKS   — nodeId cannot be purchased if targetNodeId is already obtained.
             One-directional: if A BLOCKS B, the entity cannot purchase A while
             they have B — but B is not automatically blocked by A unless a
             separate B BLOCKS A row exists.

  UPGRADES — nodeId is a direct tier upgrade of targetNodeId. nodeId cannot be
             purchased unless targetNodeId is already obtained (implicit REQUIRES).
             On purchase, the Entity_SkillTreeNode and Entity_Ability rows for
             targetNodeId are deleted — no stat point refund is given. Only one
             tier is active at a time.
             In the bot UI, nodeId is hidden until the entity has targetNodeId;
             once they do, targetNodeId is replaced in the display by nodeId so
             the player only ever sees the next relevant tier, not the full chain.
             Useful for tiered abilities (Parry I → Parry II) where each tier
             supersedes the previous one.

  Only REQUIRES and UPGRADES edges are considered for cycle detection. The API
  validates that no cycle exists in the REQUIRES+UPGRADES graph when creating or
  updating nodes. BLOCKS edges are not part of the dependency graph and cannot
  create cycles.
  All referenced nodeIds and targetNodeIds must belong to the same guildId —
  enforced at the app layer.

SKILL TREES ARE PER-GUILD
──────────────────────────
SkillTreeNode rows are scoped to a guild (guildId). Two guilds running the same
discipline will have entirely separate tree layouts, level thresholds, and costs.
Global/seeded tree templates do not exist — each guild builds its own.
Members can view their character's current discipline levels and the full
skill tree for any discipline via Discord commands.

NODE ORDERING
──────────────
Nodes have no explicit sort order field. Display ordering is by levelRequired —
lower-level nodes appear first. Within the same levelRequired, prerequisite
structure determines layout. The bot uses a canvas-rendered tree diagram,
positioning nodes by their level tier and prerequisite edges.

STAT POINTS & SPENDING
───────────────────────
EntityStats.skillPoints tracks unallocated points. When a node is purchased:
  statPointCost is immediately deducted from skillPoints in the same DB write.
When a node is removed (respec), the cost is immediately refunded.
Stat points can also be spent on proficiency bonuses (Entity_Proficiency.bonus).
A purchase is rejected if skillPoints < statPointCost at the time of the request.

See ability-system.md for the full ability effect reference.


─────────────────────────────────────────────
7. PLANNED API FUNCTIONS
─────────────────────────────────────────────

These are the service-layer operations the skill/discipline system will need.
None are implemented yet. Order reflects logical dependency.

DISCIPLINE PROGRESSION
───────────────────────
  awardDisciplineXp(entityId, disciplineDefId, amount)
    - Adds XP to Entity_Discipline
    - If currentXp >= xpRequired(level), increments level and resets currentXp
    - Returns: new level, new currentXp, list of newly unlocked nodes (for notification)

  getDisciplineLevels(entityId)
    - Returns all Entity_Discipline rows for an entity (excluding isStatProgression row)
    - Used for Discord "view character levels" command

  getDisciplineTree(guildId, disciplineDefId, entityId)
    - Returns all SkillTreeNode rows for the guild+discipline
    - Each node annotated with status: locked / unlocked / obtained
    - Used for Discord "view skill tree" command

SKILL TREE NODE MANAGEMENT (admin / guild setup)
──────────────────────────────────────────────────
  createSkillTreeNode(guildId, disciplineDefId, name, abilityDefId, levelRequired,
                      statPointCost, relations[])
    - relations[] is an array of { relationTypeId, targetNodeId } pairs
    - Validates all targetNodeIds belong to same guildId
    - Validates no cycle is introduced in the REQUIRES graph
    - Creates SkillTreeNode and SkillTreeNode_Relation rows

  updateSkillTreeNode(nodeId, fields)
    - Same validation as create for any relation changes
    - Changing levelRequired or statPointCost does not retroactively affect
      already-obtained Entity_SkillTreeNode rows

  deleteSkillTreeNode(nodeId)
    - Removes SkillTreeNode and its prerequisite edges
    - Also removes Entity_SkillTreeNode rows referencing this node
    - Refunds statPointCost to affected entities
    - Also removes Entity_Ability rows sourced from this node

  getSkillTree(guildId, disciplineDefId)
    - Returns full node list with prerequisite edges (admin view, no entity state)

ENTITY NODE PURCHASE / RESPEC
───────────────────────────────
  purchaseNode(entityId, nodeId)
    - Validates: entity discipline level >= levelRequired
    - Validates: all SkillTreeNode_DisciplineRequirement rows are satisfied
    - Validates: all REQUIRES targets are in entity's obtained set
    - Validates: no BLOCKS targets are in entity's obtained set
    - Validates: entity skillPoints >= statPointCost (after any UPGRADES refunds)
    - Validates: if node has an UPGRADES relation, targetNodeId must be obtained
    - For each UPGRADES target the entity has obtained: removes its
      Entity_SkillTreeNode + Entity_Ability rows (no refund)
    - Deducts statPointCost from EntityStats.skillPoints
    - Creates Entity_SkillTreeNode row
    - If abilityDefId is not null: creates Entity_Ability row (sourceType = "skill_tree", sourceId = nodeId)

  removeNode(entityId, nodeId)
    - Collects all nodes that depend on this node via REQUIRES edges (recursive)
    - Removes Entity_SkillTreeNode and Entity_Ability rows for node + dependents
    - Refunds total statPointCost of all removed nodes to EntityStats.skillPoints

  getEntityNodes(entityId, guildId)
    - Returns all Entity_SkillTreeNode rows for an entity within a guild
    - Used to display what an entity has already obtained
