FACTION SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-06

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
  codeName       — snake_case slug; unique per guild; stable lookup key used in app logic
  name           — display name of the faction
  description    — optional flavour text
  factionRep     — collective faction reputation score (see section 5)
  hasWaterAccess — Boolean (default true); false during drought events or arid territory;
                   Worker uses this for baseline hydration — if true, water drinking
                   covers hydration not met by food intake
  lastEventAt    — faction-level event cooldown; null = no event has ever fired;
                   updated whenever any event fires for this faction;
                   Worker skips new events if now() < lastEventAt + EventDef.cooldownDays

A faction may have zero or more camps (Camp_Faction). Multiple camps can be
active simultaneously — there is no single "active camp" pointer.
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

If no FactionStanding row exists between two factions, the absence is treated
as Neutral. The app reads standings as: row present → use standingTypeId;
no row → Neutral. Default rows are not seeded on faction creation.


─────────────────────────────────────────────
4. TERRITORY
─────────────────────────────────────────────

Factions own and contest locations. See environment-system.md for the full
location model. Key territory concepts:

  Location_Faction
    Ownership record. Each row links a faction to a location with a
    relationTypeId FK → RelationType (isOwnershipSystem = true).

    Ownership relation types (seeded):
      owns        — faction owns this territory
      contesting  — faction is actively contesting this territory

    Shared territory    = multiple Location_Faction rows with relationType = owns
    Contested territory = one or more rows with relationType = contesting
    Unclaimed           = no Location_Faction rows for this location

  LocationBorder
    Records a neighboring faction that borders a location from outside the
    owning faction's territory. Used to determine whether an entity could
    trespass without crossing all of another faction's land.
    Fields: locationId, borderingFactionId.

There is no dedicated LocationStatus model — ownership state is expressed
entirely through the Location_Faction rows and their relation types.


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

Each guild has a GuildSettings row controlling bot-wide configuration.
Faction-relevant fields:

  defaultDailyEnergy      — energy replenished per entity per daily tick
  currentSeasonId         — the active season for this guild
  disciplineLevelCap      — Int?; guild-wide discipline level cap fallback; null = no cap
                            Per-discipline overrides via Guild_DisciplineLevelCap.
                            Stat points are not capped — only discipline progression levels.
  defaultProficiencyBonus — flat bonus added to proficiency rolls when proficient
  factionRepDecayRate     — Int (default 5); rep points deducted from Entity.factionRep per daily tick;
                            tune higher for faster decay, lower for slower
  progressionEnabled      — Boolean; disables energy, aging, EXP, skill points, faction rep globally
  socialEnabled           — Boolean; disables faction standings and entity relationships globally

Guild settings are not per-faction — they apply across all factions in the guild.

Note: filthLevel was previously tracked on Faction. It now lives on Camp, since
filth is a property of a specific physical location rather than the faction.


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  Faction               — in-world group; one or more per guild; codeName is stable lookup key
  FactionStanding       — directional relationship between two factions
  FactionStandingType   — Ally | Neutral | Hostile | Enemy | Truce (seed)
  Location_Faction      — territory ownership records; relationTypeId → RelationType (isOwnershipSystem = true)
  LocationBorder        — neighboring factions that border a location from outside the owner's territory
  Camp                  — see structure-system.md; zero or more per faction; multiple can be active
  Rank                  — guild-defined rank (e.g. leader, warrior, apprentice); scoped per guild
  Rank_Faction          — assigns a rank to one or more factions; only entities in listed factions may hold it
  Rank_DefaultItem      — items shadow-added/removed when an entity is assigned/changed from this rank
  GuildSettings         — guild-wide bot configuration
