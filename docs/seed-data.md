GLOBAL SEED DATA — REFERENCE
==============================
Last updated: 2026-04-03

This file defines all global seed values for EchoPaw. Work through each
table one at a time. Mark a table as DONE when its values are finalised.

Tables are grouped by category. "Static" tables are fixed and never change
at runtime. "Global-default" tables use guildId = "global" and can be
extended by guilds after seeding.


═══════════════════════════════════════════════════════════════════════
STATIC LOOKUP TABLES
(no guildId — fixed values, never altered via the app)
═══════════════════════════════════════════════════════════════════════

──────────────────────────────────────────────
Season                                  [ DONE ]
──────────────────────────────────────────────
Season_EnvCondition contributes 1 stack of each linked condition (no stacks field — always 1).

  name    envConditions (Season_EnvCondition)
  Spring  newleaf_bloom
  Summer  greenleaf_heat
  Fall    leaffall_plenty
  Winter  leafbare_lean


──────────────────────────────────────────────
EntityStatus                            [ DONE ]
──────────────────────────────────────────────
Values:
  Active
  Inactive
  Hiatus


──────────────────────────────────────────────
EntityType                              [ DONE ]
──────────────────────────────────────────────
  name             canModifyStats  canParticipateCombat  canParticipateEvents  adminOnly
  NPC              false           true                  false                 true
  Side Character   false           true                  true                  false
  Main Character   true            true                  true                  false


──────────────────────────────────────────────
SpeciesType                             [ DONE ]
──────────────────────────────────────────────
Role types (connect to gameplay systems):
  Playable
  Prey
  Predator
  Pet
  Livestock
  Vermin

Biological types (taxonomy; a species can carry both a role and a biological type):
  Mammal
  Bird
  Reptile
  Amphibian
  Fish
  Insect
  Arachnid
  Crustacean

Habitat types (environment; orthogonal to biology — e.g. a whale is Mammal + Aquatic):
  Aquatic
  Aerial
  Subterranean


──────────────────────────────────────────────
Sex                                     [ DONE ]
──────────────────────────────────────────────
Values:
  Male
  Female
  Intersex

──────────────────────────────────────────────
Gender                                  [ DONE ]
──────────────────────────────────────────────
Values:
  Male
  Female
  Non-binary
  Other


──────────────────────────────────────────────
Stat                                    [ DONE ]
──────────────────────────────────────────────
Values:
  Strength
  Dexterity
  Constitution
  Intelligence
  Wisdom
  Charisma


──────────────────────────────────────────────
LocationStatus                          [ DONE ]
──────────────────────────────────────────────
Values:
  Owned
  Disputed

  Note: Shared = multiple Owned rows. Unclaimed = no Location_Faction rows.


──────────────────────────────────────────────
ItemType                                [ DONE ]
──────────────────────────────────────────────
Values:
  Weapon
  Armor
  Shield
  Trait
  Ability
  Spell
  Tool
  Plant
  Medicine
  Fuel_Burnable
  Fuel_Electric
  Fuel_Steam
  Fuel_Alchemical
  Food
  Ore
  Ingot
  Gem
  Leather


──────────────────────────────────────────────
ItemInteraction                         [ DONE ]
──────────────────────────────────────────────
  name     description
  eat      Consumed orally as solid food or a bolus.
  drink    Consumed orally as a liquid, broth, or tea.
  apply    Applied directly to skin, fur, or a wound as a poultice or salve.
  inhale   Breathed in as vapour, steam, or airborne particles.
  burn     Set alight to produce smoke or char for direct use.


──────────────────────────────────────────────
ItemActionType                          [ DONE ]
──────────────────────────────────────────────
  name    dealsDamage  restoresHealth  appliesCondition  isHarmful
  attack  true         false           false             true
  heal    false        true            false             false
  buff    false        false           true              false
  debuff  false        false           true              true
  summon  false        false           false             false


──────────────────────────────────────────────
RelationType                            [ DONE ]
──────────────────────────────────────────────
Replaces: ItemEffectType, ConditionLinkType
Developer-seeded only. Boolean flags control which systems each value is valid for.

  name        isConditionSystem  isStructureSystem  isSkillSystem  isItemSystem  isCraftingSystem
  ──────────  ─────────────────  ─────────────────  ─────────────  ────────────  ────────────────
  requires    false              true               true           false         true
  block       true               true               true           false         false
  upgrades    false              true               true           false         false
  treat       false              false              false          true          false
  worsen      true               false              false          true          false
  cure        false              false              false          true          false
  transform   false              false              false          true          false
  recover     true               false              false          false         false
  spawn       true               false              false          false         false
  spreads_as  true               false              false          false         false
  improves    false              false              true           false         true


──────────────────────────────────────────────
FuelType                                [ DONE ]
──────────────────────────────────────────────
Static seed values. Declares what category of fuel a power source structure accepts.
Items carry a matching fuelTypeId. Power consumers (isPowered = true) do not filter by
fuel type — matching only applies between items and the source that accepts them.

Constraint: each item has a single fuelValue. If an item qualifies as multiple fuel types,
it yields the same point value regardless of which source it is deposited into.

Values:
  Burnable
  Electric
  Steam
  Alchemical


──────────────────────────────────────────────
StructureType                           [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Guilds reference these when defining their own StructureDefs.
Each type has a corresponding config table (except storage, which uses Structure_Storage directly).

  name      config table                    notes
  ────────  ──────────────────────────────  ────────────────────���─────────────────────────────────
  storage   Structure_Storage               capacity, rot modifier, item type restrictions
  farming   StructureDef_FarmingConfig      plot count, plot type, soil quality
  housing   StructureDef_HousingConfig      comfortable/max capacity, overcrowding filth bonus
  medical   StructureDef_MedicalConfig      treatment/exam roll bonus, recovery modifier, contagion resist
  compost   StructureDef_CompostConfig      conversion days, weight/volume capacity; MUST pair with storage
  crafting  StructureDef_CraftingConfig     crafting roll bonus, output quantity bonus, supported interactions
  fuel      StructureDef_FuelConfig         generatorType (active|passive), scope (structure|camp|location|faction), capacity, burn rate;
            —                               active: accepts item deposits matching fuelTypeId
            —                               passive: generates from env conditions via StructureDef_FuelConfig_EnvCondition
            —                               structure: explicit targets via Structure_FuelTarget (one per target)
            —                               camp: satisfies all isPowered in the same camp
            —                               location: satisfies all isPowered across all camps in the location
            —                               faction: satisfies all isPowered across the entire faction


──────────────────────────────────────────────
UpgradeEffectType                       [ DONE ]
──────────────────────────────────────────────
Developer-seeded only. Each row names an upgrade effect and declares which
StructureType categories accept it. The worker switches on name to apply logic.
validFor = comma-separated list; "all" = every structure type.

  name                  validFor                                    requiresEnvTarget  isFuel
  ────────────────────  ──────────────────────────────────────────  ─────────────────  ──────
  solid_capacity        storage                                     false              false
  liquid_capacity       storage                                     false              false
  rot_modifier          storage                                     false              false
  security_rating       storage                                     false              false
  plot_count            farming                                     false              false
  growth_rate           farming                                     false              false
  season_override       all                                         false              false
  env_override          all                                         true               false
  soil_quality          farming                                     false              false
  comfortable_capacity  housing                                     false              false
  max_capacity          housing                                     false              false
  treatment_bonus       medical                                     false              false
  exam_bonus            medical                                     false              false
  recovery_modifier     medical                                     false              false
  contagion_resist      medical                                     false              false
  crafting_roll_bonus   crafting                                    false              false
  output_quantity_bonus crafting                                    false              false
  conversion_speed      compost                                     false              false
  fuel_capacity         fuel                                        false              true
  fuel_efficiency       fuel                                        false              true
  passive_gen_rate      fuel                                        false              true
  weight_capacity       compost                                     false
  volume_capacity       compost                                     false
  damage_resistance     all                                         false
  filth_reduction       all                                         false


──────────────────────────────────────────────
MeasurementType                         [ DONE ]
──────────────────────────────────────────────
  name    unit
  Weight  g
  Count   units
  Volume  ml


──────────────────────────────────────────────
IngredientType                          [ DONE ]
──────────────────────────────────────────────
  null measurementType = descriptive/modifier tag with no canonical measurement

  name        measurementType
  Dried       —
  Cooked      —
  Rotten      —
  Sweet       —
  Bitter      —
  Sour        —
  Savory      —
  Spicy       —
  Mild        —
  Tea         —
  Poultice    —
  Salve       —
  Tincture    —
  Broth       —
  Meal        —
  Meat        Weight
  Fat         Weight
  Clay        Weight
  Ground      Weight
  Paste       Weight
  Mash        Weight
  Shredded    Weight
  Char        Weight
  Flower      Count
  Leaf        Count
  Stalk       Count
  Root        Count
  Seed        Count
  Bark        Count
  Berry       Count
  Bud         Count
  Mushroom    Count
  Pelt        Count
  Feather     Count
  Bone        Count
  Sinew       Count
  Egg         Count
  Wood        Count
  Stone       Count
  Vine        Count
  Reed        Count
  Shell       Count
  Fiber       Count
  Cobweb      Count
  Moss        Count
  Ore         Count
  Ingot       Count
  Gem         Count
  Hide        Count
  Leather     Count
  Cloth       Count
  Ceramic     Count
  Coal        Weight
  Slag        Weight
  Liquid      Volume
  Juice       Volume
  Oil         Volume
  Resin       Volume


──────────────────────────────────────────────
CraftingInteraction                     [ DONE ]
──────────────────────────────────────────────
  name     description
  Brew     Steep ingredients in hot water to extract properties into a drinkable liquid.
  Dry      Remove moisture from an ingredient through air or gentle heat, preserving it and concentrating its properties.
  Grind    Break down dried or hard ingredients into a powder or paste using friction.
  Mash     Crush soft ingredients into a wet, pulpy mash without drying.
  Bake     Apply sustained dry heat to transform ingredients into a solid, edible form.
  Render   Melt animal fat over low heat to produce a purified liquid oil.
  Crush    Apply sharp pressure to break apart hard ingredients such as seeds, shells, or bark.
  Butcher  Break down a carcass or prey item into usable parts such as meat, fat, bone, and pelt.
  Craft    Assemble raw materials into a finished item using skill and tools.
  Carve    Shape bone, stone, or wood into a finished form using a cutting tool.
  Weave    Interlace fibers, vines, or reeds into cloth, cord, or woven goods.
  Tan      Treat a raw hide to produce durable leather.
  Smelt    Melt raw ore in a furnace to produce refined metal ingots.
  Forge    Shape a heated ingot into tools, weapons, or armor using hammer and anvil.
  Temper   Harden and refine metal through repeated cycles of heating and cooling.
  Kiln     Fire clay or ceramic items at high heat to produce hardened, permanent forms.

  NOTE: structure requirements (e.g. Smelt requires a forge) are NOT baked into the interaction
  definition. They are configured per-guild via Guild_CraftingInteractionRule. Global defaults
  may be provided in a future seeding pass once guilds have defined their structure defs.


──────────────────────────────────────────────
RecipeOutputMode                        [ DONE ]
──────────────────────────────────────────────
Values:
  fixed
  proportional


──────────────────────────────────────────────
EquipmentSlotType                       [ DONE ]
──────────────────────────────────────────────
  name   defaultCapacity  isUnlimited
  Hand   1                false
  Chest  1                false
  Head   1                false
  Innate 1                true


──────────────────────────────────────────────
CombatTargetScope                       [ DONE ]
──────────────────────────────────────────────
  name         targetsSelf  targetsSingle  targetsAllies  targetsEnemies
  self         true         false          false          false
  single       false        true           false          false
  all_allies   false        false          true           false
  all_enemies  false        false          false          true
  all          false        false          true           true


──────────────────────────────────────────────
CombatInitiationType                    [ DONE ]
──────────────────────────────────────────────
  name   canResultInDeath  isScripted  allowsFleeing  canSecondWind
  spar   false             false       false          true
  event  true              false       true           true
  boss   true              true        true           true


──────────────────────────────────────────────
CombatOutcome                           [ DONE ]
──────────────────────────────────────────────
  name       isVictory  isDefeat  isDraw  isExpired
  win        true       false     false   false
  lose       false      true      false   false
  draw       false      false     true    false
  completed  false      false     false   true


──────────────────────────────────────────────
CombatActionCategory                    [ DONE ]
──────────────────────────────────────────────
  name          actionsAllowedPerRound  description
  Main Action   1                       Standard action — one allowed per turn.
  Bonus Action  1                       Supplemental action — one allowed per turn alongside a Main Action.


──────────────────────────────────────────────
CombatTargetStrategy                    [ DONE ]
──────────────────────────────────────────────
Values:
  lowest_health
  highest_health
  lowest_strength
  random


──────────────────────────────────────────────
CombatEffectType                        [ DONE ]
──────────────────────────────────────────────
  name              isPerRound  dealsDamage  restoresHealth  modifiesRoll  modifiesStat  deniesActions  modifiesAC  grantsAdvantage  grantsDisadvantage  redirectsDamage  forcesTargeting  isReactive  absorbsDamage  grantsEvasion  enablesCounterattack  suppressesReactive  removesEffects  preventedAsTarget
  damage_per_round  true        true         false           false         false         false          false       false            false               false            false            false       false          false          false                 false               false           false
  heal_per_round    true        false        true            false         false         false          false       false            false               false            false            false       false          false          false                 false               false           false
  hit_mod           false       false        false           true          false         false          false       false            false               false            false            false       false          false          false                 false               false           false
  damage_mod        false       false        false           true          false         false          false       false            false               false            false            false       false          false          false                 false               false           false
  stat_mod          false       false        false           false         true          false          false       false            false               false            false            false       false          false          false                 false               false           false
  action_denial     false       false        false           false         false         true           false       false            false               false            false            false       false          false          false                 false               false           false
  ac_mod            false       false        false           false         false         false          true        false            false               false            false            false       false          false          false                 false               false           false
  advantage         false       false        false           true          false         false          false       true             false               false            false            false       false          false          false                 false               false           false
  disadvantage      false       false        false           true          false         false          false       false            true                false            false            false       false          false          false                 false               false           false
  guard             false       false        false           false         false         false          false       false            false               true             false            false       false          false          false                 false               false           false
  taunt             false       false        false           false         false         false          false       false            false               false            true             false       false          false          false                 false               false           false
  parry             false       false        false           false         false         false          false       false            false               false            false            true        false          false          false                 false               false           false
  absorb            false       false        false           false         false         false          false       false            false               false            false            false       true           false          false                 false               false           false
  dodge_stance      false       false        false           false         false         false          false       false            false               false            false            false       false          true           false                 false               false           false
  counterattack     false       false        false           false         false         false          false       false            false               false            false            true        false          false          true                  false               false           false
  suppress          false       false        false           false         false         false          false       false            false               false            false            false       false          false          false                 true                false           false
  dispel            false       false        false           false         false         false          false       false            false               false            false            false       false          false          false                 false               true            false
  untargetable      false       false        false           false         false         false          false       false            false               false            false            false       false          false          false                 false               false           true


──────────────────────────────────────────────
DamageCategory                          [ DONE ]
──────────────────────────────────────────────
Values:
  Physical  — reduced by physical armor/defense
  Magical   — bypasses physical armor; checked against magical resistance
  True      — bypasses all defenses; cannot be resisted or immuned


──────────────────────────────────────────────
ConditionContext                        [ DONE ]
──────────────────────────────────────────────
Values:
  illness
  injury
  biological
  buff
  debuff


──────────────────────────────────────────────
Symptom                                 [ DONE ]
──────────────────────────────────────────────
  defaultRoll: 0 = immediately obvious, 20 = borderline impossible without near-perfect roll

  RESPIRATORY
  name                            defaultRoll
  Runny Nose                      3
  Sneezing                        0
  Nasal Bleeding                  2
  Congestion                      5
  Coughing                        0
  Sore Throat                     12
  Wheezing                        3
  Rattling Breath                 2
  Rapid Breathing                 2
  Labored Breathing               2
  Difficulty Breathing            3
  Open-mouth Breathing            0
  Gasping for Air                 0
  Cyanosis (Bluish Tongue/Gums)   8
  Choking                         0

  NEUROLOGICAL
  name                                      defaultRoll
  Unconsciousness                           0
  Seizure                                   0
  Tremors                                   5
  Disorientation                            5
  Dizziness                                 8
  Confusion                                 7
  Memory Loss                               15
  Head Tilt                                 3
  Circling                                  3
  Loss of Coordination (Ataxia)             5
  Hyperactivity                             3
  Depression (Low Mood / Unresponsiveness)  8
  Hallucination-like Behavior               5
  Sensitivity to Sound                      12
  Sudden Personality Change                 10

  DIGESTIVE
  name                    defaultRoll
  Vomiting                0
  Nausea                  8
  Diarrhea                3
  Constipation            12
  Loss of Appetite        5
  Bellyache               10
  Bloating                5
  Excessive Gas           5
  Straining to Defecate   5
  Blood in Stool          8
  Black/Tarry Stool       8
  Regurgitation           3
  Difficulty Swallowing   8

  CARDIOVASCULAR
  name                  defaultRoll
  Irregular Heartbeat   15
  Weak Pulse            15
  Fainting (Syncope)    3
  Cold Extremities      8

  URINARY / REPRODUCTIVE
  name                               defaultRoll
  Frequent Urination                 8
  Painful Urination                  10
  Blood in Urine                     8
  Incontinence                       5
  Strong Urine Odor                  5
  Swollen Abdomen (Fluid Buildup)    5
  Miscarriage                        0
  Abnormal Discharge (Reproductive)  8
  Labor Complications                3
  Low Milk Production                12

  MUSCULOSKELETAL
  name                      defaultRoll
  Limping                   0
  Paralysis                 0
  Stiffness                 5
  Joint Pain                10
  Broken Bone               5
  Sprain                    8
  Muscle Cramps             8
  Muscle Rigidity           8
  Muscle Wasting            7
  Trembling When Standing   3
  Reluctance to Move        5
  Difficulty Rising         3
  Loss of Balance           5
  Numbness                  18

  SYSTEMIC / GENERAL
  name                  defaultRoll
  Fever                 8
  Chills                5
  Fatigue               7
  Lethargy              5
  Weakness              7
  Shivering             3
  Panting               3
  Dehydration           8
  Excessive Thirst      5
  Weight Loss           5
  Visible Ribs          3
  Emaciation            0
  Pot Belly             3
  Hunger Pangs          12
  Shock                 5
  Sudden Collapse       0
  Failure to Thrive     8
  Heat Intolerance      10
  Cold Intolerance      10
  Night Sweats          12
  Enlarged Organs       15
  Swollen Lymph Nodes   12
  Aggression            3
  Restlessness          5
  Anxiety               8
  Withdrawal            8

  WOUNDS / SKIN
  name                    defaultRoll
  Bleeding                0
  Wound                   3
  Pain                    8
  Burn                    5
  Blistering              8
  Bruising                10
  Itching                 5
  Pus                     8
  Swelling                5
  Rash                    10
  Discharge               8
  Inflammation            8
  Infection               10
  Festering Wound         5
  Hair Loss               3
  Matted Fur              0
  Dry Skin                8
  Hot Spots               8
  Scabs                   5
  Flaky Skin (Dandruff)   5
  Thickened Skin          10
  Skin Discoloration      8

  HEAD / SENSES
  name                    defaultRoll
  Glazed Eyes             3
  Sunken Eyes             5
  Cloudy Eye              3
  Squinting               3
  Red Eyes                3
  Eye Discharge           3
  Dilated Pupils          5
  Unequal Pupil Size      8
  Loss of Vision          10
  Sensitivity to Light    8
  Blurred Vision          15
  Loss of Hearing         15
  Head Shaking            3
  Ear Discharge           5
  Ear Odor                5
  Bad Breath              5
  Gum Swelling            8
  Pale Gums               7
  Yellowing Gums          8
  Foaming at Mouth        0
  Toothache               15

  OTHER
  name                  defaultRoll
  Hypersensitivity      12
  Respiratory Illness   5
  Poisoning             10
  Drooling              3


──────────────────────────────────────────────
ConditionType                           [ DONE ]
──────────────────────────────────────────────
  name         tracksDays  tracksProgression  canSelfResolve  canSpawn  description
  Timed        true        false              true            true      Counts calendar days against maxDays. No roll. Advances or removes at cap via links.
  LifeCycle    true        false              true            false     Counts calendar days against maxDays. No roll. Advances cleanly through its chain with no complications.
  Progressive  false       true               true            true      Daily CON roll vs. dailyRollDC. Value moves bidirectionally. Removes or advances at endpoints via links.
  Chronic      false       true               false           true      Daily CON roll vs. dailyRollDC. Floors at 0 and cap — never self-removes. Spawn checks keep firing at cap until treated.
  Permanent    false       false              false           false     No progression, no roll. Condition persists indefinitely applying its modifiers. Removed only by admin.


──────────────────────────────────────────────
ConditionBehaviorType                   [ DONE ]
──────────────────────────────────────────────
  name      description
  redirect  Move the action to a different target. Uses redirectTarget + triggerChance.
  cancel    Prevent the action entirely. triggerChance = probability of cancel (Parry, Dodge).
  bias      Shift AI targeting weight toward or away from a target. Uses redirectTarget + biasWeight.
            Positive biasWeight = toward (Taunt). Negative = away (Fear, Intimidate).
  restrict  Limit which action types the entity may use. Uses restrictActionTypeId.
            restrictIsBlock=false → may ONLY use that type (Provoked).
            restrictIsBlock=true  → may NOT use that type (Silenced).


──────────────────────────────────────────────
BehaviorRedirectTarget                  [ DONE ]
──────────────────────────────────────────────
  name          description
  source        EntityCondition.sourceEntityId — whoever applied this condition.
                Used by Taunt, Guard, Hunter's Strike, exploitation marks.
  self          The entity holding the condition (Confusion self-hit).
  random_ally   A random member of the holder's own side.
  random_enemy  A random member of the opposing side.


──────────────────────────────────────────────
EnvModifierType                         [ DONE ]
──────────────────────────────────────────────
Values:
  filth
  prey_weight
  herb_chance
  herb_amount
  gather_chance
  gather_amount
  spoilage
  predator
  sickness
  hazard_chance
  plant_growth    — crop / cultivated-plant growth rate multiplier (farming system)


──────────────────────────────────────────────
FactionStandingType                     [ DONE ]
──────────────────────────────────────────────
Values:
  Ally
  Neutral
  Hostile
  Enemy
  Truce


──────────────────────────────────────────────
RelationshipType                        [ DONE ]
──────────────────────────────────────────────
  name     label    isUnique
  mother   Mother   false
  father   Father   false
  mentor   Mentor   true


──────────────────────────────────────────────
EventTriggerType                        [ DONE ]
──────────────────────────────────────────────
Values:
  admin
  activity
  weather_onset
  filth
  daily


──────────────────────────────────────────────
EventScopeType                          [ DONE ]
──────────────────────────────────────────────
Values:
  global
  faction
  action


──────────────────────────────────────────────
EventStepType                           [ DONE ]
──────────────────────────────────────────────
Values:
  narrative
  choice
  combat


──────────────────────────────────────────────
EventParticipantScope                   [ DONE ]
──────────────────────────────────────────────
  name               appliesToAll  appliesToRandom  appliesToLeader  appliesToGroup
  all_participants   true          false            false            false
  random_participant false         true             false            false
  leader             false         false            true             false
  group              false         false            false            true


──────────────────────────────────────────────
EventGrantType                          [ DONE ]
──────────────────────────────────────────────
Values:
  condition
  item


──────────────────────────────────────────────
EventChoiceResolutionType               [ DONE ]
──────────────────────────────────────────────
Values:
  individual
  group_average     — average across all event participants
  leader_designates — the group leader makes the choice on behalf of everyone


═══════════════════════════════════════════════════════════════════════
GLOBAL-DEFAULT EXTENSIBLE TABLES
(guildId = "global" — guilds may add their own rows after seeding)
═══════════════════════════════════════════════════════════════════════

──────────────────────────────────────────────
DisciplineDef                           [ DONE ]
──────────────────────────────────────────────
Includes the 7 disciplines + 1 stat progression row (isStatProgression = true).

XP formula for disciplines: xpRequired(level) = floor(baseXp × level^1.5)
Stat progression uses a flat threshold: baseXp XP per stat point, every time.
dailyXpCap is null for all disciplines; only the stat progression row sets it.

  name             description                                                      baseXp  isStatProgression  dailyXpCap
  ───────────────  ───────────────────────────────────────────────────────────────  ──────  ─────────────────  ──────────
  Healing          Treating wounds, illness, and conditions                            100  false              null
  Crafting         Creating items via recipes                                          100  false              null
  Farming          Growing, gathering, and tending plant-based resources               100  false              null
  Combat           Fighting effectiveness and battle experience                        100  false              null
  Scouting         Patrol, territory awareness, and threat detection                   100  false              null
  Social           Leadership, diplomacy, and faction influence                        100  false              null
  Training         Mentoring other entities and accelerating their growth              100  false              null
  StatProgression  Tracks XP toward stat points; excluded from discipline listings    1250  true               100

NOTE — stat progression calibration:
  dailyXpCap = 100 XP/day. Casual player (~18 active days/mo) earns ~1,800 XP/mo →
  ~1.44 stat points/month → 60 points in ~3.5 years.
  Active player (~28 active days/mo, capped daily) earns ~2,800 XP/mo →
  ~2.24 stat points/month → 60 points in ~2.2 years.
  Actions remain worth doing past the daily cap for their tangible rewards
  (food, items, faction rep, event triggers).


──────────────────────────────────────────────
DamageType                              [ DONE ]
──────────────────────────────────────────────
  name       category
  blunt      Physical
  slashing   Physical
  piercing   Physical
  fire       Magical
  frost      Magical
  lightning  Magical
  poison     Magical
  arcane     Magical
  nature     Magical
  shadow     Magical
  radiant    Magical
  sonic      Magical
  acid       Magical
  wind       Magical
  void       True


──────────────────────────────────────────────
Biome                                   [ DONE ]
──────────────────────────────────────────────
color: Discord-style integer (decimal value of RRGGBB hex). Hex shown in parentheses for reference.
inherentConditions: codeName:stacks — always active regardless of weather or season.
Conversion: parseInt('RRGGBB', 16) in seeding code.

Removed from original list as redundant:
  Tundra          — covered by Arctic Tundra and Alpine Tundra
  Jungle          — same ecosystem as Rainforest, different name only
  Monsoon Forest  — too similar to Tropical Dry Forest
  Underground     — covered by Cave System

  FORESTS
  name                color                  inherentConditions
  Forest              2976301   (#2D6A2D)    shaded:1  damp:1
  Deciduous Forest    4881471   (#4A7C3F)    shaded:1  damp:1
  Coniferous Forest   1727530   (#1A5C2A)    shaded:1  cold:1
  Mixed Forest        4028997   (#3D7A45)    shaded:1
  Taiga               2776122   (#2A5C3A)    shaded:1  cold:2
  Rainforest          1796922   (#1B6B3A)    shaded:1  humid:2  damp:1
  Tropical Dry Forest 8227642   (#7D8B3A)    shaded:1  dry:1
  Cloud Forest        6065258   (#5C8C6A)    shaded:1  misty:2  damp:1
  Bamboo Forest       7187290   (#6DAB5A)    shaded:1  damp:1
  Mangrove Forest     4880988   (#4A7A5C)    humid:1   damp:2   muddy:1

  GRASSLANDS
  name                  color                  inherentConditions
  Grassland             9287772   (#8DB85C)    (none)
  Savanna               13150283  (#C8A84B)    warm:1  dry:1
  Steppe                11049820  (#A89B5C)    dry:1   windy:1
  Meadow                8243322   (#7DC87A)    dappled_light:1
  Floodplain Grassland  7055472   (#6BA870)    damp:1  muddy:1

  DESERTS
  name              color                  inherentConditions
  Arid Desert       15255674  (#E8C87A)    arid:2  heat:1
  Semi-Arid Desert  13150298  (#C8A85A)    arid:1  dry:1
  Rocky Desert      12089930  (#B87A4A)    arid:1  dusty:1
  Salt Flats        15788758  (#F0EAD6)    arid:2  harsh_sunlight:1
  Badlands          12081722  (#B85A3A)    dusty:1  arid:1

  TUNDRA / ICE
  name           color                  inherentConditions
  Arctic Tundra  9222344   (#8CB8C8)    freezing:2  windy:1
  Alpine Tundra  10139816  (#9AB8A8)    cold:2      windy:1
  Glacier        12114152  (#B8D8E8)    freezing:2  icy:1
  Snowfield      15266040  (#E8F0F8)    freezing:1  snow:1

  FRESHWATER
  name                 color                  inherentConditions
  River                4889272   (#4A9AB8)    damp:1
  Stream               6992072   (#6AB0C8)    damp:1
  Lake                 3832488   (#3A7AA8)    damp:1  misty:1
  Pond                 5937320   (#5A98A8)    damp:1
  Wetlands             5933674   (#5A8A6A)    damp:2  humid:1
  Swamp                3828298   (#3A6A4A)    damp:2  humid:1  muddy:1
  Marsh                5933658   (#5A8A5A)    damp:2  muddy:1
  Bog                  4876858   (#4A6A3A)    damp:2  humid:1
  Fen                  5929546   (#5A7A4A)    damp:1  humid:1

  COASTAL / MARINE
  name           color                  inherentConditions
  Estuary        5937802   (#5A9A8A)    damp:1  humid:1
  Coastal Shore  13944986  (#D4C89A)    breezy:1  damp:1
  Coral Reef     16743002  (#FF7A5A)    damp:1
  Ocean          2775690   (#2A5A8A)    breezy:1  damp:1
  Deep Ocean     1718890   (#1A3A6A)    (none — surface conditions don't apply)

  ELEVATED
  name              color                  inherentConditions
  Mountains         8026762   (#7A7A8A)    cold:1   windy:2
  Foothills         9079402   (#8A8A6A)    breezy:1
  Highland Plateau  10132090  (#9A9A7A)    windy:1  bright:1
  Cliffs            9075306   (#8A7A6A)    windy:2  bright:1

  SPECIAL
  name     color                  inherentConditions
  Volcano  9058858   (#8A3A2A)    scorching:1  dusty:1
  Oasis    4896906   (#4AB88A)    damp:2
  Canyon   13138506  (#C87A4A)    dusty:1  dry:1

  HUMAN-MADE / BUILT
  name      color                  inherentConditions
  Urban     9079450   (#8A8A9A)    filth:1  dusty:1
  Suburban  11053210  (#A8A89A)    cultivated:1
  Ruins     8024160   (#7A7060)    dusty:1
  Farmland  11061360  (#A8C870)    cultivated:1

  UNDERGROUND
  name         color                  inherentConditions
  Cave System  5921386   (#5A5A6A)    dark:2  damp:1  cold:1

──────────────────────────────────────────────
EnvCondition                            [ DONE ]
──────────────────────────────────────────────
World modifier values are multipliers: 1.0 = no effect, 1.30 = +30% per stack, 0.70 = -30% per stack.
Formula: effectiveMod = 1.0 + (value − 1.0) × stackCount
Stat and proficiency modifiers are left to guild customization (not globally seeded).
Conditions with no world modifiers are baseline states (marked with —).
NEW entries added to fill gradient gaps; originals are unchanged.

  TEMPERATURE / PRECIPITATION
  codeName       name       modifiers
  cold           Cold       spoilage=0.7  sickness=1.3  herb_chance=0.8  herb_amount=0.8  prey_weight=0.9  gather_chance=0.8  gather_amount=0.8  plant_growth=0.7
  frost          Frost      spoilage=0.5  sickness=1.5  herb_chance=0.6  herb_amount=0.6  prey_weight=0.8  gather_chance=0.6  gather_amount=0.6  predator=0.8  hazard_chance=1.2  plant_growth=0.5
  snow           Snow       spoilage=0.5  sickness=1.4  herb_chance=0.5  herb_amount=0.5  prey_weight=0.8  gather_chance=0.6  gather_amount=0.5  hazard_chance=1.2  plant_growth=0.4
  freezing       Freezing   spoilage=0.4  sickness=1.6  herb_chance=0.4  herb_amount=0.4  prey_weight=0.7  gather_chance=0.5  gather_amount=0.4  predator=0.7  hazard_chance=1.5  plant_growth=0.2   [NEW]
  warm           Warm       spoilage=1.2  herb_chance=1.05  gather_chance=1.05  plant_growth=1.2                                                                                                       [NEW]
  heat           Heat       spoilage=1.5  sickness=1.2  herb_chance=0.9  herb_amount=0.9  predator=0.9  plant_growth=1.1
  scorching      Scorching  spoilage=1.8  sickness=1.4  herb_chance=0.7  herb_amount=0.7  predator=0.8  hazard_chance=1.5  plant_growth=0.7                                                            [NEW]
  icy            Icy        hazard_chance=1.4  plant_growth=0.3

  MOISTURE
  codeName  name   modifiers
  humid     Humid  filth=1.2  spoilage=1.6  sickness=1.3  plant_growth=1.3
  damp      Damp   filth=1.2  spoilage=1.3  sickness=1.1  herb_chance=1.1  herb_amount=1.1  plant_growth=1.2
  rain      Rain   filth=1.3  spoilage=1.2  sickness=1.2  gather_chance=0.8  gather_amount=0.8  predator=0.9  plant_growth=1.2
  storm     Storm  filth=1.5  spoilage=1.2  sickness=1.3  gather_chance=0.4  gather_amount=0.4  predator=0.6  hazard_chance=1.8  plant_growth=0.8
  flood     Flood  filth=1.5  gather_chance=0.5  gather_amount=0.5  predator=0.7  hazard_chance=1.5  plant_growth=0.6
  dry       Dry    herb_chance=0.8  herb_amount=0.8  gather_chance=0.8  gather_amount=0.8  plant_growth=0.8
  arid      Arid   herb_chance=0.6  herb_amount=0.6  gather_chance=0.6  gather_amount=0.6  spoilage=0.5  plant_growth=0.5                                                            [NEW]

  WIND
  codeName  name     modifiers
  still     Still    —                                                                                                                                                                [NEW]
  breezy    Breezy   filth=1.1                                                                                                                                                        [NEW]
  windy     Windy    filth=1.3  sickness=1.1  predator=0.8  plant_growth=0.9
  gusting   Gusting  filth=1.4  sickness=1.1  predator=0.7  hazard_chance=1.3  plant_growth=0.8                                                                                      [NEW]

  AIR / GROUND CONDITIONS
  codeName  name     modifiers
  fog       Fog      gather_chance=0.9  gather_amount=0.9  predator=1.2  hazard_chance=1.2
  misty     Misty    predator=1.1  gather_chance=0.95  hazard_chance=1.1  plant_growth=1.05                                                                                          [NEW]
  hazy      Hazy     gather_chance=0.9  gather_amount=0.9                                                                                                                            [NEW]
  dusty     Dusty    filth=1.2  sickness=1.1  plant_growth=0.9
  filth     Filth    filth=1.5  sickness=1.4  plant_growth=0.8
  muddy     Muddy    filth=1.3  gather_chance=0.9  gather_amount=0.9  hazard_chance=1.1  plant_growth=0.9
  pollen    Pollen   sickness=1.2
  smoke     Smoke    sickness=1.4  gather_chance=0.7  gather_amount=0.7  predator=0.7  hazard_chance=1.5  plant_growth=0.8
  toxic     Toxic    sickness=1.6  herb_chance=0.5  herb_amount=0.5  gather_chance=0.6  predator=0.7  hazard_chance=1.4  plant_growth=0.4

  LIGHT / SKY
  codeName       name           modifiers
  overcast       Overcast       plant_growth=0.9
  sunny          Sunny          spoilage=1.2  herb_chance=1.1  herb_amount=1.1  gather_chance=1.1  gather_amount=1.1  plant_growth=1.2
  harsh_sunlight Harsh Sunlight spoilage=1.3  sickness=1.2  hazard_chance=1.3  herb_amount=0.9  plant_growth=0.8                                                                     [NEW]
  bright         Bright         plant_growth=1.1                                                                                                                                     [NEW]
  dappled_light  Dappled Light  herb_chance=1.05  herb_amount=1.05  plant_growth=1.1                                                                                                 [NEW]
  shaded         Shaded         plant_growth=0.85                                                                                                                                    [NEW]
  dim            Dim            predator=1.2  gather_chance=0.8  gather_amount=0.8  herb_chance=0.8  plant_growth=0.7                                                                [NEW]
  dark           Dark           predator=1.4  gather_chance=0.6  gather_amount=0.6  herb_chance=0.6  plant_growth=0.5                                                                [NEW]

  LAND USE
  codeName    name        modifiers
  cultivated  Cultivated  herb_chance=2.5  herb_amount=2.5  gather_chance=1.4  gather_amount=1.3  predator=1.5  hazard_chance=1.5  plant_growth=2.0

  SEASONAL (applied by season rows — represent the ambient feel of the period)
  codeName         name             modifiers
  leafbare_lean    Leaf-bare Lean   prey_weight=0.4  herb_chance=0.4  herb_amount=0.5  gather_chance=0.6  gather_amount=0.5  spoilage=0.35  sickness=1.4  predator=0.7  hazard_chance=1.2  plant_growth=0.3
  newleaf_bloom    New-leaf Bloom   prey_weight=1.1  herb_chance=1.4  herb_amount=1.3  gather_chance=1.2  gather_amount=1.2  spoilage=1.1   sickness=1.3  predator=1.2  hazard_chance=1.2  plant_growth=1.4
  greenleaf_heat   Green-leaf Heat  prey_weight=1.3  herb_chance=1.2  herb_amount=1.2  gather_chance=1.2  gather_amount=1.2  spoilage=1.6   sickness=0.8  predator=1.3  filth=1.2  plant_growth=1.3
  leaffall_plenty  Leaf-fall Plenty prey_weight=1.3  herb_chance=0.9  herb_amount=0.9  sickness=1.1  predator=1.2  plant_growth=0.8

──────────────────────────────────────────────
ActionSystemType                        [ DONE ]
──────────────────────────────────────────────
  id        description
  ────────  ───────────────────────────────────────────────────────────────────────────
  patrol    Event-chance patrol system: rolls for random events at location; otherwise grants rewards
  hunting   Prey weight rolls at location; may spawn a combat instance against prey species
  foraging  Drop table / gather rolls based on location biome and active env conditions
  spar      Spawns a non-lethal ActiveCombat (CombatInitiationType = spar); XP at 50%
  fight     Spawns a lethal ActiveCombat (CombatInitiationType = fight)
  crafting  Opens the crafting UI for participants; XP flows from Recipe_DisciplineReward
  healing   Opens the treatment UI for the healer; XP flows from treatment subsystem
  clean     Interactive camp cleaning UI; player chooses target (base / food / herb storage)
  farming             Farming harvest and growth logic (NOT YET IMPLEMENTED — see farming-system.md)
  farming_crossbreed  Cross-breed two mature PlotCrops; solo only; produces ephemeral PlantDef + seed Item on success
  compost             Opens the compost deposit UI; player chooses items to deposit into a compost structure

──────────────────────────────────────────────
ActionType                              [ DONE ]
──────────────────────────────────────────────
All rows: guildId = "global"

Seeded fields: name · displayName · systemTypeId · isInteractive
               requiresCanMentor · allowApprenticesWithAdult · requiresCanLeadEvents · minAgeMoons

Costs and rewards (energyCost, dailyLimit, minEntities, maxEntities, durationMinutes, baseFactionReward,
DisciplineRewards) are NOT seeded globally — each guild configures these via Guild_ActionConfig
and ActionType_DisciplineReward.

  name           displayName          systemTypeId  isInteractive  requiresCanMentor  allowApprenticesWithAdult  requiresCanLeadEvents  minAgeMoons  notes
  ─────────────  ───────────────────  ────────────  ─────────────  ─────────────────  ─────────────────────────  ─────────────────────  ───────────  ─────────────────────────────────────────────────────────────
  border_patrol  Border Patrol        patrol        false          false              true                       false                  null
  hunting        Hunting Run          hunting       false          false              true                       false                  null         Combat XP distributed by engine, not DisciplineReward
  foraging       Foraging Run         foraging      false          false              true                       false                  null
  spar           Spar                 spar          true           false              true                       false                  null         Combat XP at 50% from engine; StatProgression split winners/losers
  fight          Fight                fight         true           false              false                      false                  null         Faction rep outcome determined by app layer based on target faction
  training       Training Session     null          false          true               true                       false                  null         App layer applies bonus XP multiplier for registered mentors
  crafting       Crafting Session     crafting      true           false              true                       false                  null         Main XP flows from Recipe_DisciplineReward
  treat          Treat Patient        healing       true           false              true                       false                  null         Main XP flows from healing subsystem
  clean          Clean Camp           clean         true           false              true                       false                  null
  farming        Farm Work            farming       false          false              true                       false                  null         [ PLACEHOLDER — farming system not yet implemented ]
  crossbreed     Crossbreed Crops     farming_crossbreed  true    false              false                      false                  null         Solo only (maxEntities = 1); gated via ActionType_DisciplineRequirement
  compost        Deposit to Compost   compost       true           false              true                       false                  null
