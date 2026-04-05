FILTH SYSTEM — DESIGN REFERENCE
================================
Last updated: 2026-04-05

This file is the authoritative reference for how filth works in EchoPaw.
Read this before touching any filth generation, cleaning, or event-weight code.


─────────────────────────────────────────────
1. WHAT IS FILTH?
─────────────────────────────────────────────

Filth represents the accumulated mess, waste, and decay within a camp. Left
unchecked, high filth levels at specific structures trigger negative events —
rat raids on storages, flea or tick infestations in housing, and so on.

Filth is tracked per-structure, not at the camp level. Camp-wide filth is a
runtime aggregate only (see section 5). Each structure that participates in
the filth system has its own current level and its own cap.


─────────────────────────────────────────────
2. FILTH SOURCES
─────────────────────────────────────────────

STRUCTURES
───────────
Every participating structure rolls daily filth generation using:

  dailyFilthGenerated = dailyFilthAverage × (rand(0.70, 1.30) + rotItemCount × 0.03)

  dailyFilthAverage   — defined on StructureDef; null = exempt from filth tracking
  rand(0.70, 1.30)    — random roll, ±30% of average (hardcoded app-side)
  rotItemCount        — number of rotting items currently stored in that structure

  Example: average 100, roll 0.85, 2 rotting items → 100 × (0.85 + 0.06) = 91 filth

Farming structures have an additional contribution per active plot:

  farmingFilthGenerated = filthPerActivePlot × (rand(0.70, 1.30) + rotItemCount × 0.03)

  This is calculated separately and added on top of the structure's base daily roll.
  Only plots in an active growing state count — empty or harvested plots do not.

ENTITIES (housing)
───────────────────
Each entity assigned to a housing structure (via Entity_Housing) contributes daily
filth to that structure using:

  dailyFilthGenerated = Species.<bracket>FilthPerDay × (rand(0.70, 1.30) + rotItemCount × 0.03)

  <bracket>FilthPerDay is resolved from the entity's species at runtime:
    child → Species.childFilthPerDay
    teen  → Species.teenFilthPerDay
    adult → Species.adultFilthPerDay
    elder → Species.elderFilthPerDay

  rotItemCount here is the number of rotting items in the entity's personal inventory.

  If the housing structure is overcrowded (occupants > StructureDef_HousingConfig.comfortableCapacity),
  each overcrowded entity's contribution is multiplied by (1.0 + overcrowdingFilthBonus).
  Default overcrowdingFilthBonus is 0.5, giving a 1.5× multiplier. Strict structures
  (maxCapacity = null) can never be overcrowded and this multiplier never applies.


─────────────────────────────────────────────
3. FILTH CAP
─────────────────────────────────────────────

Each participating structure has a filth cap defined on its StructureDef.

  StructureDef.filthCap Int?   — null = structure does not track filth

For non-housing structures, filthCap is a static value.

For housing structures, filthCap is a per-occupant value — the effective cap
is computed at runtime as filthCap × currentOccupantCount. This dynamic
calculation applies once housing occupancy is implemented.

The daily rot bonus (rotItemCount × 0.03) can push generated filth above what
the base roll alone would produce. filthLevel is still capped at filthCap —
rot makes it harder to stay below the cap, it does not raise the cap itself.


─────────────────────────────────────────────
4. ENVIRONMENTAL MODIFIERS
─────────────────────────────────────────────

Active environmental conditions at a location can modify daily filth generation
via the filth EnvModifierType. The modifier is a Float multiplier applied to the
total generated filth after the base formula resolves:

  dailyFilthGenerated = base formula result × envFilthModifier

  envFilthModifier defaults to 1.0 (no effect).
  Values above 1.0 increase generation: 1.3 = +30% more filth.
  Values below 1.0 decrease generation: 0.7 = −30% less filth.

If multiple env conditions are active, their modifiers stack additively:
two conditions each contributing +0.30 produce a combined modifier of 1.60.

The filth env modifier is defined on EnvCondition rows using the filth
EnvModifierType. Seeded values are controlled by developers; guilds do not
configure env modifiers directly.


─────────────────────────────────────────────
5. FILTH REDUCTION
─────────────────────────────────────────────

Entities reduce filth by performing a cleaning action targeting a specific
structure. Cleaning is a voluntary camp chore and can target any structure —
not limited to the entity's assigned housing.

  Action:       "Clean [structure]" — entity chooses any structure to target
  Energy cost:  50
  Rewards:      Faction reputation + general XP
  Effect:       filthLevel -= LifeStage.dailyFilthOutput × 3

The removal amount is derived from the cleaning entity's life stage. An entity
whose daily filth output is 10 removes 30 filth per action — equivalent to
cleaning up 3 days of their own accumulated mess. This keeps cleaning meaningful
regardless of how guilds configure their filthCap values.

filthLevel is clamped at 0 — cleaning cannot reduce filth below zero.

There is one action type with one set of rewards regardless of which structure
is cleaned. The choice of target is the only variable.

Structure upgrades with effectType filth_reduction apply a passive daily reduction
to that structure's filthLevel (see section 9).


─────────────────────────────────────────────
6. CAMP-LEVEL FILTH (AGGREGATE)
─────────────────────────────────────────────

Camp filth is not stored. It is computed at runtime as needed:

  campFilthRatio = SUM(Structure.filthLevel) / SUM(Structure.filthCap)
                   across all filth-participating structures in the camp

This ratio is used for camp-wide event weight calculations. Individual
structure ratios (filthLevel / filthCap) are used for structure-specific
event triggers.

Camp.filthLevel does not exist — any reference to it is outdated.


─────────────────────────────────────────────
7. EFFECTS AND EVENT TRIGGERS
─────────────────────────────────────────────

High filth at a structure increases event weight for events associated with
that structure's type. The specific events that can fire depend on the
structure:

  Storage      → rat raid (food stolen or spoiled)
  Housing      → flea infestation, tick infestation, disease outbreak
  Camp-wide    → general vermin events, driven by aggregate filth ratio

Event weight scaling (exact thresholds TBD at balancing time) is applied
per structure based on its filthLevel / filthCap ratio.

Broken structures (currentDurability = 0) still track filth — a collapsed
storage still attracts rats.


─────────────────────────────────────────────
8. SCHEMA
─────────────────────────────────────────────

  StructureDef
    dailyFilthAverage      Int?   — average daily filth generation; null = exempt
    filthPerActivePlot     Int?   — farming structures only; added per active plot
    filthCap               Int?   — static cap (or per-occupant for housing defs)

  Structure
    filthLevel             Int    @default(0)

  Species
    childFilthPerDay       Float  — daily housing filth contribution for child bracket
    teenFilthPerDay        Float  — teen bracket
    adultFilthPerDay       Float  — adult bracket
    elderFilthPerDay       Float  — elder bracket

  StructureDef_HousingConfig
    comfortableCapacity    Int    — occupant threshold; exceeding this triggers overcrowding multiplier
    maxCapacity            Int?   — null = strict (hard cap); non-null = soft cap (overcrowding allowed)
    overcrowdingFilthBonus Float  — multiplier bonus on each overcrowded entity's daily contribution (default 0.5)

  Entity_Housing
    entityId               Int @id — the entity being housed
    structureId            Int     — the housing structure they are assigned to

  Camp
    filthLevel             REMOVED — use runtime aggregate instead


─────────────────────────────────────────────
9. FILTH REDUCTION UPGRADES
─────────────────────────────────────────────

Structures can receive upgrades with effectType filth_reduction. Each application
reduces that structure's filthLevel by effectValue every day passively, before
any new generation is added.

  effectType:  filth_reduction
  effectValue: flat daily reduction amount (Int, applied per upgrade application)

This is valid for all structure types that participate in filth tracking.
Multiple filth_reduction upgrades on the same structure stack additively.

Example: two filth_reduction upgrades with effectValue 5 each → 10 filth
removed from that structure daily before the day's generation is added.


─────────────────────────────────────────────
10. COMPOST PILE
─────────────────────────────────────────────

The compost pile is a structure with the compost type (see structure-system.md).
It intentionally generates filth while converting organic items into outputs
defined on Item_CompostOutput (e.g. soil, worm tea, rare seeds).

Because items are consumed on deposit rather than stored as StoredItem rows,
the rotItemCount for compost structures is derived from Structure_CompostDeposit
rows instead of StoredItem rows. The worker counts active deposit rows as the
rotItemCount when rolling daily filth for a compost structure.

This is an intended trade-off: composting produces useful outputs at a filth cost.
