WEATHER SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-03

[PLACEHOLDER — Schema is fully built. This document captures current known design.
Expand as implementation begins.]

This file is the authoritative reference for how weather works in EchoPaw.
Read this before touching WeatherState, WeatherPattern, or any system that
reads active weather to determine environmental conditions or event weights.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Weather is a guild-level system that controls which environmental conditions are
active at any given moment. It is layered on top of the season and biome systems —
weather contributes one additional source of EnvCondition stacks.

A guild always has one active WeatherState. That state contributes its linked
EnvConditions (via WeatherState_EnvCondition) to all active locations.

Weather advances through WeatherPatterns — ordered sequences of states with
defined durations. A Worker tick selects the next pattern and advances state
transitions on schedule.


─────────────────────────────────────────────
2. WEATHER STATES
─────────────────────────────────────────────

WeatherState defines a named atmospheric condition (global-default extensible).

  name         Display label (e.g. "Clear", "Rain", "Blizzard")
  isSevere     true = only appears in admin-triggered patterns; Worker never
               picks these naturally. Used for disaster-level weather.

Each WeatherState links to one or more EnvConditions via WeatherState_EnvCondition.
When a state is active, each linked condition contributes 1 stack to the environment.

Example linkages (to be seeded):
  Clear     → (none)
  Overcast  → overcast
  Rain      → rain, damp
  Storm     → storm, damp, windy
  Blizzard  → snow, freezing, gusting    [isSevere = true]
  Fog       → fog, misty
  Heat Wave → heat, scorching            [isSevere = true]
  Drought   → dry, arid                  [isSevere = true]


─────────────────────────────────────────────
3. WEATHER PATTERNS
─────────────────────────────────────────────

WeatherPattern is a named sequence of states (global-default extensible).
A pattern defines how weather progresses over time — e.g. Clear → Overcast → Rain → Clear.

  WeatherPatternStep
    patternId      FK → WeatherPattern
    stepOrder      Position in the sequence (ascending)
    weatherStateId FK → WeatherState
    durationHours  How long this state lasts before advancing to the next step

When the final step ends, the Worker selects a new pattern to begin.


─────────────────────────────────────────────
4. SEASON WEIGHTS
─────────────────────────────────────────────

Season_WeatherPattern defines how likely each pattern is to be selected during
a given season. This makes storms more common in leaf-bare, heat waves more
common in green-leaf, etc.

  seasonId    FK → Season
  patternId   FK → WeatherPattern
  weight      Rarity tier for this season: common (10), uncommon (5), rare (2), very rare (1)

When the Worker selects a new pattern, it samples from all patterns that have a
weight entry for the current season, using their tier values as relative weights.
Patterns with no entry for the current season are never selected.


─────────────────────────────────────────────
5. DEFAULT WEATHER
─────────────────────────────────────────────

GuildSeason_DefaultWeather defines the fallback WeatherState for a guild in a
given season when no pattern is active (e.g. at guild setup before patterns fire).

  guildId        FK → Guild
  seasonId       FK → Season
  weatherStateId FK → WeatherState

This ensures the environment always has a sensible baseline even if the pattern
system has not yet run.


─────────────────────────────────────────────
6. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  EnvConditions — Active weather state contributes 1 stack of each linked
                  EnvCondition. Stacks with season and biome contributions.
                  See environment-system.md for the full stacking model.

  Events        — EventDef_WeatherTrigger links events to specific weather
                  states. When that state becomes active, the event's weight
                  is boosted or the event fires directly (depending on trigger
                  configuration). See event-system.md.

  Seasons       — Season determines which patterns are likely (via weights) and
                  which default weather applies. Weather and season are separate
                  axes — a Winter season can still have a Clear day.


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  WeatherState                 — named atmospheric state; guild-extensible
  WeatherState_EnvCondition    — env conditions contributed while state is active
  WeatherPattern               — named sequence of states; guild-extensible
  WeatherPatternStep           — ordered step in a pattern (state + duration)
  Season_WeatherPattern        — probability weights per season for each pattern
  GuildSeason_DefaultWeather   — fallback weather state per guild per season
