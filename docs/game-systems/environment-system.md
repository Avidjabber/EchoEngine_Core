ENVIRONMENT SYSTEM — DESIGN REFERENCE
======================================
Last updated: 2026-04-06

This file is the authoritative reference for how environmental conditions are
stacked and applied in EchoPaw. Read this before touching biome seeding,
location setup, or any system that reads EnvCondition stacks to compute
world modifiers or entity stat/proficiency effects.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

The environment system is a stacking modifier framework. Four sources each
contribute stacks of named EnvConditions. All stacks are summed and the result
drives a narrow set of global world modifiers (filth, spoilage, extreme hazards)
and flat modifiers on entity stats and proficiency rolls.

Plant-growth and foraging sensitivity are NOT global env modifiers — they are
defined per-plant via PlantDef_EnvConditionEffect. Species encounter rates are
defined per-species via Species_EnvConditionEffect. Illness progression
sensitivity is defined per-illness via ConditionDef_EnvRule. See section 5 for
the full rationale.

The four sources, in order of persistence:
  1. Season        — 1 stack of the season's own named condition (always active)
                     e.g. Winter → winter, Spring → spring
                     RULE: each season links to exactly one condition — its own
                     named seasonal condition. Seasons never link to generic
                     conditions like Cold or Damp. Those arise from weather states.
                     Plants and species connect to seasons by referencing these
                     seasonal codeNames in PlantDef_EnvConditionEffect and
                     Species_EnvConditionEffect — no direct Season table join needed.
  2. Active weather — 1 stack per condition linked to the current WeatherState
  3. Biome(s)      — each biome at the location contributes its stacks
                     (Biome_EnvCondition.stacks, default 1)
  4. Location      — per-location overrides via Location_EnvCondition (stack count varies)

For farming specifically, a fifth source applies at the crop level only:
  5. Structure     — env_inject upgrade stacks. Adds stacks of a condition to the
                     combined active env set for crops inside the structure. Does not
                     affect the location's env stack for other systems.


─────────────────────────────────────────────
2. STACKING MODEL
─────────────────────────────────────────────

For each EnvCondition active at a location:
  stackCount = (1 if season links it) + (1 if active weather links it)
             + sum(Biome_EnvCondition.stacks for each biome at this location)
             + sum(Location_EnvCondition.stacks)

Modifier convention: value is a signed delta where 0.0 = no effect.
  0.3 = +30% per stack. −0.3 = −30% per stack.

World modifier formula (EnvCondition_Modifier):
  effectiveMod = 1.0 + value × stackCount

  value = 0.0  → no effect regardless of stack count
  value = 0.3  → +30% per stack (2 stacks = +60%, 3 stacks = +90%)
  value = −0.3 → −30% per stack (2 stacks = −60%; floor enforced app-side)

Stat modifiers (EnvCondition_StatModifier):
  Applied as a flat additive modifier once per stack.
  e.g. Cold with STR modifier −1 and stackCount 2 → −2 STR total.

Proficiency modifiers (EnvCondition_ProficiencyModifier):
  value applied per stack (additive). hasDisadvantage triggers if at least
  one stack is active — it does NOT stack (on or off).


─────────────────────────────────────────────
3. BIOMES
─────────────────────────────────────────────

Biome defines a terrain type. Each location can have one or more biomes
(Location_Biome with a weight). Biomes contribute their inherent EnvConditions
regardless of season or weather.

  Biome_EnvCondition
    biomeId        FK → Biome
    envConditionId FK → EnvCondition
    stacks         Number of stacks this biome contributes (default 1)

A location with multiple biomes stacks contributions from each biome
independently. A Forest + Wetland location would contribute Forest's
shaded+damp AND Wetland's damp×2+humid — resulting in damp×3, shaded×1, humid×1.

See seed-data.md for the full biome list with inherent conditions.


─────────────────────────────────────────────
4. LOCATIONS
─────────────────────────────────────────────

Location is a named territory or point of interest in a guild's world.
It has one or more biomes (via Location_Biome) and can carry extra
EnvCondition stacks via Location_EnvCondition.

  Location_EnvCondition
    Use for locations that deviate from their biome baseline:
    e.g. a Forest location in a frost hollow might add an extra Cold stack.
    e.g. a known tainted pool adds Toxic on top of normal biome conditions.

Location ownership and status are tracked via Location_Faction. A location
can be Owned by multiple factions (each has a row) or Disputed.

  LocationStatus
    Owned     — one or more factions hold this location
    Disputed  — contested; no stable owner

  Unclaimed = no Location_Faction rows exist.


─────────────────────────────────────────────
5. ENV MODIFIER TYPES
─────────────────────────────────────────────

All scaling formula: effectiveMod = 1.0 + value × stackCount

  Modifier convention: value is a signed delta where 0.0 = no effect.
  (e.g. −0.3 = −30% per stack; 0.3 = +30% per stack)

EnvCondition_Modifier tracks these via `modTypeId FK → EnvModifierType`.

ACTIVE TYPES (two global env modifiers):

  filth          Daily filth gain multiplier. Applies globally to all entities
                 at the location.

  spoilage       Food spoilage rate multiplier. Applies globally to all stored
                 food at the location.

Event weight boosting is not a global modifier type. It is handled per-condition
via EnvCondition_EventDef rows — each row links a specific condition to a specific
EventDef with a weightMod float. A Flood condition boosts flood-related events;
a Storm condition boosts storm-related events — fully per-condition, per-event.

Plant growth and foraging sensitivity are per-plant via PlantDef_EnvConditionEffect
(see section 7). Species encounter rates are per-species via Species_EnvConditionEffect
(see section 8). Illness progression sensitivity is per-illness via ConditionDef_EnvRule.
Combat hazard rates are set directly on Location. None of these are global env modifiers.


─────────────────────────────────────────────
6. SCHEMA SUMMARY
─────────────────────────────────────────────

  EnvCondition                     — named condition; global-default extensible
  EnvModifierType                  — filth | spoilage (seed); defines valid modTypeId values
  EnvCondition_Modifier            — global world modifiers per condition (filth and spoilage only)
  EnvCondition_StatModifier        — flat stat modifier per stack
  EnvCondition_ProficiencyModifier — proficiency roll modifier per stack
  EnvCondition_EventDef            — event weight boost when condition is active
  Biome                            — terrain type; global-default extensible
  Biome_EnvCondition               — inherent conditions a biome always contributes
  Location                         — named territory in a guild's world
  Location_Biome                   — which biomes a location has (with weight)
  Location_EnvCondition            — per-location condition overrides
  Location_Faction                 — ownership records
  LocationStatus                   — Owned | Disputed (seed)
  Season_EnvCondition              — condition contributed by a season (1 stack)
  WeatherState                     — a named weather state (guild-extensible); contributes env conditions
  WeatherState_EnvCondition        — condition contributed by a weather state (1 stack)
  WeatherPattern                   — ordered sequence of weather states; guild-extensible
  WeatherPatternStep               — one step in a pattern (weatherStateId, durationHours, order)
  Season_WeatherPattern            — spawn weight for a pattern within a season
  GuildSeason_DefaultWeather       — fallback weather state per season when no pattern step specifies one
  Guild_WeatherPatternCooldown     — per-guild cooldown tracking; Worker skips patterns on cooldown
  PlantDef_EnvConditionEffect      — per-plant spawn/growth responses (see section 7)
  PlantType_EnvConditionEffect     — type-level plant responses; overridden by PlantDef_EnvConditionEffect
  Species_EnvConditionEffect       — per-species encounter responses (see section 8)
  SpeciesType_EnvConditionEffect   — type-level species responses; overridden by Species_EnvConditionEffect


─────────────────────────────────────────────
7. PER-PLANT ENV CONDITION EFFECTS
─────────────────────────────────────────────

PlantDef_EnvConditionEffect defines how a specific plant responds to an active env
condition. No row = neutral (no effect). Covers foraging, cultivation requirements,
growth rate, and survival — including seasonal behaviour via the seasonal env conditions
(spring/summer/autumn/winter).

Each row specifies:
  effectTypeId     Int? FK → EffectType   ("cultivation" | "spawn_rate" | "spawn_weight" | "growth_rate" | "survival")
  relationTypeId   Int  FK → RelationType ("requires" | "increase" | "decrease" | "block" | "kills")
  value            Delta magnitude > 0.0; null when "requires" or "block"

  cultivation / requires — hard planting prerequisite; condition must be present
                           for planting and growth to proceed (no value)
  spawn_rate   — wild foraging find chance (scales PlantDef_Biome.findChance)
  spawn_weight — quantity found per forage attempt
  growth_rate  — cultivated growth tick rate (farming only)
  survival     — per-tick death probability; only valid with "kills" relationshipType.
                 value = probability (0.0–1.0) the crop is destroyed each tick while
                 this condition is active. Reduced by env_override upgrades targeting
                 this condition: effectiveKillChance = value × (1.0 − conditionOverride).

Seasonal behaviour via env condition rows:
  year-round plants:  no seasonal rows needed (0.0 default).
  season-boosted:     increase growth_rate for the seasonal condition (e.g. spring +0.3).
  season-penalised:   decrease growth_rate for the seasonal condition (e.g. autumn -0.2).
  dormant season:     block growth_rate for the off-season condition (e.g. winter block).
  frost-killed:       kills survival for the winter condition (e.g. winter kills 0.05).

STACKING FORMULA (per effectType, across all active conditions and their stacks):
  netModifier = 1.0 + Σ(increase.value × stackCount) − Σ(decrease.value × stackCount)

  If any active condition has a "block" row for this effectType, the plant is
  excluded entirely — block takes precedence over all other modifiers.
  "kills" rows roll independently per active condition per tick.

Examples:
  Rain + yarrow    → increase growth_rate 0.2 AND decrease spawn_rate 0.3
  Damp + rice      → increase growth_rate 0.3
  Dark + sunflower → block spawn_rate    (not findable in darkness)
  Spring + yarrow  → increase spawn_rate 0.4 AND increase growth_rate 0.3
  Winter + yarrow  → block growth_rate   (dormant)
  Winter + rose    → kills survival 0.05 (5% chance to die each winter tick)

One plant can have multiple rows for the same env condition with different effectTypes.
The same env condition can have opposite effects on different plants — fully per-plant.


─────────────────────────────────────────────
8. PER-SPECIES ENV CONDITION EFFECTS
─────────────────────────────────────────────

Species_EnvConditionEffect defines how a species' encounter rate and yield respond
to an active env condition. No row = neutral (no effect).

Each row specifies:
  effectTypeId     Int? FK → EffectType   ("spawn_rate" | "spawn_weight")
  relationTypeId   Int  FK → RelationType ("increase" | "decrease" | "block")
  value            Delta magnitude > 0.0; null when relationTypeId = "block"

  spawn_rate   — encounter rate (applied as multiplier to Species_Biome.spawnWeight
                 during candidate selection)
  spawn_weight — yield / carcass weight modifier (stacks with Location.preyWeight)

STACKING FORMULA: same as plants — additive delta across active conditions.
BLOCK: if any active condition blocks spawn_rate, species is excluded from the
encounter pool entirely regardless of other modifiers.

Examples:
  Squirrel + winter  → decrease spawn_rate 0.9   (hibernating; near-impossible)
  Squirrel + spring  → increase spawn_rate 0.5
  Bear     + flood   → block spawn_rate           (not out during floods)
  Frog     + rain    → increase spawn_rate 0.6    (loves the rain)
  Deer     + autumn  → increase spawn_rate 0.4    (fattening up; more active)
