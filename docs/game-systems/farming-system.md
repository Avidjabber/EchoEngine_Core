FARMING SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-04-03

[NOT YET IMPLEMENTED — This is a placeholder capturing the intended design.
The schema hooks for this system are in place. Do not build against this doc
without first confirming the design with the project owner.]


─────────────────────────────────────────────
1. INTENT
─────────────────────────────────────────────

The farming system allows entities to cultivate crops and plants at designated
locations. It builds on the existing environment and crafting systems rather
than introducing separate mechanics.

Design goals:
  - Guilds can establish herb gardens and crop fields at specific locations
  - Growth speed is driven by the environment stacking system (plant_growth modifier)
  - Compost from the crafting system feeds into soil quality
  - Cultivated locations benefit from the Cultivated EnvCondition


─────────────────────────────────────────────
2. EXISTING HOOKS (ALREADY IN PLACE)
─────────────────────────────────────────────

The following are already seeded and ready:

  plant_growth EnvModifierType
    Multiplier on crop/plant growth rate. Stacks with other env conditions.
    Values are set on all relevant EnvConditions in seed-data.md.

  Cultivated EnvCondition
    plant_growth=2.0 — major growth boost for managed land.
    Seeded as the inherent condition for Farmland and Suburban biomes.
    Can also be applied via Location_EnvCondition to any location with
    an active garden or herb plot.

  Compost CraftingInteraction
    Breaks down rotten food, spoiled herbs, and plant scraps.
    Currently produces no output items — ingredients are consumed.
    Once the farming system is built, Compost outputs will feed into
    a soil quality or fertilizer mechanic.

  Farmland Biome
    color: 11061360 (#A8C870)
    inherentConditions: cultivated:1
    Used to tag locations that are designated growing areas.


─────────────────────────────────────────────
3. PLANNED SCOPE (ROUGH OUTLINE)
─────────────────────────────────────────────

The farming system is intended to include:

  - Plot management  — guilds designate location(s) as farming plots
  - Crop definitions — seeded and guild-defined growable plant items
  - Growth cycles    — time-based progression driven by plant_growth modifier
  - Harvest actions  — an ActionType for harvesting; yields herb_amount bonus
  - Soil quality     — compost improves yield; filth/toxic conditions degrade it
  - Structure dependency — may require a Garden Bed or Herb Rack structure
    (structure system not yet implemented)

This doc will be expanded when implementation begins.


─────────────────────────────────────────────
4. RELATIONSHIP TO OTHER SYSTEMS
─────────────────────────────────────────────

  Environment    — plant_growth modifier from env conditions drives growth rate.
                   Cultivated + Sunny + Warm + Damp stacking creates prime conditions.

  Crafting       — Compost recipe provides soil enrichment input.
                   Harvested crops feed into existing herb/recipe items.

  Actions        — Harvesting will be an ActionType granting Farming discipline XP.
                   See action-system.md and discipline-system.md.

  Disciplines    — Farming discipline level gates advanced recipes and yield bonuses.
                   See discipline-system.md.

  Items          — Harvested output items are standard Item rows.
                   No new item storage system is needed.
