/**
 * Global seed script — seeds all static and engine-global lookup tables.
 * Idempotent: safe to re-run; uses createMany with skipDuplicates throughout.
 * Data source: docs/seed-data.md
 *
 * Run:  npm run db:seed
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') })

import { PrismaClient } from '../apps/api/src/generated/prisma-primary/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_PRIMARY! })
  const prisma = new PrismaClient({ adapter } as any)
  await prisma.$connect()

  try {
    // =========================================================================
    // TIER 1 — No FK dependencies on other seeded tables
    // =========================================================================

    // --- Status ---
    await prisma.status.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Active',             isEntity: true,  isStructure: true  },
        { name: 'Inactive',           isEntity: true,  isStructure: true  },
        { name: 'Hiatus',             isEntity: true,  isStructure: false },
        { name: 'Broken',             isEntity: false, isStructure: true  },
        { name: 'Destroyed',          isEntity: false, isStructure: true  },
        { name: 'Under_Construction', isEntity: false, isStructure: true  },
      ],
    })

    // --- EntityType ---
    await prisma.entityType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'NPC',            canModifyStats: false, canParticipateCombat: true,  canParticipateEvents: false, adminOnly: true  },
        { name: 'Side Character', canModifyStats: false, canParticipateCombat: true,  canParticipateEvents: true,  adminOnly: false },
        { name: 'Main Character', canModifyStats: true,  canParticipateCombat: true,  canParticipateEvents: true,  adminOnly: false },
        { name: 'Ephemeral',      canModifyStats: false, canParticipateCombat: true,  canParticipateEvents: true,  adminOnly: true  },
      ],
    })

    // --- Sex ---
    await prisma.sex.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Male'     },
        { name: 'Female'   },
        { name: 'Intersex' },
      ],
    })

    // --- Gender ---
    await prisma.gender.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Male'       },
        { name: 'Female'     },
        { name: 'Non-binary' },
        { name: 'Other'      },
      ],
    })

    // --- Stat ---
    await prisma.stat.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Strength'     },
        { name: 'Dexterity'    },
        { name: 'Constitution' },
        { name: 'Intelligence' },
        { name: 'Wisdom'       },
        { name: 'Charisma'     },
      ],
    })

    // --- SpeciesType ---
    await prisma.speciesType.createMany({
      skipDuplicates: true,
      data: [
        // Role types
        { name: 'Playable'   },
        { name: 'Prey'       },
        { name: 'Predator'   },
        { name: 'Pet'        },
        { name: 'Livestock'  },
        { name: 'Vermin'     },
        // Biological types
        { name: 'Mammal'     },
        { name: 'Bird'       },
        { name: 'Reptile'    },
        { name: 'Amphibian'  },
        { name: 'Fish'       },
        { name: 'Insect'     },
        { name: 'Arachnid'   },
        { name: 'Crustacean' },
        // Habitat types
        { name: 'Aquatic'      },
        { name: 'Aerial'       },
        { name: 'Subterranean' },
      ],
    })

    // --- PlantType ---
    await prisma.plantType.createMany({
      skipDuplicates: true,
      data: [
        // Growth Form
        { name: 'Herb'      },
        { name: 'Shrub'     },
        { name: 'Bush'      },
        { name: 'Tree'      },
        { name: 'Vine'      },
        { name: 'Grass'     },
        { name: 'Fern'      },
        { name: 'Moss'      },
        { name: 'Fungus'    },
        { name: 'Succulent' },
        // Botanical Group
        { name: 'Coniferous' },
        { name: 'Deciduous'  },
        { name: 'Evergreen'  },
        { name: 'Flowering'  },
        // Habitat
        { name: 'Aquatic' },
        { name: 'Wetland' },
        { name: 'Alpine'  },
        { name: 'Arid'    },
        { name: 'Forest'  },
        { name: 'Meadow'  },
        { name: 'Coastal' },
        { name: 'Cave'    },
        // Lifecycle / Cultivation
        { name: 'Annual'     },
        { name: 'Perennial'  },
        { name: 'Cultivated' },
      ],
    })

    // --- ItemType ---
    await prisma.itemType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Weapon'   },
        { name: 'Armor'    },
        { name: 'Shield'   },
        { name: 'Trait'    },
        { name: 'Ability'  },
        { name: 'Spell'    },
        { name: 'Tool'     },
        { name: 'Plant'    },
        { name: 'Medicine' },
        { name: 'Food'     },
        { name: 'Ore'      },
        { name: 'Ingot'    },
        { name: 'Gem'      },
        { name: 'Leather'  },
        { name: 'Battery'  },
      ],
    })

    // --- ItemInteraction ---
    await prisma.itemInteraction.createMany({
      skipDuplicates: true,
      data: [
        { name: 'eat',    description: 'Consumed orally as solid food or a bolus.'                                   },
        { name: 'drink',  description: 'Consumed orally as a liquid, broth, or tea.'                                },
        { name: 'apply',  description: 'Applied directly to skin, fur, or a wound as a poultice or salve.'          },
        { name: 'inhale', description: 'Breathed in as vapour, steam, or airborne particles.'                       },
        { name: 'burn',   description: 'Set alight to produce smoke or char for direct use.'                        },
      ],
    })

    // --- ItemActionType ---
    await prisma.itemActionType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'attack', dealsDamage: true,  restoresHealth: false, appliesCondition: false, isHarmful: true  },
        { name: 'heal',   dealsDamage: false, restoresHealth: true,  appliesCondition: false, isHarmful: false },
        { name: 'buff',   dealsDamage: false, restoresHealth: false, appliesCondition: true,  isHarmful: false },
        { name: 'debuff', dealsDamage: false, restoresHealth: false, appliesCondition: true,  isHarmful: true  },
        { name: 'summon', dealsDamage: false, restoresHealth: false, appliesCondition: false, isHarmful: false },
      ],
    })

    // --- RelationType ---
    await prisma.relationType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'requires',   isConditionSystem: false, isStructureSystem: true,  isSkillSystem: true,  isItemSystem: false, isCraftingSystem: true,  isEnvConditionSystem: true,  isOwnershipSystem: false },
        { name: 'block',      isConditionSystem: true,  isStructureSystem: true,  isSkillSystem: true,  isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: true,  isOwnershipSystem: false },
        { name: 'upgrades',   isConditionSystem: false, isStructureSystem: true,  isSkillSystem: true,  isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'treat',      isConditionSystem: false, isStructureSystem: false, isSkillSystem: false, isItemSystem: true,  isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'worsen',     isConditionSystem: true,  isStructureSystem: false, isSkillSystem: false, isItemSystem: true,  isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'cure',       isConditionSystem: false, isStructureSystem: false, isSkillSystem: false, isItemSystem: true,  isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'transform',  isConditionSystem: false, isStructureSystem: false, isSkillSystem: false, isItemSystem: true,  isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'recover',    isConditionSystem: true,  isStructureSystem: false, isSkillSystem: false, isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'spawn',      isConditionSystem: true,  isStructureSystem: false, isSkillSystem: false, isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'spreads_as', isConditionSystem: true,  isStructureSystem: false, isSkillSystem: false, isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'improves',   isConditionSystem: false, isStructureSystem: false, isSkillSystem: true,  isItemSystem: false, isCraftingSystem: true,  isEnvConditionSystem: false, isOwnershipSystem: false },
        { name: 'increase',   isConditionSystem: false, isStructureSystem: false, isSkillSystem: true,  isItemSystem: false, isCraftingSystem: true,  isEnvConditionSystem: true,  isOwnershipSystem: false },
        { name: 'decrease',   isConditionSystem: false, isStructureSystem: false, isSkillSystem: true,  isItemSystem: false, isCraftingSystem: true,  isEnvConditionSystem: true,  isOwnershipSystem: false },
        { name: 'kills',      isConditionSystem: false, isStructureSystem: false, isSkillSystem: true,  isItemSystem: false, isCraftingSystem: true,  isEnvConditionSystem: true,  isOwnershipSystem: false },
        { name: 'owns',       isConditionSystem: false, isStructureSystem: false, isSkillSystem: false, isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: true  },
        { name: 'contesting', isConditionSystem: false, isStructureSystem: false, isSkillSystem: false, isItemSystem: false, isCraftingSystem: false, isEnvConditionSystem: false, isOwnershipSystem: true  },
      ],
    })

    // --- EffectType ---
    // Includes base types + event effect types (isEvent = true)
    await prisma.effectType.createMany({
      skipDuplicates: true,
      data: [
        // Base types
        { name: 'spawn_rate',        isItem: true,  isPlant: true,  isSpecies: true,  isAbility: false, isEnvModifier: false, isLocation: true,  isEvent: false },
        { name: 'spawn_weight',      isItem: true,  isPlant: true,  isSpecies: true,  isAbility: false, isEnvModifier: false, isLocation: true,  isEvent: false },
        { name: 'growth_rate',       isItem: false, isPlant: true,  isSpecies: true,  isAbility: true,  isEnvModifier: false, isLocation: true,  isEvent: false },
        { name: 'harvest_yeild',     isItem: false, isPlant: true,  isSpecies: false, isAbility: true,  isEnvModifier: false, isLocation: true,  isEvent: false },
        { name: 'rot_rate',          isItem: true,  isPlant: true,  isSpecies: false, isAbility: true,  isEnvModifier: false, isLocation: true,  isEvent: false },
        { name: 'damage_resistance', isItem: false, isPlant: false, isSpecies: false, isAbility: true,  isEnvModifier: false, isLocation: false, isEvent: false },
        { name: 'cultivation',       isItem: false, isPlant: true,  isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: false },
        { name: 'survival',          isItem: false, isPlant: true,  isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: false },
        { name: 'filth',             isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: true,  isLocation: false, isEvent: false },
        { name: 'spoilage',          isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: true,  isLocation: false, isEvent: false },
        // Event effect types (isEvent = true)
        { name: 'condition',              isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'item',                   isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'location_buff',          isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: true,  isEvent: true },
        { name: 'stat_modifier',          isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'proficiency_modifier',   isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'faction_rep',            isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'discipline_xp',          isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'structure_damage',       isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'action_output_modifier', isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
        { name: 'event_weight_modifier',  isItem: false, isPlant: false, isSpecies: false, isAbility: false, isEnvModifier: false, isLocation: false, isEvent: true },
      ],
    })

    // --- AbilityEffectType ---
    await prisma.abilityEffectType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'condition_grant' },
        { name: 'multiplier'      },
        { name: 'structure_buff'  },
        { name: 'plot_buff'       },
        { name: 'energy_restore'  },
        { name: 'xp_grant'        },
      ],
    })

    // --- AbilityThresholdType ---
    await prisma.abilityThresholdType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'hp'        },
        { name: 'nutrition' },
        { name: 'hydration' },
      ],
    })

    // --- TargetScope ---
    await prisma.targetScope.createMany({
      skipDuplicates: true,
      data: [
        { name: 'self',                    isAbilityTarget: true,  isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'action_target',           isAbilityTarget: true,  isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'action_participant',      isAbilityTarget: true,  isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'area',                    isAbilityTarget: true,  isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'housing_structure',          isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'housing_plot',               isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'colocated_entities',         isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'camp_entities',              isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'camp_structures',            isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'work_structure',             isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'work_plots',                 isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'work_colocated_entities',    isAbilityTarget: false, isPresenceScope: true,  isPowerScope: false, isEfficiencyConsumerScope: false },
        { name: 'structure',               isAbilityTarget: false, isPresenceScope: false, isPowerScope: true,  isEfficiencyConsumerScope: false },
        { name: 'camp',                    isAbilityTarget: false, isPresenceScope: false, isPowerScope: true,  isEfficiencyConsumerScope: false },
        { name: 'location',                isAbilityTarget: false, isPresenceScope: false, isPowerScope: true,  isEfficiencyConsumerScope: false },
        { name: 'faction',                 isAbilityTarget: false, isPresenceScope: false, isPowerScope: true,  isEfficiencyConsumerScope: false },
        { name: 'all',                     isAbilityTarget: false, isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: true  },
        { name: 'structures_only',         isAbilityTarget: false, isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: true  },
        { name: 'upgrades_only',           isAbilityTarget: false, isPresenceScope: false, isPowerScope: false, isEfficiencyConsumerScope: true  },
      ],
    })

    // --- TriggerTiming (TargetTrigger in docs) ---
    await prisma.triggerTiming.createMany({
      skipDuplicates: true,
      data: [
        { name: 'completion' },
        { name: 'success'    },
        { name: 'failure'    },
      ],
    })

    // --- StackBehavior ---
    await prisma.stackBehavior.createMany({
      skipDuplicates: true,
      data: [
        { name: 'refresh' },
        { name: 'stack'   },
        { name: 'ignore'  },
      ],
    })

    // --- FuelType ---
    await prisma.fuelType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Burnable'   },
        { name: 'Electric'   },
        { name: 'Steam'      },
        { name: 'Alchemical' },
        { name: 'Renewable'  },
      ],
    })

    // --- StructureType ---
    await prisma.structureType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'storage'  },
        { name: 'farming'  },
        { name: 'housing'  },
        { name: 'medical'  },
        { name: 'compost'     },
        { name: 'crafting'    },
        { name: 'power'       },
        { name: 'production'  },
        { name: 'work_slot'   },
      ],
    })

    // --- ConstructionType ---
    await prisma.constructionType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'build'   },
        { name: 'upgrade' },
        { name: 'repair'  },
        { name: 'rebuild' },
      ],
    })

    // --- MeasurementType ---
    await prisma.measurementType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Weight', unit: 'g'     },
        { name: 'Count',  unit: 'units' },
        { name: 'Volume', unit: 'ml'    },
      ],
    })

    // --- UpgradeEffectType ---
    // _all: valid for every structure type including production and work slot defs
    const _all = { isStorage: true, isFarming: true, isHousing: true, isMedical: true, isCrafting: true, isCompost: true, isPower: true, isProduction: true, isWorkSlot: true }
    // _none: shorthand for type-specific rows where all flags default to false
    const _none = { isStorage: false, isFarming: false, isHousing: false, isMedical: false, isCrafting: false, isCompost: false, isPower: false, isProduction: false, isWorkSlot: false }
    await prisma.upgradeEffectType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'solid_capacity',        ..._none, isStorage: true,      requiresEnvTarget: false },
        { name: 'liquid_capacity',       ..._none, isStorage: true,      requiresEnvTarget: false },
        { name: 'rot_modifier',          ..._none, isStorage: true,      requiresEnvTarget: false },
        { name: 'security_rating',       ..._none, isStorage: true,      requiresEnvTarget: false },
        { name: 'plot_count',            ..._none, isFarming: true,      requiresEnvTarget: false },
        { name: 'growth_rate',           ..._none, isFarming: true,      requiresEnvTarget: false },
        { name: 'env_override',          ..._all,                        requiresEnvTarget: true  },
        { name: 'env_inject',            ..._all,                        requiresEnvTarget: true  },
        { name: 'soil_quality',          ..._none, isFarming: true,      requiresEnvTarget: false },
        { name: 'comfortable_capacity',  ..._none, isHousing: true,      requiresEnvTarget: false },
        { name: 'max_capacity',          ..._none, isHousing: true,      requiresEnvTarget: false },
        { name: 'treatment_bonus',       ..._none, isMedical: true,      requiresEnvTarget: false },
        { name: 'exam_bonus',            ..._none, isMedical: true,      requiresEnvTarget: false },
        { name: 'recovery_modifier',     ..._none, isMedical: true,      requiresEnvTarget: false },
        { name: 'contagion_resist',      ..._none, isMedical: true,      requiresEnvTarget: false },
        { name: 'crafting_roll_bonus',   ..._none, isCrafting: true,     requiresEnvTarget: false },
        { name: 'output_quantity_bonus', ..._none, isCrafting: true,     requiresEnvTarget: false },
        { name: 'conversion_speed',      ..._none, isCompost: true,      requiresEnvTarget: false },
        { name: 'fuel_capacity',         ..._none, isPower: true,        requiresEnvTarget: false },
        { name: 'fuel_efficiency',       ..._none, isPower: true,        requiresEnvTarget: false },
        { name: 'passive_gen_rate',      ..._none, isPower: true,        requiresEnvTarget: false },
        { name: 'weight_capacity',       ..._none, isCompost: true,      requiresEnvTarget: false },
        { name: 'volume_capacity',       ..._none, isCompost: true,      requiresEnvTarget: false },
        { name: 'damage_resistance',     ..._all,                        requiresEnvTarget: false },
        { name: 'filth_reduction',       ..._all,                        requiresEnvTarget: false },
        // production-type effects
        { name: 'production_rate',       ..._none, isProduction: true,   requiresEnvTarget: false },
        { name: 'staff_rate',            ..._none, isProduction: true,   requiresEnvTarget: false },
        { name: 'powered_rate',          ..._none, isProduction: true,   requiresEnvTarget: false },
        // work slot effects (valid for any def with a WorkSlotConfig, regardless of structure type)
        { name: 'work_slots',            ..._none, isWorkSlot: true,     requiresEnvTarget: false },
        { name: 'station_xp_bonus',      ..._none, isWorkSlot: true,     requiresEnvTarget: false },
        { name: 'energy_drain_reduction',..._none, isWorkSlot: true,     requiresEnvTarget: false },
      ],
    })

    // --- RecipeOutputMode ---
    await prisma.recipeOutputMode.createMany({
      skipDuplicates: true,
      data: [
        { name: 'fixed'        },
        { name: 'proportional' },
      ],
    })

    // --- EquipmentSlotType ---
    await prisma.equipmentSlotType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Hand',  defaultCapacity: 2, isUnlimited: false },
        { name: 'Chest', defaultCapacity: 1, isUnlimited: false },
        { name: 'Head',  defaultCapacity: 1, isUnlimited: false },
        { name: 'Innate', defaultCapacity: 1, isUnlimited: true  },
      ],
    })

    // --- CombatTargetScope ---
    await prisma.combatTargetScope.createMany({
      skipDuplicates: true,
      data: [
        { name: 'self',        targetsSelf: true,  targetsSingle: false, targetsAllies: false, targetsEnemies: false },
        { name: 'single',      targetsSelf: false, targetsSingle: true,  targetsAllies: false, targetsEnemies: false },
        { name: 'all_allies',  targetsSelf: false, targetsSingle: false, targetsAllies: true,  targetsEnemies: false },
        { name: 'all_enemies', targetsSelf: false, targetsSingle: false, targetsAllies: false, targetsEnemies: true  },
        { name: 'all',         targetsSelf: false, targetsSingle: false, targetsAllies: true,  targetsEnemies: true  },
      ],
    })

    // --- CombatInitiationType ---
    await prisma.combatInitiationType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'spar',  canResultInDeath: false, isScripted: false, allowsFleeing: false, canSecondWind: true },
        { name: 'event', canResultInDeath: true,  isScripted: false, allowsFleeing: true,  canSecondWind: true },
        { name: 'boss',  canResultInDeath: true,  isScripted: true,  allowsFleeing: true,  canSecondWind: true },
      ],
    })

    // --- CombatOutcome ---
    await prisma.combatOutcome.createMany({
      skipDuplicates: true,
      data: [
        { name: 'win',       isVictory: true,  isDefeat: false, isDraw: false, isExpired: false },
        { name: 'lose',      isVictory: false, isDefeat: true,  isDraw: false, isExpired: false },
        { name: 'draw',      isVictory: false, isDefeat: false, isDraw: true,  isExpired: false },
        { name: 'completed', isVictory: false, isDefeat: false, isDraw: false, isExpired: true  },
      ],
    })

    // --- CombatActionCategory ---
    await prisma.combatActionCategory.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Main Action',       actionsAllowedPerRound: 1, description: 'Standard action — one allowed per turn.'                                                  },
        { name: 'Bonus Action',      actionsAllowedPerRound: 1, description: 'Supplemental action — one allowed per turn alongside a Main Action.'                      },
        { name: 'Item Interaction',  actionsAllowedPerRound: 1, description: 'Item use slot — one allowed per turn (using, throwing, or activating a held item).'       },
      ],
    })

    // --- CombatTargetStrategy ---
    await prisma.combatTargetStrategy.createMany({
      skipDuplicates: true,
      data: [
        { name: 'lowest_health'   },
        { name: 'highest_health'  },
        { name: 'lowest_strength' },
        { name: 'random'          },
      ],
    })

    // --- CombatEffectType ---
    await prisma.combatEffectType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'hit_mod',      modifiesRoll: true,  modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'damage_mod',   modifiesRoll: true,  modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'stat_mod',     modifiesRoll: false, modifiesStat: true,  deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'action_denial',modifiesRoll: false, modifiesStat: false, deniesActions: true,  modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'ac_mod',       modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: true,  redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'guard',        modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: true,  forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'taunt',        modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: true,  isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'parry',        modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: true,  absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'absorb',       modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: true,  grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'dodge_stance', modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: true,  enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'counterattack',modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: true,  absorbsDamage: false, grantsEvasion: false, enablesCounterattack: true,  suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'suppress',     modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: true,  removesEffects: false, preventedAsTarget: false, reflectsDamage: false },
        { name: 'dispel',       modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: true,  preventedAsTarget: false, reflectsDamage: false },
        { name: 'untargetable', modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: true,  reflectsDamage: false },
        { name: 'reflect',      modifiesRoll: false, modifiesStat: false, deniesActions: false, modifiesAC: false, redirectsDamage: false, forcesTargeting: false, isReactive: false, absorbsDamage: false, grantsEvasion: false, enablesCounterattack: false, suppressesReactive: false, removesEffects: false, preventedAsTarget: false, reflectsDamage: true  },
      ],
    })

    // --- CombatRollType ---
    await prisma.combatRollType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'hit'    },
        { name: 'damage' },
        { name: 'heal'   },
      ],
    })

    // --- DamageCategory ---
    await prisma.damageCategory.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Physical' },
        { name: 'Magical'  },
        { name: 'True'     },
      ],
    })

    // --- ConditionContext ---
    await prisma.conditionContext.createMany({
      skipDuplicates: true,
      data: [
        { name: 'illness'    },
        { name: 'injury'     },
        { name: 'biological' },
        { name: 'buff'       },
        { name: 'debuff'     },
      ],
    })

    // --- ConditionType ---
    await prisma.conditionType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Timed',       description: 'Counts calendar days against maxDays. No roll. Advances or removes at cap via links.',                                                                       tracksDays: true,  tracksProgression: false, canSelfResolve: true,  canSpawn: true  },
        { name: 'LifeCycle',   description: 'Counts calendar days against maxDays. No roll. Advances cleanly through its chain with no complications.',                                                  tracksDays: true,  tracksProgression: false, canSelfResolve: true,  canSpawn: false },
        { name: 'Progressive', description: 'Daily CON roll vs. dailyRollDC. Value moves bidirectionally. Removes or advances at endpoints via links.',                                                  tracksDays: false, tracksProgression: true,  canSelfResolve: true,  canSpawn: true  },
        { name: 'Chronic',     description: 'Daily CON roll vs. dailyRollDC. Floors at 0 and cap — never self-removes. Spawn checks keep firing at cap until treated.',                                  tracksDays: false, tracksProgression: true,  canSelfResolve: false, canSpawn: true  },
        { name: 'Permanent',   description: 'No progression, no roll. Condition persists indefinitely applying its modifiers. Removed only by admin.',                                                   tracksDays: false, tracksProgression: false, canSelfResolve: false, canSpawn: false },
      ],
    })

    // --- ConditionBehaviorType ---
    await prisma.conditionBehaviorType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'redirect' },
        { name: 'cancel'   },
        { name: 'bias'     },
        { name: 'restrict' },
      ],
    })

    // --- BehaviorRedirectTarget ---
    await prisma.behaviorRedirectTarget.createMany({
      skipDuplicates: true,
      data: [
        { name: 'source'       },
        { name: 'self'         },
        { name: 'random_ally'  },
        { name: 'random_enemy' },
      ],
    })

    // --- FactionStandingType ---
    await prisma.factionStandingType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Ally'    },
        { name: 'Neutral' },
        { name: 'Hostile' },
        { name: 'Enemy'   },
        { name: 'Truce'   },
      ],
    })

    // --- RelationshipType ---
    await prisma.relationshipType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'mother', label: 'Mother', isUnique: false },
        { name: 'father', label: 'Father', isUnique: false },
        { name: 'mentor', label: 'Mentor', isUnique: true  },
      ],
    })

    // --- EventTriggerType ---
    await prisma.eventTriggerType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'admin'         },
        { name: 'patrol'        },
        { name: 'hunt'          },
        { name: 'crafting'      },
        { name: 'foraging'      },
        { name: 'clean'         },
        { name: 'weather_onset' },
        { name: 'threshold'     },
        { name: 'daily'         },
        { name: 'hourly'        },
      ],
    })

    // --- EventScope ---
    await prisma.eventScope.createMany({
      skipDuplicates: true,
      data: [
        { name: 'global'  },
        { name: 'faction' },
        { name: 'action'  },
        { name: 'camp'    },
      ],
    })

    // --- EventStepType ---
    await prisma.eventStepType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'narrative'          },
        { name: 'narrative_random'   },
        { name: 'choice_solo'        },
        { name: 'choice_leader'      },
        { name: 'choice_consensus'   },
        { name: 'proficiency_check'  },
        { name: 'condition_check'    },
        { name: 'item_check'         },
        { name: 'threshold_check'    },
        { name: 'combat'             },
        { name: 'effect'             },
        { name: 'exit'               },
      ],
    })

    // --- EventCheckType ---
    await prisma.eventCheckType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'proficiency' },
        { name: 'condition'   },
        { name: 'item'        },
        { name: 'threshold'   },
      ],
    })

    // --- EventThresholdType ---
    await prisma.eventThresholdType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'filth' },
      ],
    })

    // --- EventParticipantScope ---
    await prisma.eventParticipantScope.createMany({
      skipDuplicates: true,
      data: [
        { name: 'all_participants',   appliesToAll: true,  appliesToRandom: false, appliesToLeader: false, appliesToGroup: false, appliesToHoused: false },
        { name: 'random_participant', appliesToAll: false, appliesToRandom: true,  appliesToLeader: false, appliesToGroup: false, appliesToHoused: false },
        { name: 'leader',             appliesToAll: false, appliesToRandom: false, appliesToLeader: true,  appliesToGroup: false, appliesToHoused: false },
        { name: 'group',              appliesToAll: false, appliesToRandom: false, appliesToLeader: false, appliesToGroup: true,  appliesToHoused: false },
        { name: 'housed_entities',    appliesToAll: false, appliesToRandom: false, appliesToLeader: false, appliesToGroup: false, appliesToHoused: true  },
      ],
    })

    // --- TargetType ---
    await prisma.targetType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'discipline_xp',      isAbility: true },
        { name: 'drop_plant',         isAbility: true },
        { name: 'drop_species',       isAbility: true },
        { name: 'drop_forage',        isAbility: true },
        { name: 'drop_item',          isAbility: true },
        { name: 'crafting_yield',     isAbility: true },
        { name: 'crafting_quantity',  isAbility: true },
        { name: 'recovery_rate',      isAbility: true },
        { name: 'energy_cost',        isAbility: true },
        { name: 'treatment_given',    isAbility: true },
        { name: 'treatment_recieved', isAbility: true },
        { name: 'constuction_speed',  isAbility: true },
        { name: 'faction_rep',        isAbility: true },
        { name: 'scouting_range',     isAbility: true },
        { name: 'healing_recieved',   isAbility: true },
        { name: 'healing_given',      isAbility: true },
      ],
    })

    // --- CraftingInteraction ---
    await prisma.craftingInteraction.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Brew',    description: 'Steep ingredients in hot water to extract properties into a drinkable liquid.'                               },
        { name: 'Dry',     description: 'Remove moisture from an ingredient through air or gentle heat, preserving it and concentrating its properties.' },
        { name: 'Grind',   description: 'Break down dried or hard ingredients into a powder or paste using friction.'                                 },
        { name: 'Mash',    description: 'Crush soft ingredients into a wet, pulpy mash without drying.'                                              },
        { name: 'Bake',    description: 'Apply sustained dry heat to transform ingredients into a solid, edible form.'                               },
        { name: 'Render',  description: 'Melt animal fat over low heat to produce a purified liquid oil.'                                            },
        { name: 'Crush',   description: 'Apply sharp pressure to break apart hard ingredients such as seeds, shells, or bark.'                       },
        { name: 'Butcher', description: 'Break down a carcass or prey item into usable parts such as meat, fat, bone, and pelt.'                     },
        { name: 'Craft',   description: 'Assemble raw materials into a finished item using skill and tools.'                                         },
        { name: 'Carve',   description: 'Shape bone, stone, or wood into a finished form using a cutting tool.'                                      },
        { name: 'Weave',   description: 'Interlace fibers, vines, or reeds into cloth, cord, or woven goods.'                                        },
        { name: 'Tan',     description: 'Treat a raw hide to produce durable leather.'                                                               },
        { name: 'Smelt',   description: 'Melt raw ore in a furnace to produce refined metal ingots.'                                                 },
        { name: 'Forge',   description: 'Shape a heated ingot into tools, weapons, or armor using hammer and anvil.'                                 },
        { name: 'Temper',  description: 'Harden and refine metal through repeated cycles of heating and cooling.'                                    },
        { name: 'Kiln',    description: 'Fire clay or ceramic items at high heat to produce hardened, permanent forms.'                              },
      ],
    })

    // --- DisciplineDef ---
    await prisma.disciplineDef.createMany({
      skipDuplicates: true,
      data: [
        { codeName: 'healing',          name: 'Healing',          description: 'Treating wounds, illness, and conditions',                                      baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'crafting',         name: 'Crafting',         description: 'Creating items via recipes',                                                    baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'farming',          name: 'Farming',          description: 'Growing, gathering, and tending plant-based resources',                         baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'combat',           name: 'Combat',           description: 'Fighting effectiveness and battle experience',                                  baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'scouting',         name: 'Scouting',         description: 'Patrol, territory awareness, and threat detection',                             baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'social',           name: 'Social',           description: 'Leadership, diplomacy, and faction influence',                                  baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'training',         name: 'Training',         description: 'Mentoring other entities and accelerating their growth',                        baseXp: 100,  isStatProgression: false, dailyXpCap: null },
        { codeName: 'stat_progression', name: 'StatProgression',  description: 'Tracks XP toward stat points; excluded from discipline listings',               baseXp: 1250, isStatProgression: true,  dailyXpCap: 100  },
      ],
    })

    // --- ActionSystemType ---
    await prisma.actionSystemType.createMany({
      skipDuplicates: true,
      data: [
        { id: 'patrol',            description: 'Event-chance patrol system: rolls for random events at location; otherwise grants rewards',                         cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'hunting',           description: 'Prey weight rolls at location; may spawn a combat instance against prey species',                                   cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'foraging',          description: 'Drop table / gather rolls based on location biome and active env conditions',                                       cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'spar',              description: 'Spawns a non-lethal ActiveCombat (CombatInitiationType = spar); XP at 50%',                                        cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'fight',             description: 'Spawns a lethal ActiveCombat (CombatInitiationType = fight)',                                                       cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'crafting',          description: 'Opens the crafting UI for participants; XP flows from Recipe_DisciplineReward',                                     cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'healing',           description: 'Opens the treatment UI for the healer; XP flows from treatment subsystem',                                         cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'diagnose',          description: 'Opens the diagnosis UI; reveals symptoms and attempts condition identification',                                     cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'clean',             description: 'Interactive camp cleaning UI; player chooses target (base / food / herb storage)',                                   cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_crop',      description: 'Crop work UI: plant, harvest, uproot, or cross-breed a PlotCrop',                                                  cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_tend',      description: 'Tending UI: water, prune, or fertilize a PlotCrop',                                                                cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_compost',   description: 'Deposit compost items into a compost structure; increases soil quality',                                            cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_plant',     description: '[internal] Plant a propagation item into an open plot slot',                                                        cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_harvest',   description: '[internal] Harvest a mature PlotCrop',                                                                              cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_uproot',    description: '[internal] Uproot a PlotCrop at any stage',                                                                         cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_crossbreed',description: '[internal] Cross-breed two mature PlotCrops; solo only',                                                            cooldownHours: null, progressPoints: null, entityDailyLimit: null },
        { id: 'farming_water',     description: '[internal] Daily tending action: water a PlotCrop',                                                                 cooldownHours: 24,   progressPoints: 1,    entityDailyLimit: null },
        { id: 'farming_prune',     description: '[internal] Weekly tending action: prune a PlotCrop',                                                                cooldownHours: 168,  progressPoints: 7,    entityDailyLimit: null },
        { id: 'farming_fertilize', description: '[internal] Weekly tending action: fertilize a PlotCrop',                                                            cooldownHours: 168,  progressPoints: 7,    entityDailyLimit: null },
      ],
    })

    // --- Symptom ---
    await prisma.symptom.createMany({
      skipDuplicates: true,
      data: [
        // RESPIRATORY
        { name: 'Runny Nose',                           defaultRoll: 3  },
        { name: 'Sneezing',                             defaultRoll: 0  },
        { name: 'Nasal Bleeding',                       defaultRoll: 2  },
        { name: 'Congestion',                           defaultRoll: 5  },
        { name: 'Coughing',                             defaultRoll: 0  },
        { name: 'Sore Throat',                          defaultRoll: 12 },
        { name: 'Wheezing',                             defaultRoll: 3  },
        { name: 'Rattling Breath',                      defaultRoll: 2  },
        { name: 'Rapid Breathing',                      defaultRoll: 2  },
        { name: 'Labored Breathing',                    defaultRoll: 2  },
        { name: 'Difficulty Breathing',                 defaultRoll: 3  },
        { name: 'Open-mouth Breathing',                 defaultRoll: 0  },
        { name: 'Gasping for Air',                      defaultRoll: 0  },
        { name: 'Cyanosis (Bluish Tongue/Gums)',        defaultRoll: 8  },
        { name: 'Choking',                              defaultRoll: 0  },
        // NEUROLOGICAL
        { name: 'Unconsciousness',                      defaultRoll: 0  },
        { name: 'Seizure',                              defaultRoll: 0  },
        { name: 'Tremors',                              defaultRoll: 5  },
        { name: 'Disorientation',                       defaultRoll: 5  },
        { name: 'Dizziness',                            defaultRoll: 8  },
        { name: 'Confusion',                            defaultRoll: 7  },
        { name: 'Memory Loss',                          defaultRoll: 15 },
        { name: 'Head Tilt',                            defaultRoll: 3  },
        { name: 'Circling',                             defaultRoll: 3  },
        { name: 'Loss of Coordination (Ataxia)',        defaultRoll: 5  },
        { name: 'Hyperactivity',                        defaultRoll: 3  },
        { name: 'Depression (Low Mood / Unresponsiveness)', defaultRoll: 8 },
        { name: 'Hallucination-like Behavior',          defaultRoll: 5  },
        { name: 'Sensitivity to Sound',                 defaultRoll: 12 },
        { name: 'Sudden Personality Change',            defaultRoll: 10 },
        // DIGESTIVE
        { name: 'Vomiting',                             defaultRoll: 0  },
        { name: 'Nausea',                               defaultRoll: 8  },
        { name: 'Diarrhea',                             defaultRoll: 3  },
        { name: 'Constipation',                         defaultRoll: 12 },
        { name: 'Loss of Appetite',                     defaultRoll: 5  },
        { name: 'Bellyache',                            defaultRoll: 10 },
        { name: 'Bloating',                             defaultRoll: 5  },
        { name: 'Excessive Gas',                        defaultRoll: 5  },
        { name: 'Straining to Defecate',                defaultRoll: 5  },
        { name: 'Blood in Stool',                       defaultRoll: 8  },
        { name: 'Black/Tarry Stool',                    defaultRoll: 8  },
        { name: 'Regurgitation',                        defaultRoll: 3  },
        { name: 'Difficulty Swallowing',                defaultRoll: 8  },
        // CARDIOVASCULAR
        { name: 'Irregular Heartbeat',                  defaultRoll: 15 },
        { name: 'Weak Pulse',                           defaultRoll: 15 },
        { name: 'Fainting (Syncope)',                   defaultRoll: 3  },
        { name: 'Cold Extremities',                     defaultRoll: 8  },
        // URINARY / REPRODUCTIVE
        { name: 'Frequent Urination',                   defaultRoll: 8  },
        { name: 'Painful Urination',                    defaultRoll: 10 },
        { name: 'Blood in Urine',                       defaultRoll: 8  },
        { name: 'Incontinence',                         defaultRoll: 5  },
        { name: 'Strong Urine Odor',                    defaultRoll: 5  },
        { name: 'Swollen Abdomen (Fluid Buildup)',      defaultRoll: 5  },
        { name: 'Miscarriage',                          defaultRoll: 0  },
        { name: 'Abnormal Discharge (Reproductive)',    defaultRoll: 8  },
        { name: 'Labor Complications',                  defaultRoll: 3  },
        { name: 'Low Milk Production',                  defaultRoll: 12 },
        // MUSCULOSKELETAL
        { name: 'Limping',                              defaultRoll: 0  },
        { name: 'Paralysis',                            defaultRoll: 0  },
        { name: 'Stiffness',                            defaultRoll: 5  },
        { name: 'Joint Pain',                           defaultRoll: 10 },
        { name: 'Broken Bone',                          defaultRoll: 5  },
        { name: 'Sprain',                               defaultRoll: 8  },
        { name: 'Muscle Cramps',                        defaultRoll: 8  },
        { name: 'Muscle Rigidity',                      defaultRoll: 8  },
        { name: 'Muscle Wasting',                       defaultRoll: 7  },
        { name: 'Trembling When Standing',              defaultRoll: 3  },
        { name: 'Reluctance to Move',                   defaultRoll: 5  },
        { name: 'Difficulty Rising',                    defaultRoll: 3  },
        { name: 'Loss of Balance',                      defaultRoll: 5  },
        { name: 'Numbness',                             defaultRoll: 18 },
        // SYSTEMIC / GENERAL
        { name: 'Fever',                                defaultRoll: 8  },
        { name: 'Chills',                               defaultRoll: 5  },
        { name: 'Fatigue',                              defaultRoll: 7  },
        { name: 'Lethargy',                             defaultRoll: 5  },
        { name: 'Weakness',                             defaultRoll: 7  },
        { name: 'Shivering',                            defaultRoll: 3  },
        { name: 'Panting',                              defaultRoll: 3  },
        { name: 'Dehydration',                          defaultRoll: 8  },
        { name: 'Excessive Thirst',                     defaultRoll: 5  },
        { name: 'Weight Loss',                          defaultRoll: 5  },
        { name: 'Visible Ribs',                         defaultRoll: 3  },
        { name: 'Emaciation',                           defaultRoll: 0  },
        { name: 'Pot Belly',                            defaultRoll: 3  },
        { name: 'Hunger Pangs',                         defaultRoll: 12 },
        { name: 'Shock',                                defaultRoll: 5  },
        { name: 'Sudden Collapse',                      defaultRoll: 0  },
        { name: 'Failure to Thrive',                    defaultRoll: 8  },
        { name: 'Heat Intolerance',                     defaultRoll: 10 },
        { name: 'Cold Intolerance',                     defaultRoll: 10 },
        { name: 'Night Sweats',                         defaultRoll: 12 },
        { name: 'Enlarged Organs',                      defaultRoll: 15 },
        { name: 'Swollen Lymph Nodes',                  defaultRoll: 12 },
        { name: 'Aggression',                           defaultRoll: 3  },
        { name: 'Restlessness',                         defaultRoll: 5  },
        { name: 'Anxiety',                              defaultRoll: 8  },
        { name: 'Withdrawal',                           defaultRoll: 8  },
        // WOUNDS / SKIN
        { name: 'Bleeding',                             defaultRoll: 0  },
        { name: 'Wound',                                defaultRoll: 3  },
        { name: 'Pain',                                 defaultRoll: 8  },
        { name: 'Burn',                                 defaultRoll: 5  },
        { name: 'Blistering',                           defaultRoll: 8  },
        { name: 'Bruising',                             defaultRoll: 10 },
        { name: 'Itching',                              defaultRoll: 5  },
        { name: 'Pus',                                  defaultRoll: 8  },
        { name: 'Swelling',                             defaultRoll: 5  },
        { name: 'Rash',                                 defaultRoll: 10 },
        { name: 'Discharge',                            defaultRoll: 8  },
        { name: 'Inflammation',                         defaultRoll: 8  },
        { name: 'Infection',                            defaultRoll: 10 },
        { name: 'Festering Wound',                      defaultRoll: 5  },
        { name: 'Hair Loss',                            defaultRoll: 3  },
        { name: 'Matted Fur',                           defaultRoll: 0  },
        { name: 'Dry Skin',                             defaultRoll: 8  },
        { name: 'Hot Spots',                            defaultRoll: 8  },
        { name: 'Scabs',                                defaultRoll: 5  },
        { name: 'Flaky Skin (Dandruff)',                defaultRoll: 5  },
        { name: 'Thickened Skin',                       defaultRoll: 10 },
        { name: 'Skin Discoloration',                   defaultRoll: 8  },
        // HEAD / SENSES
        { name: 'Glazed Eyes',                          defaultRoll: 3  },
        { name: 'Sunken Eyes',                          defaultRoll: 5  },
        { name: 'Cloudy Eye',                           defaultRoll: 3  },
        { name: 'Squinting',                            defaultRoll: 3  },
        { name: 'Red Eyes',                             defaultRoll: 3  },
        { name: 'Eye Discharge',                        defaultRoll: 3  },
        { name: 'Dilated Pupils',                       defaultRoll: 5  },
        { name: 'Unequal Pupil Size',                   defaultRoll: 8  },
        { name: 'Loss of Vision',                       defaultRoll: 10 },
        { name: 'Sensitivity to Light',                 defaultRoll: 8  },
        { name: 'Blurred Vision',                       defaultRoll: 15 },
        { name: 'Loss of Hearing',                      defaultRoll: 15 },
        { name: 'Head Shaking',                         defaultRoll: 3  },
        { name: 'Ear Discharge',                        defaultRoll: 5  },
        { name: 'Ear Odor',                             defaultRoll: 5  },
        { name: 'Bad Breath',                           defaultRoll: 5  },
        { name: 'Gum Swelling',                         defaultRoll: 8  },
        { name: 'Pale Gums',                            defaultRoll: 7  },
        { name: 'Yellowing Gums',                       defaultRoll: 8  },
        { name: 'Foaming at Mouth',                     defaultRoll: 0  },
        { name: 'Toothache',                            defaultRoll: 15 },
        // OTHER
        { name: 'Hypersensitivity',                     defaultRoll: 12 },
        { name: 'Respiratory Illness',                  defaultRoll: 5  },
        { name: 'Poisoning',                            defaultRoll: 10 },
        { name: 'Drooling',                             defaultRoll: 3  },
      ],
    })

    // =========================================================================
    // TIER 2 — Depends on Tier 1
    // =========================================================================

    // --- EnvCondition ---
    await prisma.envCondition.createMany({
      skipDuplicates: true,
      data: [
        // Temperature / Precipitation
        { codeName: 'cold',           name: 'Cold'          },
        { codeName: 'frost',          name: 'Frost'         },
        { codeName: 'snow',           name: 'Snow'          },
        { codeName: 'freezing',       name: 'Freezing'      },
        { codeName: 'warm',           name: 'Warm'          },
        { codeName: 'heat',           name: 'Heat'          },
        { codeName: 'scorching',      name: 'Scorching'     },
        { codeName: 'icy',            name: 'Icy'           },
        // Moisture
        { codeName: 'humid',          name: 'Humid'         },
        { codeName: 'damp',           name: 'Damp'          },
        { codeName: 'rain',           name: 'Rain'          },
        { codeName: 'storm',          name: 'Storm'         },
        { codeName: 'flood',          name: 'Flood'         },
        { codeName: 'dry',            name: 'Dry'           },
        { codeName: 'arid',           name: 'Arid'          },
        // Wind
        { codeName: 'still',          name: 'Still'         },
        { codeName: 'breezy',         name: 'Breezy'        },
        { codeName: 'windy',          name: 'Windy'         },
        { codeName: 'gusting',        name: 'Gusting'       },
        // Air / Ground Conditions
        { codeName: 'fog',            name: 'Fog'           },
        { codeName: 'misty',          name: 'Misty'         },
        { codeName: 'hazy',           name: 'Hazy'          },
        { codeName: 'dusty',          name: 'Dusty'         },
        { codeName: 'filth',          name: 'Filth'         },
        { codeName: 'muddy',          name: 'Muddy'         },
        { codeName: 'pollen',         name: 'Pollen'        },
        { codeName: 'smoke',          name: 'Smoke'         },
        { codeName: 'toxic',          name: 'Toxic'         },
        // Light / Sky
        { codeName: 'overcast',       name: 'Overcast'      },
        { codeName: 'sunny',          name: 'Sunny'         },
        { codeName: 'harsh_sunlight', name: 'Harsh Sunlight'},
        { codeName: 'bright',         name: 'Bright'        },
        { codeName: 'dappled_light',  name: 'Dappled Light' },
        { codeName: 'shaded',         name: 'Shaded'        },
        { codeName: 'dim',            name: 'Dim'           },
        { codeName: 'dark',           name: 'Dark'          },
        // Land Use
        { codeName: 'cultivated',     name: 'Cultivated'    },
        // Engine-Reserved
        { codeName: 'power_loss',     name: 'Power Loss'    },
        // Seasonal
        { codeName: 'spring',         name: 'Spring'        },
        { codeName: 'summer',         name: 'Summer'        },
        { codeName: 'autumn',         name: 'Autumn'        },
        { codeName: 'winter',         name: 'Winter'        },
      ],
    })

    // --- DamageType (depends on DamageCategory) ---
    const damageCategoryRows = await prisma.damageCategory.findMany()
    const dcMap = new Map(damageCategoryRows.map(r => [r.name, r.id]))

    await prisma.damageType.createMany({
      skipDuplicates: true,
      data: [
        { codeName: 'blunt',     name: 'Blunt',     categoryId: dcMap.get('Physical')! },
        { codeName: 'slashing',  name: 'Slashing',  categoryId: dcMap.get('Physical')! },
        { codeName: 'piercing',  name: 'Piercing',  categoryId: dcMap.get('Physical')! },
        { codeName: 'fire',      name: 'Fire',      categoryId: dcMap.get('Magical')!  },
        { codeName: 'frost',     name: 'Frost',     categoryId: dcMap.get('Magical')!  },
        { codeName: 'lightning', name: 'Lightning', categoryId: dcMap.get('Magical')!  },
        { codeName: 'poison',    name: 'Poison',    categoryId: dcMap.get('Magical')!  },
        { codeName: 'arcane',    name: 'Arcane',    categoryId: dcMap.get('Magical')!  },
        { codeName: 'nature',    name: 'Nature',    categoryId: dcMap.get('Magical')!  },
        { codeName: 'shadow',    name: 'Shadow',    categoryId: dcMap.get('Magical')!  },
        { codeName: 'radiant',   name: 'Radiant',   categoryId: dcMap.get('Magical')!  },
        { codeName: 'sonic',     name: 'Sonic',     categoryId: dcMap.get('Magical')!  },
        { codeName: 'acid',      name: 'Acid',      categoryId: dcMap.get('Magical')!  },
        { codeName: 'wind',      name: 'Wind',      categoryId: dcMap.get('Magical')!  },
        { codeName: 'void',      name: 'Void',      categoryId: dcMap.get('True')!     },
      ],
    })

    // --- MeasurementType lookup (for IngredientType FKs) ---
    const measurementRows = await prisma.measurementType.findMany()
    const mtMap = new Map(measurementRows.map(r => [r.name, r.id]))

    // --- IngredientType (depends on MeasurementType) ---
    await prisma.ingredientType.createMany({
      skipDuplicates: true,
      data: [
        // Descriptive / modifier tags (no measurement)
        { name: 'Dried',    measurementTypeId: null               },
        { name: 'Cooked',   measurementTypeId: null               },
        { name: 'Rotten',   measurementTypeId: null               },
        { name: 'Sweet',    measurementTypeId: null               },
        { name: 'Bitter',   measurementTypeId: null               },
        { name: 'Sour',     measurementTypeId: null               },
        { name: 'Savory',   measurementTypeId: null               },
        { name: 'Spicy',    measurementTypeId: null               },
        { name: 'Mild',     measurementTypeId: null               },
        { name: 'Tea',      measurementTypeId: null               },
        { name: 'Poultice', measurementTypeId: null               },
        { name: 'Salve',    measurementTypeId: null               },
        { name: 'Tincture', measurementTypeId: null               },
        { name: 'Broth',    measurementTypeId: null               },
        { name: 'Meal',     measurementTypeId: null               },
        // Weight
        { name: 'Meat',     measurementTypeId: mtMap.get('Weight')! },
        { name: 'Fat',      measurementTypeId: mtMap.get('Weight')! },
        { name: 'Clay',     measurementTypeId: mtMap.get('Weight')! },
        { name: 'Ground',   measurementTypeId: mtMap.get('Weight')! },
        { name: 'Paste',    measurementTypeId: mtMap.get('Weight')! },
        { name: 'Mash',     measurementTypeId: mtMap.get('Weight')! },
        { name: 'Shredded', measurementTypeId: mtMap.get('Weight')! },
        { name: 'Char',     measurementTypeId: mtMap.get('Weight')! },
        { name: 'Coal',     measurementTypeId: mtMap.get('Weight')! },
        { name: 'Slag',     measurementTypeId: mtMap.get('Weight')! },
        // Count
        { name: 'Flower',   measurementTypeId: mtMap.get('Count')! },
        { name: 'Leaf',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Stalk',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Root',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Seed',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Bark',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Berry',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Bud',      measurementTypeId: mtMap.get('Count')! },
        { name: 'Mushroom', measurementTypeId: mtMap.get('Count')! },
        { name: 'Pelt',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Feather',  measurementTypeId: mtMap.get('Count')! },
        { name: 'Bone',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Sinew',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Egg',      measurementTypeId: mtMap.get('Count')! },
        { name: 'Wood',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Stone',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Vine',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Reed',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Shell',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Fiber',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Cobweb',   measurementTypeId: mtMap.get('Count')! },
        { name: 'Moss',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Ore',      measurementTypeId: mtMap.get('Count')! },
        { name: 'Ingot',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Gem',      measurementTypeId: mtMap.get('Count')! },
        { name: 'Hide',     measurementTypeId: mtMap.get('Count')! },
        { name: 'Leather',  measurementTypeId: mtMap.get('Count')! },
        { name: 'Cloth',    measurementTypeId: mtMap.get('Count')! },
        { name: 'Ceramic',  measurementTypeId: mtMap.get('Count')! },
        // Volume
        { name: 'Liquid',   measurementTypeId: mtMap.get('Volume')! },
        { name: 'Juice',    measurementTypeId: mtMap.get('Volume')! },
        { name: 'Oil',      measurementTypeId: mtMap.get('Volume')! },
        { name: 'Resin',    measurementTypeId: mtMap.get('Volume')! },
      ],
    })

    // --- ActionType (depends on ActionSystemType) ---
    await prisma.actionType.createMany({
      skipDuplicates: true,
      data: [
        { name: 'border_patrol', displayName: 'Border Patrol',      systemTypeId: 'patrol',            requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'hunting',       displayName: 'Hunting Run',         systemTypeId: 'hunting',           requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'foraging',      displayName: 'Foraging Run',        systemTypeId: 'foraging',          requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'spar',          displayName: 'Spar',                systemTypeId: 'spar',              requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'fight',         displayName: 'Fight',               systemTypeId: 'fight',             requiresCanMentor: false, allowApprenticesWithAdult: false, requiresCanLeadEvents: false, minAge: null },
        { name: 'training',      displayName: 'Training Session',    systemTypeId: null,                requiresCanMentor: true,  allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'crafting',      displayName: 'Crafting Session',    systemTypeId: 'crafting',          requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'treat',         displayName: 'Treat Patient',       systemTypeId: 'healing',           requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'diagnose',      displayName: 'Diagnose',            systemTypeId: 'diagnose',          requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'clean',         displayName: 'Clean Camp',          systemTypeId: 'clean',             requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'crop_work',     displayName: 'Crop Work',           systemTypeId: 'farming_crop',      requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'tend_crops',    displayName: 'Tend Crops',          systemTypeId: 'farming_tend',      requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
        { name: 'compost',       displayName: 'Deposit to Compost',  systemTypeId: 'farming_compost',   requiresCanMentor: false, allowApprenticesWithAdult: true,  requiresCanLeadEvents: false, minAge: null },
      ],
    })

    // =========================================================================
    // TIER 3 — Depends on Tier 1 + 2
    // =========================================================================

    // --- Biome (and Biome_EnvCondition) ---
    type BiomeEntry = { codeName: string; name: string; color: number | null; conditions: { codeName: string; stacks: number }[] }
    const biomeData: BiomeEntry[] = [
      // FORESTS
      { codeName: 'forest',               name: 'Forest',               color: 2976301,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'deciduous_forest',     name: 'Deciduous Forest',     color: 4881471,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'coniferous_forest',    name: 'Coniferous Forest',    color: 1727530,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'cold', stacks: 1 }] },
      { codeName: 'mixed_forest',         name: 'Mixed Forest',         color: 4028997,  conditions: [{ codeName: 'shaded', stacks: 1 }] },
      { codeName: 'taiga',                name: 'Taiga',                color: 2776122,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'cold', stacks: 2 }] },
      { codeName: 'rainforest',           name: 'Rainforest',           color: 1796922,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'humid', stacks: 2 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'tropical_dry_forest',  name: 'Tropical Dry Forest',  color: 8227642,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'dry', stacks: 1 }] },
      { codeName: 'cloud_forest',         name: 'Cloud Forest',         color: 6065258,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'misty', stacks: 2 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'bamboo_forest',        name: 'Bamboo Forest',        color: 7187290,  conditions: [{ codeName: 'shaded', stacks: 1 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'mangrove_forest',      name: 'Mangrove Forest',      color: 4880988,  conditions: [{ codeName: 'humid', stacks: 1 }, { codeName: 'damp', stacks: 2 }, { codeName: 'muddy', stacks: 1 }] },
      // GRASSLANDS
      { codeName: 'grassland',            name: 'Grassland',            color: 9287772,  conditions: [] },
      { codeName: 'savanna',              name: 'Savanna',              color: 13150283, conditions: [{ codeName: 'warm', stacks: 1 }, { codeName: 'dry', stacks: 1 }] },
      { codeName: 'steppe',               name: 'Steppe',               color: 11049820, conditions: [{ codeName: 'dry', stacks: 1 }, { codeName: 'windy', stacks: 1 }] },
      { codeName: 'meadow',               name: 'Meadow',               color: 8243322,  conditions: [{ codeName: 'dappled_light', stacks: 1 }] },
      { codeName: 'floodplain_grassland', name: 'Floodplain Grassland', color: 7055472,  conditions: [{ codeName: 'damp', stacks: 1 }, { codeName: 'muddy', stacks: 1 }] },
      // DESERTS
      { codeName: 'arid_desert',          name: 'Arid Desert',          color: 15255674, conditions: [{ codeName: 'arid', stacks: 2 }, { codeName: 'heat', stacks: 1 }] },
      { codeName: 'semi_arid_desert',     name: 'Semi-Arid Desert',     color: 13150298, conditions: [{ codeName: 'arid', stacks: 1 }, { codeName: 'dry', stacks: 1 }] },
      { codeName: 'rocky_desert',         name: 'Rocky Desert',         color: 12089930, conditions: [{ codeName: 'arid', stacks: 1 }, { codeName: 'dusty', stacks: 1 }] },
      { codeName: 'salt_flats',           name: 'Salt Flats',           color: 15788758, conditions: [{ codeName: 'arid', stacks: 2 }, { codeName: 'harsh_sunlight', stacks: 1 }] },
      { codeName: 'badlands',             name: 'Badlands',             color: 12081722, conditions: [{ codeName: 'dusty', stacks: 1 }, { codeName: 'arid', stacks: 1 }] },
      // TUNDRA / ICE
      { codeName: 'arctic_tundra',        name: 'Arctic Tundra',        color: 9222344,  conditions: [{ codeName: 'freezing', stacks: 2 }, { codeName: 'windy', stacks: 1 }] },
      { codeName: 'alpine_tundra',        name: 'Alpine Tundra',        color: 10139816, conditions: [{ codeName: 'cold', stacks: 2 }, { codeName: 'windy', stacks: 1 }] },
      { codeName: 'glacier',              name: 'Glacier',              color: 12114152, conditions: [{ codeName: 'freezing', stacks: 2 }, { codeName: 'icy', stacks: 1 }] },
      { codeName: 'snowfield',            name: 'Snowfield',            color: 15266040, conditions: [{ codeName: 'freezing', stacks: 1 }, { codeName: 'snow', stacks: 1 }] },
      // FRESHWATER
      { codeName: 'river',                name: 'River',                color: 4889272,  conditions: [{ codeName: 'damp', stacks: 1 }] },
      { codeName: 'stream',               name: 'Stream',               color: 6992072,  conditions: [{ codeName: 'damp', stacks: 1 }] },
      { codeName: 'lake',                 name: 'Lake',                 color: 3832488,  conditions: [{ codeName: 'damp', stacks: 1 }, { codeName: 'misty', stacks: 1 }] },
      { codeName: 'pond',                 name: 'Pond',                 color: 5937320,  conditions: [{ codeName: 'damp', stacks: 1 }] },
      { codeName: 'wetlands',             name: 'Wetlands',             color: 5933674,  conditions: [{ codeName: 'damp', stacks: 2 }, { codeName: 'humid', stacks: 1 }] },
      { codeName: 'swamp',                name: 'Swamp',                color: 3828298,  conditions: [{ codeName: 'damp', stacks: 2 }, { codeName: 'humid', stacks: 1 }, { codeName: 'muddy', stacks: 1 }] },
      { codeName: 'marsh',                name: 'Marsh',                color: 5933658,  conditions: [{ codeName: 'damp', stacks: 2 }, { codeName: 'muddy', stacks: 1 }] },
      { codeName: 'bog',                  name: 'Bog',                  color: 4876858,  conditions: [{ codeName: 'damp', stacks: 2 }, { codeName: 'humid', stacks: 1 }] },
      { codeName: 'fen',                  name: 'Fen',                  color: 5929546,  conditions: [{ codeName: 'damp', stacks: 1 }, { codeName: 'humid', stacks: 1 }] },
      // COASTAL / MARINE
      { codeName: 'estuary',              name: 'Estuary',              color: 5937802,  conditions: [{ codeName: 'damp', stacks: 1 }, { codeName: 'humid', stacks: 1 }] },
      { codeName: 'coastal_shore',        name: 'Coastal Shore',        color: 13944986, conditions: [{ codeName: 'breezy', stacks: 1 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'coral_reef',           name: 'Coral Reef',           color: 16743002, conditions: [{ codeName: 'damp', stacks: 1 }] },
      { codeName: 'ocean',                name: 'Ocean',                color: 2775690,  conditions: [{ codeName: 'breezy', stacks: 1 }, { codeName: 'damp', stacks: 1 }] },
      { codeName: 'deep_ocean',           name: 'Deep Ocean',           color: 1718890,  conditions: [] },
      // ELEVATED
      { codeName: 'mountains',            name: 'Mountains',            color: 8026762,  conditions: [{ codeName: 'cold', stacks: 1 }, { codeName: 'windy', stacks: 2 }] },
      { codeName: 'foothills',            name: 'Foothills',            color: 9079402,  conditions: [{ codeName: 'breezy', stacks: 1 }] },
      { codeName: 'highland_plateau',     name: 'Highland Plateau',     color: 10132090, conditions: [{ codeName: 'windy', stacks: 1 }, { codeName: 'bright', stacks: 1 }] },
      { codeName: 'cliffs',               name: 'Cliffs',               color: 9075306,  conditions: [{ codeName: 'windy', stacks: 2 }, { codeName: 'bright', stacks: 1 }] },
      // SPECIAL
      { codeName: 'volcano',              name: 'Volcano',              color: 9058858,  conditions: [{ codeName: 'scorching', stacks: 1 }, { codeName: 'dusty', stacks: 1 }] },
      { codeName: 'oasis',                name: 'Oasis',                color: 4896906,  conditions: [{ codeName: 'damp', stacks: 2 }] },
      { codeName: 'canyon',               name: 'Canyon',               color: 13138506, conditions: [{ codeName: 'dusty', stacks: 1 }, { codeName: 'dry', stacks: 1 }] },
      // HUMAN-MADE / BUILT
      { codeName: 'urban',                name: 'Urban',                color: 9079450,  conditions: [{ codeName: 'filth', stacks: 1 }, { codeName: 'dusty', stacks: 1 }] },
      { codeName: 'suburban',             name: 'Suburban',             color: 11053210, conditions: [{ codeName: 'cultivated', stacks: 1 }] },
      { codeName: 'ruins',                name: 'Ruins',                color: 8024160,  conditions: [{ codeName: 'dusty', stacks: 1 }] },
      { codeName: 'farmland',             name: 'Farmland',             color: 11061360, conditions: [{ codeName: 'cultivated', stacks: 1 }] },
      // UNDERGROUND
      { codeName: 'cave_system',          name: 'Cave System',          color: 5921386,  conditions: [{ codeName: 'dark', stacks: 2 }, { codeName: 'damp', stacks: 1 }, { codeName: 'cold', stacks: 1 }] },
    ]

    // Upsert biomes (createMany skipDuplicates doesn't work well for subsequent condition inserts)
    for (const b of biomeData) {
      await prisma.biome.upsert({
        where: { codeName: b.codeName },
        create: { codeName: b.codeName, name: b.name, color: b.color },
        update: {},
      })
    }

    // Biome_EnvCondition — build after both Biome and EnvCondition exist
    const ecRows = await prisma.envCondition.findMany()
    const ecByCode = new Map(ecRows.map(r => [r.codeName, r.id]))
    const biomeRows = await prisma.biome.findMany()
    const biomeByCode = new Map(biomeRows.map(r => [r.codeName, r.id]))

    for (const b of biomeData) {
      const biomeId = biomeByCode.get(b.codeName)!
      for (const cond of b.conditions) {
        const envConditionId = ecByCode.get(cond.codeName)
        if (!envConditionId) {
          console.warn(`  Warning: EnvCondition codeName '${cond.codeName}' not found for biome '${b.codeName}'`)
          continue
        }
        await prisma.biome_EnvCondition.upsert({
          where: { biomeId_envConditionId: { biomeId, envConditionId } },
          create: { biomeId, envConditionId, stacks: cond.stacks },
          update: { stacks: cond.stacks },
        })
      }
    }

    // --- Season (no envConditionId yet) ---
    await prisma.season.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Spring' },
        { name: 'Summer' },
        { name: 'Autumn' },
        { name: 'Winter' },
      ],
    })

    // Update Season envConditionId FKs
    const seasonEnvMap: Record<string, string> = {
      Spring: 'spring',
      Summer: 'summer',
      Autumn: 'autumn',
      Winter: 'winter',
    }
    for (const [seasonName, ecCode] of Object.entries(seasonEnvMap)) {
      const ecId = ecByCode.get(ecCode)
      if (ecId) {
        await prisma.season.update({
          where: { name: seasonName },
          data: { envConditionId: ecId },
        })
      }
    }

    // --- ActionType_Step (depends on ActionType, Stat) ---
    const actionTypeRows = await prisma.actionType.findMany()
    const atMap = new Map(actionTypeRows.map(r => [r.name, r.id]))
    const statRows = await prisma.stat.findMany()
    const statMap = new Map(statRows.map(r => [r.name, r.id]))

    const INT = statMap.get('Intelligence')!
    const WIS = statMap.get('Wisdom')!

    // Crafting steps (all 16 interaction types)
    const craftingSteps = [
      { codeName: 'brew',    description: 'Crafter rolls to steep and extract properties from ingredients'         },
      { codeName: 'dry',     description: 'Crafter rolls to dry ingredients without losing potency'                 },
      { codeName: 'grind',   description: 'Crafter rolls to grind ingredients to the correct consistency'           },
      { codeName: 'mash',    description: 'Crafter rolls to mash ingredients into a workable pulp'                  },
      { codeName: 'bake',    description: 'Crafter rolls to bake ingredients at the correct heat and duration'      },
      { codeName: 'render',  description: 'Crafter rolls to render animal fat cleanly without scorching'            },
      { codeName: 'crush',   description: 'Crafter rolls to apply the right pressure to break down ingredients'     },
      { codeName: 'butcher', description: 'Crafter rolls to cleanly butcher and recover usable parts'               },
      { codeName: 'craft',   description: 'Crafter rolls to assemble components into the finished item'             },
      { codeName: 'carve',   description: 'Crafter rolls to shape the material precisely with a cutting tool'       },
      { codeName: 'weave',   description: 'Crafter rolls to interlace fibers into a consistent, durable form'       },
      { codeName: 'tan',     description: 'Crafter rolls to treat the hide through the tanning process'             },
      { codeName: 'smelt',   description: 'Crafter rolls to correctly melt and refine the raw ore'                  },
      { codeName: 'forge',   description: 'Crafter rolls to shape the heated metal into the desired form'           },
      { codeName: 'temper',  description: 'Crafter rolls to complete the tempering cycle without cracking the metal'},
      { codeName: 'kiln',    description: 'Crafter rolls to fire the clay or ceramic at the correct temperature'    },
    ]

    const actionSteps = [
      ...craftingSteps.map(s => ({ actionTypeId: atMap.get('crafting')!, codeName: s.codeName, description: s.description, defaultStatId: INT })),
      { actionTypeId: atMap.get('hunting')!,       codeName: 'locate_prey',       description: 'Hunter rolls to detect prey in the location',         defaultStatId: WIS },
      { actionTypeId: atMap.get('border_patrol')!, codeName: 'patrol_start',      description: '',                                                     defaultStatId: WIS },
      { actionTypeId: atMap.get('foraging')!,      codeName: 'locate_plants',     description: '',                                                     defaultStatId: WIS },
      { actionTypeId: atMap.get('foraging')!,      codeName: 'locate_items',      description: '',                                                     defaultStatId: WIS },
      { actionTypeId: atMap.get('treat')!,         codeName: 'treat_patient',     description: '',                                                     defaultStatId: INT },
      { actionTypeId: atMap.get('diagnose')!,      codeName: 'diagnose_patient',  description: '',                                                     defaultStatId: INT },
    ]

    for (const step of actionSteps) {
      await prisma.actionType_Step.upsert({
        where: { actionTypeId_codeName: { actionTypeId: step.actionTypeId, codeName: step.codeName } },
        create: step,
        update: {},
      })
    }

    // --- Species_ActionStep (depends on Stat) ---
    const DEX = statMap.get('Dexterity')!
    await prisma.species_ActionStep.createMany({
      skipDuplicates: true,
      data: [
        { codeName: 'avoid',          description: 'Prey rolls to avoid being noticed',                                                defaultStatId: DEX },
        { codeName: 'counter_avoid',  description: 'Hunter rolls to find this specific prey',                                          defaultStatId: DEX },
        { codeName: 'escape',         description: 'Prey rolls to outpace the pursuer',                                                defaultStatId: DEX },
        { codeName: 'counter_escape', description: 'Hunter rolls to successfully counter the prey\'s escape attempt',                  defaultStatId: DEX },
      ],
    })

    console.log('✓ Seed complete')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
