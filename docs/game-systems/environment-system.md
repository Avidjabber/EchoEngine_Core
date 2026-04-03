ENVIRONMENT SYSTEM — DESIGN REFERENCE
======================================
Last updated: 2026-04-03

[PLACEHOLDER — Schema is fully built. This document captures current known design.
Expand as implementation begins.]

This file is the authoritative reference for how environmental conditions are
stacked and applied in EchoPaw. Read this before touching biome seeding,
location setup, or any system that reads EnvCondition stacks to compute
world modifiers or entity stat/proficiency effects.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

The environment system is a stacking modifier framework. Four sources each
contribute stacks of named EnvConditions. All stacks are summed and the result
drives multipliers on world systems (foraging, spoilage, sickness, etc.) and
flat modifiers on entity stats and proficiency rolls.

The four sources, in order of persistence:
  1. Season        — 1 stack of the season's linked condition (always active)
  2. Active weather — 1 stack per condition linked to the current WeatherState
  3. Biome(s)      — each biome at the location contributes its stacks
                     (Biome_EnvCondition.stacks, default 1)
  4. Location      — per-location overrides via Location_EnvCondition (stack count varies)


─────────────────────────────────────────────
2. STACKING MODEL
─────────────────────────────────────────────

For each EnvCondition active at a location:
  stackCount = (1 if season links it) + (1 if active weather links it)
             + sum(Biome_EnvCondition.stacks for each biome at this location)
             + sum(Location_EnvCondition.stacks)

World modifier formula (EnvCondition_Modifier):
  effectiveMod = 1.0 + (value − 1.0) × stackCount

  value = 1.0 → no effect regardless of stack count
  value = 1.3 → +30% per stack (2 stacks = +60%, 3 stacks = +90%)
  value = 0.7 → −30% per stack (2 stacks = −60%, floor at 0 if needed)

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

All scaling formula: effectiveMod = 1.0 + (value − 1.0) × stackCount

  filth          daily filth gain multiplier
  prey_weight    prey yield / carcass size multiplier
  herb_chance    herb find rate multiplier
  herb_amount    herb yield per gather multiplier
  gather_chance  general forage / drop table find rate multiplier
  gather_amount  general forage yield multiplier
  spoilage       food spoilage rate multiplier
  predator       predator encounter rate multiplier
  sickness       illness spawn chance multiplier
  hazard_chance  hazard-type event weight multiplier
  plant_growth   cultivated-plant growth rate multiplier (farming system)

See seed-data.md EnvModifierType and EnvCondition sections for full values.


─────────────────────────────────────────────
6. SCHEMA SUMMARY
─────────────────────────────────────────────

  EnvCondition                  — named condition; global-default extensible
  EnvCondition_Modifier         — world modifier multipliers per condition
  EnvCondition_StatModifier     — flat stat modifier per stack
  EnvCondition_ProficiencyModifier — proficiency roll modifier per stack
  EnvCondition_EventDef         — event weight boost when condition is active
  Biome                         — terrain type; global-default extensible
  Biome_EnvCondition            — inherent conditions a biome always contributes
  Location                      — named territory in a guild's world
  Location_Biome                — which biomes a location has (with weight)
  Location_EnvCondition         — per-location condition overrides
  Location_Faction              — ownership records
  LocationStatus                — Owned | Disputed (seed)
  Season_EnvCondition           — condition contributed by a season (1 stack)
  WeatherState_EnvCondition     — condition contributed by a weather state (1 stack)
