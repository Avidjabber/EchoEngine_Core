WEATHER SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-05-15

This file is the authoritative reference for how weather works in EchoPaw.
Read this before touching WeatherState, WeatherPattern, or any system that
reads active weather to determine environmental conditions or event weights.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Weather is a guild-level system that controls which environmental conditions
are active at any given moment. It is layered on top of the season and biome
systems — weather contributes one additional source of EnvCondition stacks.

The system runs across three applications:

  Worker  — fires once per hour; calls POST /weather-sim/tick-all on the API.
  API     — receives the tick, determines which guilds need updating, advances
            each guild's weather state, then notifies the bot.
  Bot     — receives a structured payload from the API and posts a formatted
            weather update to the guild's designated weather channel.

When no weather pattern is active, a guild defaults to Clear — no EnvConditions
are contributed and the bot posts "The weather is now Clear."


─────────────────────────────────────────────
2. WEATHER STATES
─────────────────────────────────────────────

WeatherState defines a named atmospheric condition (global-default extensible).

  name         Display label shown in Discord (e.g. "Clear", "Rain", "Blizzard")
  codeName     Internal identifier (e.g. "clear", "rain", "blizzard")
  isSevere     Changes the Discord message accent color to warning orange.
               Does not affect pattern selection.

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
    stepOrder      Position in the sequence (ascending, starting at 1)
    weatherStateId FK → WeatherState (nullable — falls back to season default)
    durationHours  How long this state lasts before the API advances to the next step

When the final step expires, the active pattern is cleared. A new pattern is
selected at the next midnight tick (see Section 6).


─────────────────────────────────────────────
4. SEASON WEIGHTS
─────────────────────────────────────────────

Season_WeatherPattern defines how likely each pattern is to be selected during
a given season. This makes storms more common in leaf-bare, heat waves more
common in green-leaf, etc.

  seasonId    FK → Season
  patternId   FK → WeatherPattern
  weight      Relative probability: common (10), uncommon (5), rare (2), very rare (1)

When the API selects a new pattern, it draws only from patterns that have a
weight entry for the guild's current season. Patterns with no entry for that
season are never eligible. The draw is a weighted random pick using the
weight values as relative probabilities.

Patterns are also subject to per-guild cooldowns (Guild_WeatherPatternCooldown).
If a pattern's cooldownDays > 0 and it has run recently, it is excluded from
the eligible pool until the cooldown expires.


─────────────────────────────────────────────
5. DEFAULT WEATHER
─────────────────────────────────────────────

GuildSeason_DefaultWeather defines the fallback WeatherState for a guild in a
given season. It is used in two situations:

  - No pattern is currently active (e.g. before patterns have ever fired, or
    when no eligible patterns exist at midnight).
  - A pattern step has a null weatherStateId — the step's effective state
    falls back to this default rather than contributing nothing.

  guildId        FK → Guild
  seasonId       FK → Season
  weatherStateId FK → WeatherState

If no default is configured and no pattern is active, the bot posts Clear
with no EnvConditions.


─────────────────────────────────────────────
6. TICK FLOW
─────────────────────────────────────────────

The API processes each enabled guild sequentially. For each guild:

  1. Guard checks
     If worldSimEnabled is false, skip. If no season is set, notify the bot
     with Clear and return skipped.

  2. Step progression
     If a pattern is active and the current step's duration has elapsed
     (now >= stepStartedAt + durationHours), the API advances to the next
     step. If there is no next step, the pattern is cleared.

  3. Midnight pattern selection
     Only runs at local midnight (calculated from the guild's timezoneOffset)
     and only when no pattern is active. The API draws a new pattern from the
     eligible weighted pool. If no eligible patterns exist, the bot is still
     notified with Clear.

  4. State resolution
     The current step's WeatherState is resolved (falling back to the season
     default if the step has no state). If no pattern is active, state is null.

  5. Bot notification
     Always fires for world-sim-enabled guilds regardless of whether weather
     changed. The API calls POST /internal/post-weather on the bot with:

       channelId           — first den with allowWorldSim = true
       guildId             — the guild being updated
       currentWeatherState — { codeName, name, isSevere, envConditions[] }
                             or null if no active weather (renders as Clear)

  6. Response
     tickAll returns a per-guild summary for the worker to log:

       {
         "processed": 3,
         "results": [
           { "guildId": "...", "skipped": false, "weatherChanged": true,  "patternChanged": false },
           { "guildId": "...", "skipped": true,  "reason": "no_season",   "weatherChanged": false, "patternChanged": false },
           { "guildId": "...", "skipped": false, "weatherChanged": false, "patternChanged": false }
         ]
       }

     Possible skip reasons: world_sim_disabled, no_season, no_eligible_patterns.


─────────────────────────────────────────────
7. BOT MESSAGE FORMAT
─────────────────────────────────────────────

The bot posts a Discord Components V2 message to the guild's weather channel.

  Active weather with conditions:
    "The weather is now Rainy.
     It is Cold, Wet, and Windy."

  Active weather with no conditions:
    "The weather is now Overcast."

  No active pattern (null state):
    "The weather is now Clear."

The container accent color is orange (warning) when isSevere is true,
blue (info) otherwise.


─────────────────────────────────────────────
8. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  EnvConditions — Active weather state contributes 1 stack of each linked
                  EnvCondition. Stacks with season and biome contributions.
                  See environment-system.md for the full stacking model.

  Events        — EventDef_WeatherTrigger links events to specific weather
                  states. When that state becomes active, the event's weight
                  is boosted or the event fires directly (depending on trigger
                  configuration). See event-system.md.

  Seasons       — Season determines which patterns are eligible (via weights)
                  and which default weather applies. Weather and season are
                  separate axes — a Winter season can still have a Clear day.


─────────────────────────────────────────────
9. SCHEMA SUMMARY
─────────────────────────────────────────────

  WeatherState                  — named atmospheric state; guild-extensible
  WeatherState_EnvCondition     — env conditions contributed while state is active
  WeatherPattern                — named sequence of states; guild-extensible
  WeatherPatternStep            — ordered step in a pattern (state + duration)
  Season_WeatherPattern         — probability weights per season for each pattern
  GuildSeason_DefaultWeather    — fallback weather state per guild per season
  Guild_WeatherPatternCooldown  — tracks last-run time per guild per pattern


─────────────────────────────────────────────
10. WORKER IMPLEMENTATION
─────────────────────────────────────────────

The worker only talks to the API — it never touches the database or the bot
directly. Its entire job is to fire once per hour and tell the API to run.
The API figures out which guilds need updating, processes each one, and
notifies the bot on its own.

  Architecture (apps/worker/src/)
    index.ts              — entry point; runs startup auth check, then starts ticker
    core/ticker.ts        — cron jobs: health check (*/10 min), hourly job (0 * * * *)
    services/api.ts       — ApiService singleton; handles JWT auth and all API calls

  Environment variables (apps/worker/.env)
    API_BASE_URL          — e.g. http://localhost:3000 (overridden to http://api:3000
                            in Docker Compose via docker-compose.yml environment block)
    API_KEY               — shared bot API key; same as BOT_API_KEY in apps/api/.env
    WORKER_CLIENT_ID      — service client ID for JWT authentication
    WORKER_CLIENT_SECRET  — service client secret for JWT authentication

    To provision the ServiceClient row in the database:
      npm run db:provision:worker   (from repo root, with the API running)

  Startup behaviour
    On startup, the worker authenticates via POST /auth/token (client credentials
    flow) and exits with code 1 if authentication fails. This ensures misconfigured
    credentials are caught immediately rather than failing silently at job time.
    A health check fires immediately on startup and every 10 minutes thereafter
    as a liveness probe.

  Pending
    The hourlyJob() function in ticker.ts is currently a stub. Wire it to
    POST /weather-sim/tick-all via api.post() — no body needed. Log the
    response so weather updates can be debugged. The expected response shape is:

      {
        "processed": 3,
        "results": [
          { "guildId": "...", "skipped": false, "weatherChanged": true,  "patternChanged": false },
          { "guildId": "...", "skipped": true,  "reason": "no_season",   "weatherChanged": false, "patternChanged": false },
          { "guildId": "...", "skipped": false, "weatherChanged": false, "patternChanged": false }
        ]
      }

    Possible skip reasons: world_sim_disabled, no_season, no_eligible_patterns.
