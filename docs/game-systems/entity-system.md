ENTITY SYSTEM — DESIGN REFERENCE
==================================
Last updated: 2026-04-06

[PLACEHOLDER — Schema is fully built. This document captures current known design.
Expand as implementation begins.]

This file is the authoritative reference for how entities (characters) work in
EchoPaw. Read this before touching entity creation, species seeding, stat
management, or any system that reads or modifies entity state.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

An Entity is any character in the game world — a player's cat, an NPC, a named
side character. Entities have a species, stats, conditions, disciplines, items,
and relationships. They belong to a faction and are owned by a guild.


─────────────────────────────────────────────
2. ENTITY TYPES
─────────────────────────────────────────────

EntityType controls what an entity can do and who controls it.

  name             canModifyStats  canParticipateCombat  canParticipateEvents  adminOnly
  NPC              false           true                  false                 true
  Side Character   false           true                  true                  false
  Main Character   true            true                  true                  false

  NPC              — admin-created; never participates in player events
  Side Character   — named world characters (mentors, elders); can join events
  Main Character   — player-owned; can modify stats, participate in everything


─────────────────────────────────────────────
3. ENTITY CORE
─────────────────────────────────────────────

Key Entity fields:

  guildId       — owning guild
  factionId     — owning faction
  typeId        — FK → EntityType (NPC | Side Character | Main Character)
  speciesId     — FK → Species
  statusId      — FK → Status (Active | Inactive | Hiatus)
  name          — display name
  age           — age in moons (in-world calendar unit)
  sexId         — FK → Sex
  genderId      — FK → Gender
  userId        — Discord user ID of the player (null for NPCs / side characters)


─────────────────────────────────────────────
4. ENTITY STATS
─────────────────────────────────────────────

EntityStats holds the entity's live numeric state.

  currentHp     — current hit points (read by combat)
  maxHp         — max HP (set at character creation via Species HP dice + CON modifier)
  currentEnergy — energy remaining for actions this day
  skillPoints   — unspent stat points available to allocate
  strength / dexterity / constitution / intelligence / wisdom / charisma — the six core stats

AC is NOT stored on EntityStats. It is computed at resolution time from:
  Species.baseAc + equipment modifiers + active condition effects (CombatEffectType.modifiesAC)

Stat values are modified by spending stat points (Main Character only).
EntityStats is a 1:1 extension of Entity.


─────────────────────────────────────────────
5. SPECIES
─────────────────────────────────────────────

Species defines the biological type of an entity. Seeded globally; guilds
may define custom species.

Key Species fields:
  name              — display name
  baseHp            — base HP at creation
  baseAc            — base AC
  combatXpReward    — Combat discipline XP granted to opponents who defeat
                      an entity of this species (default 50)
  dropTableId       — default loot table when defeated

Species also defines:
  Species_DefaultAbility    — abilities all entities of this species have by default
  Species_DefaultLoadout    — items all entities of this species have equipped by default
  SpeciesCombatBehavior     — NPC AI weights for combat action selection
  Species_EquipmentLoadout  — per-species equipment slot capacity overrides
  Species_Biome             — biomes where this species naturally appears


─────────────────────────────────────────────
6. STATS AND PROFICIENCIES
─────────────────────────────────────────────

Entities have six core stats (Strength, Dexterity, Constitution, Intelligence,
Wisdom, Charisma). Stats are tracked on EntityStats.

Proficiencies are guild-scoped skill checks (Perception, Stealth, etc.) that
use a stat as their base modifier. Each entity has an Entity_Proficiency row
per ProficiencyDef, tracking a bonus that can be increased by spending stat points.

See stats-proficiencies-disciplines.md for the full reference.


─────────────────────────────────────────────
7. RELATIONSHIPS
─────────────────────────────────────────────

Entity_Relationship records named connections between entities.

  entityId           — the entity holding this relationship
  targetEntityId     — the other entity
  relationshipTypeId — FK → RelationshipType

Seeded RelationshipTypes:
  mother   — biological mother (isUnique = false; multiple mothers possible)
  father   — biological father (isUnique = false)
  mentor   — assigned mentor (isUnique = true; only one mentor at a time)

isUnique = true enforces that an entity can only have one relationship of
that type at a time (app-enforced at creation).


─────────────────────────────────────────────
8. ENTITY STATUS
─────────────────────────────────────────────

Status (model name: Status) tracks an entity's participation state:

  Active   — normal; participates in all systems
  Inactive — not currently active; excluded from daily ticks and actions
  Hiatus   — player is on a break; entity frozen in place

Status is managed by admins or players depending on EntityType.


─────────────────────────────────────────────
9. SCHEMA SUMMARY
─────────────────────────────────────────────

  Entity                     — core character record
  EntityStats                — live numeric state (HP, AC, energy, stats)
  EntityType                 — NPC | Side Character | Main Character (seed)
  Status                     — Active | Inactive | Hiatus (seed)
  Sex                        — Male | Female | Intersex (seed)
  Gender                     — Male | Female | Non-binary | Other (seed)
  Species                    — biological type; guild-extensible
  Species_DefaultAbility     — abilities granted to all entities of this species
  Species_DefaultLoadout     — items equipped by default for this species
  SpeciesCombatBehavior      — NPC AI action weights and target strategies
  Species_EquipmentLoadout   — per-species slot capacity overrides
  Species_Biome              — biomes where this species naturally spawns
  Entity_Relationship        — named connections between entities
  RelationshipType           — mother | father | mentor (seed)
  ProficiencyDef             — guild-scoped proficiency definitions
  Entity_Proficiency         — per-entity proficiency bonus tracking
