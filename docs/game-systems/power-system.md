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
    Renewable   ambient natural energy (wind, solar, water flow)

Items carry a fuelTypeId. When deposited into an active source, the item's
fuelValue is added to Structure.currentFuel (active sources only).


─────────────────────────────────────────────
3. POWER SOURCES
─────────────────────────────────────────────

A power-source StructureDef has exactly one StructureDef_FuelConfig row.

──────────────────────
StructureDef_FuelConfig
──────────────────────

  isPassive            Boolean. False = active generator (fueled by item deposits;
                                   items matching an input fuel type are destroyed on
                                   deposit and their fuelValue added to
                                   Structure.currentFuel). True = passive generator
                                   (fueled automatically by the worker each tick based
                                   on active env conditions; no item deposits).
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

A passive source with baseGenerationPerHour = 0 AND no EnvCondition rows generates
nothing — this is a misconfiguration flagged at the app layer. A source with a
non-zero baseGenerationPerHour is valid without env condition rows; it simply
generates at the fixed base rate with no bonus scaling.

RUNTIME STATE
──────────────
  Structure.currentFuel      Float?   null = not a power source. 0–fuelCapacity
                                      when power type.
  Structure.isFuelActive     Boolean  Source toggle. Worker only drains or generates
                                      fuel when true. Set by the faction leader to
                                      turn a source on or off. Cannot be set to true
                                      while the power_loss env condition is active.
  Structure.powerSortOrder   Int?     Camp-scope sources only. Worker drains the
                                      lowest value first. null = not a camp-scope source.


─────────────────────────────────────────────
3b. BATTERY ITEMS
─────────────────────────────────────────────

Battery-type items carry charge that can be transferred to or from a compatible
power source. Unlike consumable fuel items (wood, coal, tallow), batteries are
never destroyed on use — they remain as StoredItems at their updated charge level.

An item is a battery if it has the Battery ItemType tag AND non-null fuelTypeId
and fuelValue. For batteries, fuelValue is the max charge capacity. For consumables,
fuelValue is the units deposited and the item is destroyed on deposit.

StoredItem.currentFuelLevel tracks remaining charge:
  - Initialized to Item.fuelValue (full charge) when the StoredItem is created.
  - Decremented on discharge; incremented on charge.
  - null on all non-battery StoredItems.

ENABLING BATTERY USE ON A STRUCTURE
  StructureDef_FuelConfig.allowsBatteryUse must be true. The structure's
  InputFuelType set must also include the battery's fuelTypeId — the same type
  check that applies to consumable deposits.

DISCHARGE (battery → structure)
  Entity selects a battery and a target power structure (allowsBatteryUse = true).
  Entity chooses an amount up to the allowed maximum.

  maxTransfer = min(battery.currentFuelLevel, structure.fuelCapacity − structure.currentFuel)
  battery.currentFuelLevel  −= amount   (amount ≤ maxTransfer)
  structure.currentFuel     += amount

CHARGE (structure → battery)
  Entity selects a battery and a target power structure (allowsBatteryUse = true).
  Direction is reversed; same cap logic applies.

  maxTransfer = min(Item.fuelValue − battery.currentFuelLevel, structure.currentFuel)
  battery.currentFuelLevel  += amount   (amount ≤ maxTransfer)
  structure.currentFuel     −= amount

Full discharge/charge is simply entering the maximum — it uses the same code path.
An empty battery (currentFuelLevel = 0) stays in storage and can be recharged,
used as a crafting ingredient, or otherwise interacted with.


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

  Structure.powerPriority            Int      Load-shedding order (default 0). When
                                              fuel runs low mid-tick, higher priority
                                              consumers are satisfied before lower ones.
                                              Ties broken by Structure.id (ascending).

  Structure_AppliedUpgrade.isPoweredOn Boolean Same consumer toggle, per upgrade
                                              application. When false, that upgrade's
                                              effects are suspended and no fuel is
                                              drawn for it.

  Structure_AppliedUpgrade.powerPriority Int  Same load-shedding priority as above,
                                              per upgrade application.


─────────────────────────────────────────────
5. WORKER RESOLUTION
─────────────────────────────────────────────

The worker processes power once per tick (hourly).

STEP 0 — POWER LOSS CHECK:
  If the power_loss env condition is active for the guild, skip all power
  processing. All isPowered consumers are treated as unsatisfied this tick.
  No fuel is generated or drained.

FOR EACH ACTIVE POWER SOURCE (isFuelActive = true, currentFuel > 0):

  1. Passive generation (if isPassive = true):
       Compute totalGeneration from baseGenerationPerHour + env condition bonuses.
       currentFuel = MIN(fuelCapacity, currentFuel + totalGeneration)

  2. Identify consumers this source can satisfy (scope + type matching, section 4).

  3. Sort qualifying consumers by powerPriority descending (highest first).
     Ties broken by Structure.id / Structure_AppliedUpgrade.id (ascending).

  4. For each consumer with isPoweredOn = true (in priority order):
       a. Check satisfaction: scope, type match, currentFuel > 0.
       b. If satisfied: deduct fuelCostPerHour from currentFuel.
          currentFuel may not go below 0.
       c. If not satisfied (no fuel remaining, source inactive, or type mismatch):
          the consumer is unsatisfied this tick — powered effects suspended.
          Remaining lower-priority consumers also fall through if fuel is exhausted.

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

Upgrade effectTypes valid for power-type StructureDefs (isPower = true):

  fuel_capacity      Increases fuelCapacity by effectValue per application.
                     e.g. +50 units per upgrade level.

  fuel_efficiency    Reduces the fuelCostPerHour for consumers satisfied by this
                     source. effectValue applied as a reduction multiplier per
                     application. Scope controlled by efficiencyConsumerScopeId
                     (FK → TargetScope, isEfficiencyConsumerScope = true):
                       null             — all consumers (default)
                       all              — all consumers (explicit)
                       structures_only  — StructureDef consumers only
                       upgrades_only    — StructureDef_Upgrade consumers only

  passive_gen_rate   Increases baseGenerationPerHour by effectValue per application.
                     Only meaningful on passive sources (isPassive = true); ignored on active.

  damage_resistance  Reduces damage taken from hostile events (shared across all types).
  filth_reduction    Reduces daily filth contribution (shared across all types).


─────────────────────────────────────────────
7. ENV-DRIVEN POWER LOSS
─────────────────────────────────────────────

The engine seeds a special EnvCondition with codeName = "power_loss". When this
condition is active in a guild, the worker skips all power processing for that
tick and treats every isPowered consumer as unsatisfied.

Guild owners attach power_loss to any WeatherState they choose — it is just
another env condition stacked alongside others. This lets guilds build any
thematic scenario that disables power:

  SOLAR FLARE PATTERN   — WeatherState carries: harsh_sunlight + power_loss
  ARCANE STORM PATTERN  — WeatherState carries: storm + alchemical_surge + power_loss
  EARTHQUAKE PATTERN    — WeatherState carries: dusty + muddy + power_loss
  MAGICAL INTERFERENCE  — WeatherState carries: power_loss alone

The condition has no inherent world modifiers of its own (filth, spoilage, etc.) —
its sole engine effect is the power shutdown. All atmospheric flavour comes from
the other conditions the guild pairs with it.

isFuelActive cannot be set to true on any Structure while power_loss is active.
The guild sees a clear status indicator that power is suspended by weather.


─────────────────────────────────────────────
8. SCHEMA SUMMARY
─────────────────────────────────────────────

  FuelType                            — static seed: Burnable | Electric | Steam | Alchemical | Renewable
  EnvCondition (power_loss)           — seeded engine condition; worker skips all power processing while active
  StructureDef_FuelConfig             — isPassive (passive generator flag), scopeId (FK → TargetScope), fuelCapacity,
                                        baseGenerationPerHour, allowsBatteryUse
  StructureDef_FuelConfig_InputFuelType  — fuel item types a source accepts as deposits (and battery fuel type checks)
  StructureDef_FuelConfig_OutputFuelType — fuel types a source produces
  StructureDef_FuelConfig_EnvCondition   — env conditions driving passive generation rate
  StructureDef_AcceptedFuelType          — output fuel types a powered StructureDef accepts; empty = any
  StructureDef_Upgrade_AcceptedFuelType  — same, for powered upgrades
  StructureDef_Upgrade_Effect.efficiencyConsumerScopeId — FK → TargetScope (isEfficiencyConsumerScope); restricts fuel_efficiency to structures, upgrades, or all; null = all
  Structure.powerPriority             — Int; consumer load-shedding priority; higher satisfied first
  Structure_AppliedUpgrade.powerPriority — same, per upgrade application
  StoredItem.currentFuelLevel         — Float?; battery charge state; null on non-battery items
