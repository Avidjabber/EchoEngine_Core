WEATHER STATES — SEED DATA REFERENCE
=====================================
Last updated: 2026-05-01

Tracks all weather states planned for the bulk upload sheet.
Each state maps to a code_name (upload key), display name, severity flag,
env conditions it contributes while active, and the seasons it fits.

See seed-data.md for the full list of available env condition code names.
See weather-system.md for how states slot into patterns and defaults.


─────────────────────────────────────────────
ENV CONDITIONS QUICK REFERENCE
─────────────────────────────────────────────

Temperature  : cold · frost · freezing · warm · heat · scorching
Precipitation: wet · drenched · flooded
Humidity     : arid · dry · damp · humid
Wind         : still · breezy · windy · gusting · gale
Air/Ground   : icy · muddy · dusty · misty · fog · dense_fog · hazy · smoke · pollen
Light/Sky    : overcast · sunny · harsh_sunlight · bright · shaded · dim · dark
Special      : power_loss


─────────────────────────────────────────────
WEATHER STATES
─────────────────────────────────────────────

Format: code_name | name | is_severe | env_conditions | seasons

── CLEAR / NEUTRAL ──────────────────────────

clear             | Clear             | false | —                                         | all
partly_cloudy     | Partly Cloudy     | false | —                                         | all
overcast          | Overcast          | false | overcast                                  | all
still_air         | Still Air         | false | still                                     | all

── SUNNY / WARM ─────────────────────────────

sunny             | Sunny             | false | sunny · warm                              | Spr · Sum
warm              | Warm              | false | warm                                      | Spr · Sum
hot               | Hot               | false | sunny · warm · heat                       | Sum
dry_heat          | Dry Heat          | false | warm · dry                                | Sum · Aut
muggy             | Muggy             | false | warm · humid · damp                       | Spr · Sum
humid_overcast    | Humid Overcast    | false | warm · humid · damp · overcast            | Sum

── HOT / DRY ────────────────────────────────

heat_wave         | Heat Wave         | true  | harsh_sunlight · heat · scorching         | Sum
drought           | Drought           | true  | harsh_sunlight · heat · scorching · arid · dry | Sum

── COOL / COLD ──────────────────────────────

cool              | Cool              | false | cold                                      | Aut
frost             | Frost             | false | frost · still                             | Aut · Win
cold_snap         | Cold Snap         | false | freezing · gusting                        | Win
deep_freeze       | Deep Freeze       | true  | freezing · arid · gale                    | Win

── WIND ─────────────────────────────────────

breezy            | Breezy            | false | breezy                                    | all
windy             | Windy             | false | windy                                     | all
gale              | Gale              | true  | gale · windy                              | Aut · Win
dust_storm        | Dust Storm        | true  | arid · gusting · dusty                    | Sum

── FOG / MIST ───────────────────────────────

misty             | Misty             | false | misty                                     | Spr · Sum · Aut
foggy             | Foggy             | false | fog · damp                                | Aut · Win
dense_fog         | Dense Fog         | false | dense_fog · overcast                      | Aut · Win
cold_fog          | Cold Fog          | false | cold · fog · damp                         | Aut · Win

── RAIN ─────────────────────────────────────

drizzle           | Drizzle           | false | wet · damp                                | all
warm_rain         | Warm Rain         | false | warm · wet · damp · overcast              | Spr · Sum
rain              | Rain              | false | wet · damp · overcast                     | all
cold_rain         | Cold Rain         | false | cold · wet · damp · overcast              | Aut · Win
heavy_rain        | Heavy Rain        | false | drenched · overcast                       | Spr · Sum · Aut
thunderstorm      | Thunderstorm      | false | drenched · windy · overcast               | Spr · Sum
downpour          | Downpour          | true  | drenched · flooded · gale                 | Spr · Sum

── SNOW / ICE ───────────────────────────────

sleet             | Sleet             | false | frost · wet · damp                        | Aut · Win
freezing_rain     | Freezing Rain     | false | freezing · wet · windy                    | Win
snowfall          | Snowfall          | false | frost · icy · still                       | Win
heavy_snow        | Heavy Snow        | false | freezing · drenched · overcast            | Win
ice_storm         | Ice Storm         | true  | freezing · icy · gale                     | Win
blizzard          | Blizzard          | true  | freezing · drenched · gale                | Win

── SMOKE / HAZE / DUST ──────────────────────

haze              | Haze              | false | hazy · dry                                | Sum · Aut
wildfire_smoke    | Wildfire Smoke    | true  | smoke · arid · dry                        | Sum
ash_fall          | Ash Fall          | true  | smoke · arid · dusty · overcast           | Sum

── SEASONAL SPECIALS ────────────────────────

pollen_burst      | Pollen Burst      | false | pollen                                    | Spr
muddy_thaw        | Muddy Thaw        | false | cold · muddy · damp                       | Spr


─────────────────────────────────────────────
SEASONAL COVERAGE SUMMARY
─────────────────────────────────────────────

All four seasons share the neutral base set:
  clear · partly_cloudy · overcast · still_air · breezy · windy · drizzle · rain

Spring  — warming, rains, thaw
  sunny · warm · muggy · misty
  warm_rain · heavy_rain · thunderstorm · downpour
  pollen_burst · muddy_thaw

Summer  — heat, humidity, storms, fire risk
  hot · dry_heat · humid_overcast · heat_wave · drought
  dust_storm · haze · wildfire_smoke · ash_fall
  warm_rain · heavy_rain · thunderstorm · downpour

Autumn  — cooling, fog, cold rain
  cool · dry_heat (early) · frost (late)
  misty · foggy · dense_fog · cold_fog
  cold_rain · heavy_rain · sleet (late)
  gale · haze (early)

Winter  — frost, ice, snow
  frost · cold_snap · deep_freeze
  foggy · dense_fog · cold_fog
  cold_rain · sleet · freezing_rain
  snowfall · heavy_snow · ice_storm · blizzard
  gale


─────────────────────────────────────────────
NOTES
─────────────────────────────────────────────

- gale is both a weather state code_name and an env condition code_name. The state
  links TO the gale env condition — no collision in the upload format since they
  appear in separate sheet columns.

- sunny has the same overlap — the weather state links to the sunny env condition.

- frost (weather state) uses the frost env condition, not cold. The temperature
  gradient is cold → frost → freezing; states are mapped accordingly.

- pollen_burst contributes only the pollen condition. Its gameplay impact comes from
  per-species and per-plant pollen responses defined elsewhere.

- muddy_thaw represents early spring snow-melt. The muddy env condition applies
  filth=0.3 — messy ground without being severe enough to gate patterns.

- clear and partly_cloudy carry no env conditions intentionally — a no-op weather
  layer that lets season and biome carry the environment unmodified.

- power_loss is not assigned to any state here. Attach it to any state to disable
  power processing for that weather (arcane storms, solar flares, etc.).
