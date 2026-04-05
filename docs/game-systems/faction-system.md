FACTION SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-04

[PLACEHOLDER — Schema is fully built. This document captures current known design.
Expand as implementation begins.]

This file is the authoritative reference for how factions work in EchoPaw.
Read this before touching faction seeding, standing resolution, territory
management, or any system that references factions directly.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

A Faction is a group of entities operating under a shared identity — a clan,
pack, tribe, or independent band. Factions own locations, have standings with
other factions, and operate within a Guild.

Factions are distinct from Guilds: a Guild is the Discord server / community
running the bot. A Guild can have multiple Factions — each representing a
different in-world group (e.g. ThunderClan, ShadowClan are clan-based examples).


─────────────────────────────────────────────
2. FACTION
─────────────────────────────────────────────

Faction is the core model. Key fields:

  guildId        — the owning Discord guild
  name           — display name of the faction
  codeName       — snake_case slug; unique per guild
  factionRep        — current faction reputation score; modified by actions and events
  description    — optional flavour text
  activeCampId   — FK → Camp (nullable). The faction's currently active camp.
                   A faction may have multiple camps but only one is active at a
                   time. null = faction has no camps.

Entities belong to a faction via Entity.factionId.


─────────────────────────────────────────────
3. FACTION STANDINGS
─────────────────────────────────────────────

FactionStanding tracks the relationship between two factions.

  factionId        — the faction holding this standing
  targetFactionId  — the faction being regarded
  standingTypeId   — FK → FactionStandingType

FactionStandingType (seeded):
  Ally     — friendly; open borders, shared territory possible
  Neutral  — no active relationship
  Hostile  — tensions; skirmishes may occur
  Enemy    — open conflict; active combat permitted
  Truce    — ceasefire; temporarily suppressed hostility

Standings are directional — FactionA can regard FactionB as Ally while
FactionB regards FactionA as Neutral. The app should display both directions
to players.


─────────────────────────────────────────────
4. TERRITORY
─────────────────────────────────────────────

Factions own and contest locations. See environment-system.md for the full
location model. Key territory concepts:

  Location_Faction   — ownership record; a location may have multiple owners
  LocationStatus     — Owned | Disputed

A location with multiple Location_Faction rows with Owned status = shared
territory (e.g. a shared water source between two Ally factions).

Disputed locations have active contestation. The game system can use Hostile
or Enemy standings between location-sharing factions to mark a location as
Disputed automatically.


─────────────────────────────────────────────
5. FACTION REPUTATION
─────────────────────────────────────────────

There are two distinct factionRep fields. They serve different purposes.

COLLECTIVE FACTION REP  (Faction.factionRep)
─────────────────────────────────────────────
Faction.factionRep is a running score modified by:
  - Action completion (ActionInstance: factionRepEarned per participant)
  - Event outcomes (event rewards with rep modifiers)
  - Admin adjustments

This score represents the faction's overall standing and progress.

Guild_ActionConfig.baseFactionReward (can be negative) defines the rep change
per participant when that action type completes. Individual snapshots are
stored on ActionInstance_Entity.factionRepEarned.

INDIVIDUAL ENTITY REP  (Entity.factionRep)
───────────────────────────────────────────
Entity.factionRep is a personal score representing how well an entity is
pulling their weight within their own faction.

  Range:   0 to 500 (clamped at app layer)
  Decay:   decays daily — rep must be actively maintained
  Bonus:   every 100 rep = +1 to all stat rolls
           (200 rep = +2, 300 rep = +3, up to a maximum of +5 at 500)

This creates a persistent incentive for entities to keep contributing — the
bonus is universal and meaningful, but requires ongoing upkeep to sustain.


─────────────────────────────────────────────
6. GUILD SETTINGS
─────────────────────────────────────────────

Each guild has a GuildSettings row controlling bot-wide configuration:

  defaultDailyEnergy    — energy replenished per entity per daily tick
  currentSeasonId       — the active season for this guild
  disciplineLevelCap    — Int?; max discipline level for all entities in the guild; null = no cap
                          Stat points are not capped — only discipline progression levels.
  defaultProficiencyBonus — flat bonus added to proficiency rolls when an entity is proficient
  (other settings TBD as system is built)

Guild settings are not per-faction — they apply across all factions in the guild.

Note: filthLevel was previously tracked on Faction. It now lives on Camp, since
filth is a property of a specific physical location rather than the faction.


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  Faction               — in-world group; one or more per guild; activeCampId points to active camp
  FactionStanding       — directional relationship between two factions
  FactionStandingType   — Ally | Neutral | Hostile | Enemy | Truce (seed)
  Location_Faction      — territory ownership records
  Camp                  — see structure-system.md; zero or more per faction
  GuildSettings         — guild-wide bot configuration
