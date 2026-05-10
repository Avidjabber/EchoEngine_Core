WEATHER PATTERNS — SEED DATA REFERENCE
=======================================
Last updated: 2026-05-10

Tracks all weather patterns planned for the bulk upload sheet.
Each pattern defines a named sequence of weather states with durations.
Season weights control how often the Worker selects each pattern.

See weather-states.md for the full list of available state code_names.
See weather-system.md for how patterns are selected and advance.


─────────────────────────────────────────────
FORMAT
─────────────────────────────────────────────

patterns sheet   code_name | name | is_severe | cooldown_days
steps sheet      steps listed in order, each as: weather_state (Xh)
weights sheet    season · tier  (only seasons listed appear in season_weights)

is_severe = true  → admin-triggered only; Worker never selects these naturally
cooldown_days     → minimum days before this pattern can be re-selected (0 = none)
weather_state = — → blank in upload; uses the season's default weather for that step


─────────────────────────────────────────────
RARITY TIERS
─────────────────────────────────────────────

Common    = 10   everyday weather; appears most often
Uncommon  =  5   notable but regular; shows up a few times per season
Rare      =  2   occasional and memorable; players notice when it hits
Very Rare =  1   exceptional; also the convention for admin-only severe patterns


─────────────────────────────────────────────
WORKER BEHAVIOUR — MULTI-DAY PATTERNS
─────────────────────────────────────────────

At midnight, if the active pattern has ended, the Worker picks a new one.

  < 24h   Pattern completes before midnight. The final step holds until the next
          midnight tick, then a new pattern is selected.

  = 24h   Pattern ends exactly at midnight and rolls over cleanly.

  > 24h   Pattern spans multiple days. The Worker continues advancing steps
          across midnight ticks until the pattern ends naturally, then picks
          a new one at the next midnight.

This means a 48h rain system genuinely occupies two in-game days, and a 72h
dry spell blocks three days of weather selection. Design multi-day patterns
intentionally — they are narrative arcs, not just long single steps.

Variant naming convention:
  _1 / _2   Standard variants (≤ 24h, or up to ~36h for complex patterns)
  _3        Multi-day extended variant (48h or longer)


─────────────────────────────────────────────
PATTERNS
─────────────────────────────────────────────

── EVERYDAY (all seasons) ───────────────────
   No multi-day variants. Everyday patterns are single-day by design.

clear_day_1       | Clear Day         | false | 0
  steps  : clear (12h) → partly_cloudy (8h) → clear (4h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

clear_day_2       | Clear Day         | false | 0
  steps  : partly_cloudy (4h) → clear (16h) → partly_cloudy (4h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

clear_day_3       | Clear Day         | false | 0
  steps  : clear (8h) → still_air (8h) → clear (8h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

overcast_lull_1   | Overcast Lull     | false | 0
  steps  : overcast (8h) → partly_cloudy (8h) → clear (8h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

overcast_lull_2   | Overcast Lull     | false | 0
  steps  : partly_cloudy (4h) → overcast (16h) → partly_cloudy (4h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

overcast_lull_3   | Overcast Lull     | false | 0
  steps  : overcast (10h) → drizzle (4h) → overcast (6h) → clear (4h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

passing_shower_1  | Passing Shower    | false | 0
  steps  : overcast (4h) → drizzle (8h) → clear (4h)
  weights: Spring Common · Summer Uncommon · Autumn Common · Winter Rare

passing_shower_2  | Passing Shower    | false | 0
  steps  : partly_cloudy (4h) → overcast (4h) → drizzle (8h) → clear (8h)
  weights: Spring Common · Summer Uncommon · Autumn Common · Winter Rare

passing_shower_3  | Passing Shower    | false | 0
  steps  : overcast (6h) → rain (6h) → drizzle (6h) → clear (6h)
  weights: Spring Common · Summer Uncommon · Autumn Common · Winter Rare

breezy_clearing_1 | Breezy Clearing   | false | 0
  steps  : breezy (8h) → partly_cloudy (8h) → clear (8h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

breezy_clearing_2 | Breezy Clearing   | false | 0
  steps  : windy (4h) → breezy (12h) → clear (8h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

breezy_clearing_3 | Breezy Clearing   | false | 0
  steps  : partly_cloudy (6h) → breezy (10h) → clear (8h)
  weights: Spring Common · Summer Common · Autumn Common · Winter Common

changeable_day_1  | Changeable Day    | false | 0
  steps  : partly_cloudy (4h) → overcast (4h) → drizzle (4h) → breezy (4h) → clear (4h) → partly_cloudy (4h)
  weights: Spring Uncommon · Summer Rare · Autumn Uncommon · Winter Rare

changeable_day_2  | Changeable Day    | false | 0
  steps  : clear (4h) → overcast (6h) → drizzle (4h) → clear (6h) → breezy (4h)
  weights: Spring Uncommon · Summer Rare · Autumn Uncommon · Winter Rare

── SPRING ───────────────────────────────────

spring_showers_1  | Spring Showers    | false | 0
  steps  : partly_cloudy (6h) → warm_rain (12h) → drizzle (6h)
  weights: Spring Common · Summer Very Rare

spring_showers_2  | Spring Showers    | false | 0
  steps  : overcast (4h) → drizzle (6h) → warm_rain (8h) → drizzle (6h)
  weights: Spring Common · Summer Very Rare

spring_showers_3  | Spring Showers    | false | 1                          · 48h
  steps  : partly_cloudy (8h) → warm_rain (16h) → rain (12h) → drizzle (8h) → partly_cloudy (4h)
  weights: Spring Rare · Summer Very Rare

warm_front_1      | Warm Front        | false | 0
  steps  : clear (6h) → warm (8h) → muggy (8h) → warm_rain (6h) → clear (4h)
  weights: Spring Uncommon · Summer Rare

warm_front_2      | Warm Front        | false | 0
  steps  : warm (6h) → muggy (10h) → warm_rain (6h) → clear (2h)
  weights: Spring Uncommon · Summer Rare

warm_front_3      | Warm Front        | false | 1                          · 48h
  steps  : clear (8h) → warm (12h) → muggy (16h) → warm_rain (8h) → muggy (4h)
  weights: Spring Rare · Summer Very Rare

spring_storm_1    | Spring Storm      | false | 1
  steps  : muggy (8h) → overcast (4h) → thunderstorm (6h) → rain (6h) → drizzle (4h) → clear (4h)
  weights: Spring Uncommon · Summer Uncommon

spring_storm_2    | Spring Storm      | false | 1
  steps  : muggy (4h) → thunderstorm (10h) → rain (6h) → clear (4h)
  weights: Spring Uncommon · Summer Uncommon

spring_storm_3    | Spring Storm      | false | 2                          · 48h
  steps  : muggy (8h) → thunderstorm (16h) → heavy_rain (12h) → rain (8h) → drizzle (4h)
  weights: Spring Rare · Summer Rare

pollen_bloom_1    | Pollen Bloom      | false | 2
  steps  : clear (6h) → pollen_burst (16h) → misty (4h) → clear (4h)
  weights: Spring Rare

pollen_bloom_2    | Pollen Bloom      | false | 2
  steps  : clear (4h) → pollen_burst (12h) → misty (8h)
  weights: Spring Rare

muddy_thaw_1      | Muddy Thaw        | false | 2
  steps  : frost (6h) → muddy_thaw (12h) → drizzle (6h) → partly_cloudy (4h)
  weights: Spring Rare

muddy_thaw_2      | Muddy Thaw        | false | 2
  steps  : cold_snap (4h) → muddy_thaw (16h) → drizzle (4h)
  weights: Spring Rare

misty_morning_1   | Misty Morning     | false | 0
  steps  : misty (8h) → partly_cloudy (8h) → clear (8h)
  weights: Spring Common · Summer Uncommon · Autumn Uncommon

misty_morning_2   | Misty Morning     | false | 0
  steps  : misty (6h) → partly_cloudy (6h) → sunny (8h) → clear (4h)
  weights: Spring Common · Summer Uncommon · Autumn Uncommon

pleasant_spring_1 | Pleasant Spring   | false | 0
  steps  : partly_cloudy (4h) → warm (8h) → sunny (8h) → warm (4h)
  weights: Spring Common

pleasant_spring_2 | Pleasant Spring   | false | 0
  steps  : warm (6h) → sunny (12h) → partly_cloudy (6h)
  weights: Spring Common

spring_downpour   | Spring Downpour   | true  | 5
  steps  : overcast (4h) → heavy_rain (8h) → downpour (8h) → rain (6h) → clear (4h)
  weights: Spring Very Rare · Summer Very Rare

── SUMMER ───────────────────────────────────

sunny_spell_1     | Sunny Spell       | false | 0
  steps  : sunny (12h) → hot (8h) → sunny (4h)
  weights: Spring Uncommon · Summer Common

sunny_spell_2     | Sunny Spell       | false | 0
  steps  : warm (4h) → sunny (12h) → hot (8h)
  weights: Spring Uncommon · Summer Common

summer_humidity_1 | Summer Humidity   | false | 0
  steps  : warm (8h) → muggy (8h) → humid_overcast (8h) → warm_rain (6h)
  weights: Spring Rare · Summer Uncommon

summer_humidity_2 | Summer Humidity   | false | 0
  steps  : muggy (8h) → humid_overcast (10h) → warm_rain (6h)
  weights: Spring Rare · Summer Uncommon

summer_humidity_3 | Summer Humidity   | false | 1                          · 48h
  steps  : muggy (12h) → humid_overcast (16h) → warm_rain (8h) → muggy (8h) → humid_overcast (4h)
  weights: Summer Rare

afternoon_storm_1 | Afternoon Storm   | false | 1
  steps  : sunny (8h) → muggy (4h) → thunderstorm (6h) → warm_rain (4h) → clear (2h)
  weights: Spring Uncommon · Summer Common

afternoon_storm_2 | Afternoon Storm   | false | 1
  steps  : sunny (6h) → muggy (6h) → thunderstorm (8h) → drizzle (4h)
  weights: Spring Uncommon · Summer Common

still_heat_1      | Still Heat        | false | 0
  steps  : still_air (6h) → hot (12h) → humid_overcast (6h)
  weights: Spring Rare · Summer Uncommon

still_heat_2      | Still Heat        | false | 0
  steps  : warm (4h) → still_air (8h) → hot (8h) → still_air (4h)
  weights: Spring Rare · Summer Uncommon

still_heat_3      | Still Heat        | false | 1                          · 48h
  steps  : still_air (8h) → hot (16h) → humid_overcast (12h) → still_air (8h) → hot (4h)
  weights: Summer Rare

dry_spell_1       | Dry Spell         | false | 1
  steps  : hot (8h) → dry_heat (12h) → haze (8h) → dry_heat (8h)
  weights: Summer Uncommon · Autumn Very Rare

dry_spell_2       | Dry Spell         | false | 1
  steps  : hot (6h) → dry_heat (12h) → haze (6h)
  weights: Summer Uncommon · Autumn Very Rare

dry_spell_3       | Dry Spell         | false | 2                          · 72h
  steps  : hot (12h) → dry_heat (24h) → haze (16h) → dry_heat (12h) → hot (8h)
  weights: Summer Very Rare

heat_wave_event   | Heat Wave         | true  | 14
  steps  : hot (8h) → dry_heat (12h) → heat_wave (24h) → hot (8h)
  weights: Summer Very Rare

drought_event     | Drought           | true  | 30
  steps  : dry_heat (12h) → heat_wave (12h) → drought (48h) → dry_heat (8h)
  weights: Summer Very Rare

dust_storm_event  | Dust Storm        | true  | 7
  steps  : dry_heat (8h) → haze (4h) → dust_storm (12h) → haze (8h) → clear (4h)
  weights: Summer Very Rare

wildfire_event    | Wildfire          | true  | 14
  steps  : haze (6h) → wildfire_smoke (24h) → ash_fall (12h) → haze (8h)
  weights: Summer Very Rare

── AUTUMN ───────────────────────────────────

autumn_cooling_1  | Autumn Cooling    | false | 0
  steps  : clear (8h) → cool (12h) → overcast (6h) → drizzle (4h) → cool (6h)
  weights: Autumn Common

autumn_cooling_2  | Autumn Cooling    | false | 0
  steps  : clear (6h) → cool (10h) → overcast (8h)
  weights: Autumn Common

autumn_cooling_3  | Autumn Cooling    | false | 1                          · 48h
  steps  : clear (8h) → cool (16h) → overcast (12h) → cold_rain (8h) → cool (4h)
  weights: Autumn Rare

foggy_morning_1   | Foggy Morning     | false | 0
  steps  : dense_fog (6h) → foggy (6h) → overcast (6h) → partly_cloudy (6h)
  weights: Autumn Common · Winter Uncommon

foggy_morning_2   | Foggy Morning     | false | 0
  steps  : cold_fog (4h) → dense_fog (10h) → foggy (6h) → overcast (4h)
  weights: Autumn Common · Winter Uncommon

blustery_day_1    | Blustery Day      | false | 0
  steps  : breezy (4h) → windy (16h) → breezy (4h)
  weights: Spring Rare · Autumn Uncommon · Winter Uncommon

blustery_day_2    | Blustery Day      | false | 0
  steps  : windy (12h) → overcast (8h) → windy (4h)
  weights: Spring Rare · Autumn Uncommon · Winter Uncommon

autumn_squall_1   | Autumn Squall     | false | 1
  steps  : overcast (4h) → windy (4h) → cold_rain (12h) → windy (4h)
  weights: Autumn Uncommon · Winter Rare

autumn_squall_2   | Autumn Squall     | false | 1
  steps  : windy (6h) → cold_rain (10h) → overcast (4h) → windy (4h)
  weights: Autumn Uncommon · Winter Rare

autumn_rain_1     | Autumn Rain       | false | 0
  steps  : overcast (6h) → cold_rain (12h) → drizzle (6h)
  weights: Autumn Common

autumn_rain_2     | Autumn Rain       | false | 0
  steps  : partly_cloudy (4h) → overcast (4h) → cold_rain (10h) → drizzle (6h)
  weights: Autumn Common

autumn_rain_3     | Autumn Rain       | false | 1                          · 48h
  steps  : overcast (8h) → cold_rain (20h) → heavy_rain (8h) → cold_rain (8h) → drizzle (4h)
  weights: Autumn Rare

cold_fog_bank_1   | Cold Fog Bank     | false | 1
  steps  : cool (4h) → misty (4h) → cold_fog (12h) → foggy (8h) → partly_cloudy (4h)
  weights: Autumn Uncommon · Winter Rare

cold_fog_bank_2   | Cold Fog Bank     | false | 1
  steps  : cool (6h) → cold_fog (14h) → foggy (4h)
  weights: Autumn Uncommon · Winter Rare

cold_fog_bank_3   | Cold Fog Bank     | false | 2                          · 48h
  steps  : misty (6h) → foggy (12h) → cold_fog (18h) → dense_fog (8h) → foggy (4h)
  weights: Autumn Rare · Winter Very Rare

first_frost_1     | First Frost       | false | 2
  steps  : cool (8h) → frost (12h) → partly_cloudy (8h)
  weights: Autumn Rare · Winter Rare

first_frost_2     | First Frost       | false | 2
  steps  : cool (4h) → frost (16h) → still_air (4h)
  weights: Autumn Rare · Winter Rare

autumn_gale       | Autumn Gale       | true  | 5
  steps  : windy (6h) → overcast (4h) → gale (12h) → cold_rain (8h) → windy (4h) → clear (4h)
  weights: Autumn Very Rare · Winter Very Rare

── WINTER ───────────────────────────────────

winter_chill_1    | Winter Chill      | false | 0
  steps  : cold_snap (12h) → frost (12h) → partly_cloudy (6h) → clear (6h)
  weights: Autumn Rare · Winter Common

winter_chill_2    | Winter Chill      | false | 0
  steps  : frost (8h) → cold_snap (10h) → frost (6h)
  weights: Autumn Rare · Winter Common

winter_chill_3    | Winter Chill      | false | 1                          · 48h
  steps  : cold_snap (12h) → frost (20h) → cold_snap (12h) → frost (4h)
  weights: Winter Rare

light_snowfall_1  | Light Snowfall    | false | 0
  steps  : overcast (6h) → snowfall (12h) → frost (8h) → partly_cloudy (4h)
  weights: Winter Common

light_snowfall_2  | Light Snowfall    | false | 0
  steps  : overcast (4h) → snowfall (16h) → frost (4h)
  weights: Winter Common

light_snowfall_3  | Light Snowfall    | false | 1                          · 48h
  steps  : overcast (8h) → snowfall (16h) → heavy_snow (12h) → snowfall (8h) → frost (4h)
  weights: Winter Rare

snow_flurry_1     | Snow Flurry       | false | 0
  steps  : overcast (4h) → snowfall (6h) → partly_cloudy (8h)
  weights: Autumn Very Rare · Winter Common

snow_flurry_2     | Snow Flurry       | false | 0
  steps  : overcast (6h) → snowfall (4h) → clear (10h)
  weights: Autumn Very Rare · Winter Common

sleet_and_rain_1  | Sleet and Rain    | false | 1
  steps  : cold_rain (8h) → sleet (12h) → freezing_rain (6h) → cold_rain (4h) → overcast (4h)
  weights: Autumn Rare · Winter Uncommon

sleet_and_rain_2  | Sleet and Rain    | false | 1
  steps  : freezing_rain (4h) → sleet (14h) → cold_rain (6h)
  weights: Autumn Rare · Winter Uncommon

sleet_and_rain_3  | Sleet and Rain    | false | 2                          · 48h
  steps  : cold_rain (8h) → sleet (16h) → freezing_rain (8h) → heavy_snow (12h) → frost (4h)
  weights: Winter Rare

winter_fog_1      | Winter Fog        | false | 0
  steps  : cold_fog (8h) → dense_fog (8h) → foggy (8h)
  weights: Autumn Rare · Winter Uncommon

winter_fog_2      | Winter Fog        | false | 0
  steps  : dense_fog (10h) → cold_fog (8h) → foggy (6h)
  weights: Autumn Rare · Winter Uncommon

winter_fog_3      | Winter Fog        | false | 2                          · 72h
  steps  : foggy (12h) → dense_fog (24h) → cold_fog (24h) → foggy (12h)
  weights: Winter Very Rare

heavy_snowstorm_1 | Heavy Snowstorm   | false | 2
  steps  : overcast (4h) → cold_rain (4h) → heavy_snow (12h) → snowfall (8h) → frost (6h)
  weights: Winter Rare

heavy_snowstorm_2 | Heavy Snowstorm   | false | 2
  steps  : overcast (4h) → heavy_snow (14h) → snowfall (6h)
  weights: Winter Rare

heavy_snowstorm_3 | Heavy Snowstorm   | false | 3                          · 48h
  steps  : overcast (8h) → heavy_snow (20h) → snowfall (16h) → frost (4h)
  weights: Winter Rare

crisp_winter_day_1 | Crisp Winter Day | false | 0
  steps  : frost (6h) → clear (12h) → still_air (6h)
  weights: Autumn Rare · Winter Common

crisp_winter_day_2 | Crisp Winter Day | false | 0
  steps  : still_air (4h) → frost (4h) → clear (16h)
  weights: Autumn Rare · Winter Common

blizzard_event    | Blizzard          | true  | 14
  steps  : heavy_snow (8h) → blizzard (24h) → heavy_snow (8h) → snowfall (6h) → frost (4h)
  weights: Winter Very Rare

deep_freeze_event | Deep Freeze       | true  | 14
  steps  : cold_snap (8h) → deep_freeze (24h) → cold_snap (8h) → frost (8h)
  weights: Winter Very Rare

ice_storm_event   | Ice Storm         | true  | 7
  steps  : freezing_rain (6h) → ice_storm (18h) → snowfall (6h) → frost (6h)
  weights: Winter Very Rare


─────────────────────────────────────────────
SEASONAL COVERAGE SUMMARY
─────────────────────────────────────────────

All four seasons share the everyday base set (3 variants, all ≤ 24h):
  clear_day · overcast_lull · passing_shower · breezy_clearing · changeable_day (×2)

Spring  — warming, rain, growth
  spring_showers (×3, incl. 48h) · warm_front (×3, incl. 48h)
  spring_storm (×3, incl. 48h) · pleasant_spring (×2) · misty_morning (×2)
  pollen_bloom (×2) · muddy_thaw (×2)
  [severe] spring_downpour

Summer  — heat, storms, fire risk
  sunny_spell (×2) · summer_humidity (×3, incl. 48h)
  afternoon_storm (×2) · still_heat (×3, incl. 48h) · dry_spell (×3, incl. 72h)
  [severe] heat_wave_event · drought_event · dust_storm_event · wildfire_event

Autumn  — cooling, fog, first cold
  autumn_cooling (×3, incl. 48h) · foggy_morning (×2) · blustery_day (×2) · autumn_squall (×2)
  autumn_rain (×3, incl. 48h) · cold_fog_bank (×3, incl. 48h) · first_frost (×2)
  [severe] autumn_gale

Winter  — frost, snow, ice
  crisp_winter_day (×2) · winter_chill (×3, incl. 48h)
  snow_flurry (×2) · light_snowfall (×3, incl. 48h) · heavy_snowstorm (×3, incl. 48h)
  sleet_and_rain (×3, incl. 48h) · winter_fog (×3, incl. 72h)
  [severe] blizzard_event · deep_freeze_event · ice_storm_event


─────────────────────────────────────────────
NOTES
─────────────────────────────────────────────

- Variants share the same display name. Players see e.g. "Spring Showers" regardless
  of which variant fires — the variation is in pacing and duration, not concept.

- All variants of a pattern share the same weights. The Worker draws from the full
  pool, so three Rare variants of autumn_rain collectively draw as much as a single
  Uncommon pattern would. Adjust weights down if a pattern family feels over-represented.

- _3 variants are explicitly multi-day. They are rated Rare or Very Rare so the
  extended arc is a memorable event rather than a routine occurrence. See the WORKER
  BEHAVIOUR section above for how the midnight tick handles them.

- Severe patterns are already multi-day by design (48–80h) and have no variants.
  Admin-triggered events should be intentional and specific.

- Everyday patterns have no multi-day _3 variants. An "extended clear day" is just
  another clear day — the narrative doesn't benefit from it spanning 48h.

- pollen_bloom and muddy_thaw have no multi-day variants. Both are point-in-time
  events tied to specific seasonal transitions; lingering them artificially feels wrong.

- first_frost has no multi-day variant. It's a single notable moment, not a system.

- drought_event (severe, 80h total) is the intended design for a week-scale dry arc.
  dry_spell_3 (72h, non-severe) gives the Worker a natural long dry stretch without
  admin intervention — escalation to drought_event remains a deliberate admin choice.

- winter_fog_3 (72h) is the longest non-severe pattern. Three days of dense fog with
  no clearing is genuinely unusual and should feel oppressive when it fires.

- spring_storm_3 escalates to heavy_rain, which is not severe. This is intentional —
  it represents a natural multi-day storm system, distinct from spring_downpour which
  hits the severe downpour state and requires admin trigger.

- light_snowfall_3 escalates to heavy_snow midway, then winds back down to snowfall
  and frost. This is a snowstorm that builds overnight then tapers — narratively a 2-day
  snow event, not a blizzard.

- changeable_day has weights in all four seasons but is never Common anywhere. It
  represents genuinely restless weather — conditions that keep shifting without settling
  into a clear pattern. Uncommon in Spring/Autumn, Rare in Summer/Winter.

- misty_morning is the lighter alternative to foggy_morning. Where foggy_morning opens
  on dense_fog, misty_morning opens on misty and resolves into sunshine. Anchored in
  Spring but also eligible in Summer and Autumn.

- still_heat fills the gap between sunny_spell and the severe heat_wave. It features
  still_air as the anchor state — stifling, airless summer heat with no breeze.
  The 48h _3 variant represents a genuine stagnant air mass sitting over the region.

- blustery_day fills the gap between breezy_clearing (which always resolves calm) and
  the severe autumn_gale. A blustery_day stays windy throughout — it never fully clears,
  and never escalates to gale. Available in Spring, Autumn, and Winter; not Summer.

- crisp_winter_day is the only winter pattern that resolves to clear sky without
  precipitation. Frost and still_air make it the coldest-feeling non-severe pattern
  in the set — a bright, bitter day.

- pleasant_spring is Spring-only. It uses warm and sunny without going muggy or hot,
  filling the gap between the generic everyday set and the wetter/stormier spring
  patterns. sunny_spell (Spring Uncommon) was the closest alternative but its hot
  steps read as summer heat rather than spring warmth.

- autumn_squall pairs wind with cold rain — the experience blustery_day and autumn_rain
  individually can't produce. cooldown_days = 1 keeps back-to-back squalls from
  dominating an autumn stretch.

- snow_flurry is intentionally short (18-20h total). The final step holds until
  midnight per the Worker behaviour rules, so it behaves as a brief morning snow that
  clears to a partly cloudy or clear afternoon — a distinctly different feel from the
  sustained arcs in light_snowfall. Rated Common in Winter so players experience it
  regularly as a light wintry touch.
