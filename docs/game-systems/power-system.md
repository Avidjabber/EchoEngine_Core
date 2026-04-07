POWER SYSTEM — DESIGN REFERENCE
================================
Last updated: 2026-04-06

This file is the authoritative reference for how the power system works in
EchoPaw. Read this before writing power-source seeding, crafting/farming
structure upgrades that require power, or any worker logic that drains fuel
or checks consumer satisfaction.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

The power system connects power-source structures to the structures and
upgrades that require power to function. It is a typed, scoped dependency
system: sources produce fuel units of one or more FuelTypes; consumers
declare which FuelTypes they accept and how much fuel they cost per hour.

The worker resolves power once per tick (hourly):
  - For each active power source, drain fuel consumed by its satisfied consumers.
  - Any consumer with no satisfying active source is marked unsatisfied —
    its powered functionality is suspended until a source becomes available.

Two actors:
  SOURCES  — StructureDefs with structureTypeId = power. Config lives in
             StructureDef_FuelConfig. Runtime state on Structure.
  CONSUMERS — Any StructureDef or StructureDef_Upgrade with isPowered = true.
              Power requirements are independent of StructureType — a storage
              structure with a powered refrigeration upgrade is valid.


─────────────────────────────────────────────
2. FUEL TYPES
─────────────────────────────────────────────

FuelType is a static seed table. It declares what category of energy a source
produces and what category a consumer requires. Matching happens on output type
vs. accepted type (see section 5).

  Seeded values:
    Burnable    conventional combustible fuel (wood, coal, tallow)
    Electric    electrical energy (batteries, charged cells)
    Steam       pressurised steam (boilers, steam canisters)
    Alchemical  alchemical or magical energy (reagent canisters, mana cells)

Items carry a fuelTypeId. When deposited into an active source, the item's
fuelValue is added to Structure.currentFuel (active sources only).


─────────────────────────────────────────────
3. POWER SOURCES
─────────────────────────────────────────────

A power-source StructureDef has exactly one StructureDef_FuelConfig row.

──────────────────────
StructureDef_FuelConfig
──────────────────────

  isActive             Boolean. True = source is a passive generator (fueled
                                   automatically by the worker each tick based on
                                   active env conditions; no item deposits). False =
                                   source is an active generator (fueled by item
                                   deposits; items matching an input fuel type are
                                   destroyed on deposit and their fuelValue added to
                                   Structure.currentFuel).
                                   Rate for passive sources defined per condition in
                                   StructureDef_FuelConfig_EnvCondition.

  scopeId              FK → TargetScope (isPowerScope = true). Determines which
                       consumers this source can satisfy.

                       structure — satisfies only the structure this power source
                                   is built into. Requires the StructureDef to be
                                   a multi-type def that includes the power type
                                   alongside the powered type(s). The power source
                                   powers that structure and nothing else.

                       camp      — satisfies all isPowered structures and upgrades
                                   in the same camp whose fuel type requirements
                                   are met. Multiple camp-scope sources in the same
                                   camp are drained in powerSortOrder order (lowest
                                   first; ties broken by Structure.id).

                       location  — satisfies all isPowered structures and upgrades
                                   across every camp at the same location. Useful
                                   for large shared infrastructure.

                       faction   — satisfies all isPowered structures and upgrades
                                   across the entire faction, regardless of location.
                                   Reserved for high-tier infrastructure.

  fuelCapacity         Float. Maximum fuel units the source can hold.
                       1 unit = 1 hour of consumption at rate 1.0.
                       Upgradeable via the fuel_capacity effect type.

  baseGenerationPerHour Float? Passive sources only — base fuel units generated
                         per hour before env condition bonuses. Null on active
                         sources (gain only from item deposits).

INPUT FUEL TYPES (active sources)
────────────────────────────────────
StructureDef_FuelConfig_InputFuelType — one row per FuelType this source accepts
as item deposits. Each deposited item's fuelTypeId must match one of these rows.
No rows = source accepts no item deposits (passive-only or input-free designs).

OUTPUT FUEL TYPES
──────────────────
StructureDef_FuelConfig_OutputFuelType — one row per FuelType this source produces.
Consumers match against these when checking whether a source satisfies them.
A source may produce multiple output types (e.g. a multi-output generator
producing both Burnable heat and Electric power simultaneously).

PASSIVE GENERATION FROM ENV CONDITIONS
────────────────────────────────────────
StructureDef_FuelConfig_EnvCondition — one row per env condition that boosts a
passive source's generation rate.

  envConditionId         FK → EnvCondition
  generationRatePerStack Float. Fuel units added per hour per active stack of
                          this condition. Default 1.0.

Each worker tick, the passive source's fuel gain is:
  totalGeneration = baseGenerationPerHour
                  + Σ(stackCount × generationRatePerStack) for each active condition
  Structure.currentFuel = MIN(fuelCapacity, currentFuel + totalGeneration)

A passive source with no StructureDef_FuelConfig_EnvCondition rows generates
nothing — this is a misconfiguration flagged at the app layer.

RUNTIME STATE
──────────────
  Structure.currentFuel      Float?   null = not a power source. 0–fuelCapacity
                                      when power type.
  Structure.isFuelActive     Boolean  Source toggle. Worker only drains or generates
                                      fuel when true. Set by the faction leader to
                                      turn a source on or off.
  Structure.powerSortOrder   Int?     Camp-scope sources only. Worker drains the
                                      lowest value first. null = not a camp-scope source.


─────────────────────────────────────────────
4. POWER CONSUMERS
─────────────────────────────────────────────

Any StructureDef or StructureDef_Upgrade can declare a power requirement.
The two fields are identical on both tables:

  isPowered          Boolean. True = requires an active, satisfying power source.
                     When false — or when no satisfying source exists — powered
                     functionality is suspended. false = no power requirement.

  fuelCostPerHour    Float? Fuel units deducted from the satisfying source each
                     worker tick. Null when isPowered = false.

ACCEPTED FUEL TYPES
────────────────────
StructureDef_AcceptedFuelType — which output FuelTypes this StructureDef's power
requirement accepts. Empty = any output type satisfies it.
StructureDef_Upgrade_AcceptedFuelType — same, for powered upgrades.

Matching rule: a source satisfies a consumer if:
  1. The source is active (isFuelActive = true, currentFuel > 0).
  2. The source's scope covers the consumer (structure-scoped: same Structure row;
     camp-scoped: same camp; location-scoped: same location; faction-scoped: same faction).
  3. The consumer's AcceptedFuelType set is empty, OR at least one of the
     source's output types appears in the consumer's accepted types.

RUNTIME STATE
──────────────
  Structure.isPoweredOn              Boolean  Consumer toggle. When false, the
                                              structure's powered functionality is
                                              disabled and no fuel is drawn from
                                              the source. The faction leader can
                                              toggle this to shed load.

  Structure_AppliedUpgrade.isPoweredOn Boolean Same consumer toggle, per upgrade
                                              application. When false, that upgrade's
                                              effects are suspended and no fuel is
                                              drawn for it.


─────────────────────────────────────────────
5. WORKER RESOLUTION
─────────────────────────────────────────────

The worker processes power once per tick (hourly).

FOR EACH ACTIVE POWER SOURCE (isFuelActive = true, currentFuel > 0):

  1. Passive generation (if generatorType = "passive"):
       Compute totalGeneration from baseGenerationPerHour + env condition bonuses.
       currentFuel = MIN(fuelCapacity, currentFuel + totalGeneration)

  2. Identify consumers this source can satisfy (scope + type matching, section 4).

  3. For each consumer with isPoweredOn = true:
       a. Check satisfaction: scope, type match, currentFuel > 0.
       b. If satisfied: deduct fuelCostPerHour from currentFuel.
          currentFuel may not go below 0.
       c. If not satisfied (no fuel remaining, source inactive, or type mismatch):
          the consumer is unsatisfied this tick — powered effects suspended.

CAMP-SCOPE DRAIN ORDER:
  When multiple camp-scope sources exist in the same camp, the worker drains
  the one with the lowest Structure.powerSortOrder first. Ties broken by
  Structure.id (ascending). Once a source is empty, the worker moves to the
  next in order. This gives guilds fine-grained control over which sources
  act as primary vs. backup.

STRUCTURE-SCOPE:
  A structure-scoped source is built into the structure it powers (multi-type def).
  The worker satisfies only the Structure row this source belongs to — no external
  links or lookup needed.


─────────────────────────────────────────────
6. UPGRADES FOR POWER STRUCTURES
─────────────────────────────────────────────

Upgrade effectTypes valid for power-type StructureDefs (isFuel = true):

  fuel_capacity      Increases fuelCapacity by effectValue per application.
                     e.g. +50 units per upgrade level.

  fuel_efficiency    Reduces the fuelCostPerHour for consumers satisfied by this
                     source. effectValue applied as a reduction multiplier per
                     application.

  passive_gen_rate   Increases baseGenerationPerHour by effectValue per application.
                     Only meaningful on passive sources; ignored on active.

  damage_resistance  Reduces damage taken from hostile events (shared across all types).
  filth_reduction    Reduces daily filth contribution (shared across all types).


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  FuelType                            — static seed: Burnable | Electric | Steam | Alchemical
  StructureDef_FuelConfig             — isActive (passive vs active generator), scopeId (FK → TargetScope), capacity, base generation rate
  StructureDef_FuelConfig_InputFuelType  — fuel item types a source accepts as deposits
  StructureDef_FuelConfig_OutputFuelType — fuel types a source produces
  StructureDef_FuelConfig_EnvCondition   — env conditions driving passive generation rate
  StructureDef_AcceptedFuelType          — output fuel types a powered StructureDef accepts; empty = any
  StructureDef_Upgrade_AcceptedFuelType  — same, for powered upgrades
