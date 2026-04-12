-- Enable citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "maxFactions" INTEGER NOT NULL DEFAULT 10,
    "maxRanks" INTEGER NOT NULL DEFAULT 30,
    "maxSpecies" INTEGER NOT NULL DEFAULT 100,
    "maxPlants" INTEGER NOT NULL DEFAULT 100,
    "premiumDoubleEnergy" BOOLEAN NOT NULL DEFAULT true,
    "premiumGuildBoosts" BOOLEAN NOT NULL DEFAULT true,
    "premiumMoreEntities" BOOLEAN NOT NULL DEFAULT true,
    "premiumRollBonus" BOOLEAN NOT NULL DEFAULT true,
    "premiumCustomColor" BOOLEAN NOT NULL DEFAULT true,
    "premiumLongerArchive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GuildSettings" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "seasonId" INTEGER,
    "currentPatternId" INTEGER,
    "currentPatternStepId" INTEGER,
    "currentStepStartedAt" TIMESTAMPTZ,
    "defaultDailyEnergy" INTEGER NOT NULL DEFAULT 100,
    "doubleAgeMaxThreshold" INTEGER NOT NULL DEFAULT 0,
    "maxCombatRounds" INTEGER NOT NULL DEFAULT 50,
    "defaultProficiencyBonus" INTEGER NOT NULL DEFAULT 2,
    "worldSimEnabled" BOOLEAN NOT NULL DEFAULT true,
    "conditionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "combatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "activitiesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "craftingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "progressionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "socialEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTickAt" TIMESTAMPTZ,
    "lastEventAt" TIMESTAMPTZ,
    "disciplineLevelCap" INTEGER,
    "factionRepDecayRate" INTEGER NOT NULL DEFAULT 5,
    "farmingSoilDegradationFilth" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "farmingSoilDegradationToxic" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "farmingCompostIncrement" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EchoDens" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "allowWorldSim" BOOLEAN NOT NULL DEFAULT true,
    "allowConditions" BOOLEAN NOT NULL DEFAULT true,
    "allowCombat" BOOLEAN NOT NULL DEFAULT true,
    "allowActivities" BOOLEAN NOT NULL DEFAULT true,
    "allowEvents" BOOLEAN NOT NULL DEFAULT true,
    "allowCrafting" BOOLEAN NOT NULL DEFAULT true,
    "allowProgression" BOOLEAN NOT NULL DEFAULT true,
    "allowSocial" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EchoDens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "isConditionSystem" BOOLEAN NOT NULL DEFAULT false,
    "isStructureSystem" BOOLEAN NOT NULL DEFAULT false,
    "isSkillSystem" BOOLEAN NOT NULL DEFAULT false,
    "isItemSystem" BOOLEAN NOT NULL DEFAULT false,
    "isCraftingSystem" BOOLEAN NOT NULL DEFAULT false,
    "isEnvConditionSystem" BOOLEAN NOT NULL DEFAULT false,
    "isOwnershipSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RelationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffectType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isItem" BOOLEAN NOT NULL DEFAULT false,
    "isPlant" BOOLEAN NOT NULL DEFAULT false,
    "isSpecies" BOOLEAN NOT NULL DEFAULT false,
    "isAbility" BOOLEAN NOT NULL DEFAULT false,
    "isEnvModifier" BOOLEAN NOT NULL DEFAULT false,
    "isLocation" BOOLEAN NOT NULL DEFAULT false,
    "isEvent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "ConstructionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "isEntity" BOOLEAN NOT NULL DEFAULT false,
    "isStructure" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "canModifyStats" BOOLEAN NOT NULL DEFAULT false,
    "canParticipateCombat" BOOLEAN NOT NULL DEFAULT false,
    "canParticipateEvents" BOOLEAN NOT NULL DEFAULT false,
    "adminOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EntityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sex" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Sex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gender" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "defaultRoll" INTEGER,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomFlavorText" (
    "id" SERIAL NOT NULL,
    "text" VARCHAR(300) NOT NULL,

    CONSTRAINT "SymptomFlavorText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom_FlavorText" (
    "symptomId" INTEGER NOT NULL,
    "flavorTextId" INTEGER NOT NULL,

    CONSTRAINT "Symptom_FlavorText_pkey" PRIMARY KEY ("symptomId","flavorTextId")
);

-- CreateTable
CREATE TABLE "DropTable" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,

    CONSTRAINT "DropTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTable_Entry" (
    "id" SERIAL NOT NULL,
    "dropTableId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "dropChance" INTEGER NOT NULL DEFAULT 100,
    "averageQuantity" INTEGER,
    "quantityVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "averageWeight" DOUBLE PRECISION,
    "weightVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "averageVolume" DOUBLE PRECISION,
    "volumeVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.3,

    CONSTRAINT "DropTable_Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,

    CONSTRAINT "MeasurementType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "measurementTypeId" INTEGER,

    CONSTRAINT "IngredientType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "envConditionId" INTEGER,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherState" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isSevere" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeatherState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvCondition" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "EnvCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherState_EnvCondition" (
    "weatherStateId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,

    CONSTRAINT "WeatherState_EnvCondition_pkey" PRIMARY KEY ("weatherStateId","envConditionId")
);

-- CreateTable
CREATE TABLE "WeatherPattern" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isSevere" BOOLEAN NOT NULL DEFAULT false,
    "cooldownDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeatherPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherPatternStep" (
    "id" SERIAL NOT NULL,
    "patternId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "weatherStateId" INTEGER,
    "durationHours" INTEGER NOT NULL,

    CONSTRAINT "WeatherPatternStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season_WeatherPattern" (
    "seasonId" INTEGER NOT NULL,
    "patternId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Season_WeatherPattern_pkey" PRIMARY KEY ("seasonId","patternId")
);

-- CreateTable
CREATE TABLE "GuildSeason_DefaultWeather" (
    "guildId" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "weatherStateId" INTEGER NOT NULL,

    CONSTRAINT "GuildSeason_DefaultWeather_pkey" PRIMARY KEY ("guildId","seasonId")
);

-- CreateTable
CREATE TABLE "Guild_WeatherPatternCooldown" (
    "guildId" TEXT NOT NULL,
    "patternId" INTEGER NOT NULL,
    "lastRunAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Guild_WeatherPatternCooldown_pkey" PRIMARY KEY ("guildId","patternId")
);

-- CreateTable
CREATE TABLE "EnvCondition_Modifier" (
    "guildId" VARCHAR(50) NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION,

    CONSTRAINT "EnvCondition_Modifier_pkey" PRIMARY KEY ("guildId","envConditionId","effectTypeId")
);

-- CreateTable
CREATE TABLE "EnvCondition_StatModifier" (
    "guildId" VARCHAR(50) NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EnvCondition_StatModifier_pkey" PRIMARY KEY ("guildId","envConditionId","statId")
);

-- CreateTable
CREATE TABLE "EnvCondition_ProficiencyModifier" (
    "guildId" VARCHAR(50) NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "hasDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EnvCondition_ProficiencyModifier_pkey" PRIMARY KEY ("guildId","envConditionId","proficiencyDefId")
);

-- CreateTable
CREATE TABLE "Biome" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "color" INTEGER,

    CONSTRAINT "Biome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biome_EnvCondition" (
    "biomeId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "stacks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Biome_EnvCondition_pkey" PRIMARY KEY ("biomeId","envConditionId")
);

-- CreateTable
CREATE TABLE "Guild_BiomeDrop" (
    "guildId" TEXT NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "dropTableId" INTEGER NOT NULL,

    CONSTRAINT "Guild_BiomeDrop_pkey" PRIMARY KEY ("guildId","biomeId")
);

-- CreateTable
CREATE TABLE "SpeciesType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "SpeciesType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "initialStatMinimum" INTEGER NOT NULL DEFAULT 1,
    "initialStatMaximum" INTEGER NOT NULL DEFAULT 14,
    "totalStartingStats" INTEGER NOT NULL DEFAULT 60,
    "statCap" INTEGER NOT NULL DEFAULT 20,
    "childMaxAge" INTEGER NOT NULL,
    "teenMaxAge" INTEGER NOT NULL,
    "adultMaxAge" INTEGER NOT NULL,
    "childNutritionDrain" DOUBLE PRECISION NOT NULL,
    "teenNutritionDrain" DOUBLE PRECISION NOT NULL,
    "adultNutritionDrain" DOUBLE PRECISION NOT NULL,
    "elderNutritionDrain" DOUBLE PRECISION NOT NULL,
    "childHydrationDrain" DOUBLE PRECISION NOT NULL,
    "teenHydrationDrain" DOUBLE PRECISION NOT NULL,
    "adultHydrationDrain" DOUBLE PRECISION NOT NULL,
    "elderHydrationDrain" DOUBLE PRECISION NOT NULL,
    "meatNutritionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "meatHydrationMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "plantNutritionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "plantHydrationMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "childFilthPerDay" DOUBLE PRECISION NOT NULL,
    "teenFilthPerDay" DOUBLE PRECISION NOT NULL,
    "adultFilthPerDay" DOUBLE PRECISION NOT NULL,
    "elderFilthPerDay" DOUBLE PRECISION NOT NULL,
    "baseStrength" INTEGER NOT NULL DEFAULT 10,
    "baseDexterity" INTEGER NOT NULL DEFAULT 10,
    "baseConstitution" INTEGER NOT NULL DEFAULT 10,
    "baseIntelligence" INTEGER NOT NULL DEFAULT 10,
    "baseWisdom" INTEGER NOT NULL DEFAULT 10,
    "baseCharisma" INTEGER NOT NULL DEFAULT 10,
    "baseAc" INTEGER NOT NULL DEFAULT 10,
    "hpDiceCount" INTEGER NOT NULL DEFAULT 2,
    "hpDiceSides" INTEGER NOT NULL DEFAULT 10,
    "combatRating" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "combatXpReward" INTEGER NOT NULL DEFAULT 50,
    "dropTableId" INTEGER,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species_EquipmentLoadout" (
    "speciesId" INTEGER NOT NULL,
    "slotTypeId" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Species_EquipmentLoadout_pkey" PRIMARY KEY ("speciesId","slotTypeId")
);

-- CreateTable
CREATE TABLE "Species_SpeciesType" (
    "speciesId" INTEGER NOT NULL,
    "speciesTypeId" INTEGER NOT NULL,

    CONSTRAINT "Species_SpeciesType_pkey" PRIMARY KEY ("speciesId","speciesTypeId")
);

-- CreateTable
CREATE TABLE "Species_Biome" (
    "speciesId" INTEGER NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "spawnRate" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "Species_Biome_pkey" PRIMARY KEY ("speciesId","biomeId")
);

-- CreateTable
CREATE TABLE "SpeciesType_EnvConditionEffect" (
    "id" SERIAL NOT NULL,
    "speciesTypeId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectTypeId" INTEGER,
    "value" DOUBLE PRECISION,

    CONSTRAINT "SpeciesType_EnvConditionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species_EnvConditionEffect" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectTypeId" INTEGER,
    "value" DOUBLE PRECISION,

    CONSTRAINT "Species_EnvConditionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyPart" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "BodyPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT,
    "name" VARCHAR(200) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 0,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "factionRep" INTEGER NOT NULL DEFAULT 0,
    "nutritionLevel" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "hydrationLevel" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "sexId" INTEGER,
    "genderId" INTEGER,
    "factionId" INTEGER,
    "rankId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityStats" (
    "entityId" INTEGER NOT NULL,
    "skillPoints" INTEGER NOT NULL DEFAULT 0,
    "currentEnergy" INTEGER NOT NULL DEFAULT 0,
    "maxHp" INTEGER,
    "currentHp" INTEGER,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EntityStats_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "EntityBehaviorCounter" (
    "entityId" INTEGER NOT NULL,
    "counterKey" VARCHAR(50) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityBehaviorCounter_pkey" PRIMARY KEY ("entityId","counterKey")
);

-- CreateTable
CREATE TABLE "EntityImage" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "photoUrl" VARCHAR(500) NOT NULL,
    "isThumbnail" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EntityImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityBio" (
    "entityId" INTEGER NOT NULL,
    "casualName" VARCHAR(200),
    "description" VARCHAR(1000),
    "personality" VARCHAR(1000),
    "history" VARCHAR(2000),
    "embedColor" VARCHAR(7),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EntityBio_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "EntityCondition" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "bodyPartId" INTEGER,
    "sourceEntityId" INTEGER,
    "sourceActiveEventId" INTEGER,
    "linkedConditionId" INTEGER,
    "onsetAt" TIMESTAMPTZ,
    "progressionValue" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastTreatedAt" TIMESTAMPTZ,
    "discoveryLevel" INTEGER NOT NULL DEFAULT 0,
    "combatInstancedOnly" BOOLEAN NOT NULL DEFAULT false,
    "appliedInCombatId" INTEGER,
    "appliedByActionId" INTEGER,
    "combatRoundApplied" INTEGER,
    "combatRoundExpires" INTEGER,
    "resolvedFlatModifier" INTEGER,
    "expiresAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EntityCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RelationshipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRelationship" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "targetEntityId" INTEGER NOT NULL,
    "relationshipTypeId" INTEGER NOT NULL,
    "isBiological" BOOLEAN NOT NULL DEFAULT false,
    "lastMentorRequestAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionStandingType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "FactionStandingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionStanding" (
    "factionId" INTEGER NOT NULL,
    "targetFactionId" INTEGER NOT NULL,
    "standingTypeId" INTEGER NOT NULL,

    CONSTRAINT "FactionStanding_pkey" PRIMARY KEY ("factionId","targetFactionId")
);

-- CreateTable
CREATE TABLE "Faction" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "factionRep" INTEGER NOT NULL DEFAULT 0,
    "lastEventAt" TIMESTAMPTZ,
    "hasWaterAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxCount" INTEGER,
    "canMentor" BOOLEAN NOT NULL DEFAULT false,
    "canBeMentored" BOOLEAN NOT NULL DEFAULT false,
    "canLeadEvents" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank_Faction" (
    "rankId" INTEGER NOT NULL,
    "factionId" INTEGER NOT NULL,

    CONSTRAINT "Rank_Faction_pkey" PRIMARY KEY ("rankId","factionId")
);

-- CreateTable
CREATE TABLE "Rank_DefaultItem" (
    "rankId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "autoEquip" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rank_DefaultItem_pkey" PRIMARY KEY ("rankId","itemId")
);

-- CreateTable
CREATE TABLE "ProficiencyDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "statId" INTEGER NOT NULL,

    CONSTRAINT "ProficiencyDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity_Proficiency" (
    "entityId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "isProficient" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Entity_Proficiency_pkey" PRIMARY KEY ("entityId","proficiencyDefId")
);

-- CreateTable
CREATE TABLE "DisciplineDef" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "baseXp" INTEGER NOT NULL DEFAULT 100,
    "isStatProgression" BOOLEAN NOT NULL DEFAULT false,
    "dailyXpCap" INTEGER,

    CONSTRAINT "DisciplineDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild_DisciplineLevelCap" (
    "guildId" VARCHAR(50) NOT NULL,
    "disciplineDefId" INTEGER NOT NULL,
    "levelCap" INTEGER NOT NULL,

    CONSTRAINT "Guild_DisciplineLevelCap_pkey" PRIMARY KEY ("guildId","disciplineDefId")
);

-- CreateTable
CREATE TABLE "Entity_Discipline" (
    "entityId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "currentXp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Entity_Discipline_pkey" PRIMARY KEY ("entityId","disciplineId")
);

-- CreateTable
CREATE TABLE "SkillTreeNode" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "disciplineDefId" INTEGER NOT NULL,
    "abilityDefId" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "levelRequired" INTEGER NOT NULL,
    "statPointCost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkillTreeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTreeNode_DisciplineRequirement" (
    "nodeId" INTEGER NOT NULL,
    "disciplineDefId" INTEGER NOT NULL,
    "levelRequired" INTEGER NOT NULL,

    CONSTRAINT "SkillTreeNode_DisciplineRequirement_pkey" PRIMARY KEY ("nodeId","disciplineDefId")
);

-- CreateTable
CREATE TABLE "SkillTreeNode_Relation" (
    "nodeId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "targetNodeId" INTEGER NOT NULL,

    CONSTRAINT "SkillTreeNode_Relation_pkey" PRIMARY KEY ("nodeId","relationTypeId","targetNodeId")
);

-- CreateTable
CREATE TABLE "Entity_SkillTreeNode" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "nodeId" INTEGER NOT NULL,

    CONSTRAINT "Entity_SkillTreeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "maxInstances" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AbilityDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity_Ability" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "sourceType" VARCHAR(50) NOT NULL,
    "sourceId" INTEGER,

    CONSTRAINT "Entity_Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species_DefaultAbility" (
    "speciesId" INTEGER NOT NULL,
    "abilityDefId" INTEGER NOT NULL,

    CONSTRAINT "Species_DefaultAbility_pkey" PRIMARY KEY ("speciesId","abilityDefId")
);

-- CreateTable
CREATE TABLE "Ability_StatModifier" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "context" VARCHAR(100),
    "biomeId" INTEGER,
    "weatherStateId" INTEGER,
    "valueThresholdMin" DOUBLE PRECISION,
    "valueThresholdMax" DOUBLE PRECISION,

    CONSTRAINT "Ability_StatModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_ProficiencyModifier" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "hasAdvantage" BOOLEAN NOT NULL DEFAULT false,
    "hasDisadvantage" BOOLEAN NOT NULL DEFAULT false,
    "biomeId" INTEGER,
    "weatherStateId" INTEGER,
    "valueThresholdMin" DOUBLE PRECISION,
    "valueThresholdMax" DOUBLE PRECISION,

    CONSTRAINT "Ability_ProficiencyModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isAbility" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TargetType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_MultiplierEffect" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "targetTypeId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "multiplier" DOUBLE PRECISION,
    "flatRate" INTEGER,
    "valueThresholdMin" DOUBLE PRECISION,
    "valueThresholdMax" DOUBLE PRECISION,
    "biomeId" INTEGER,
    "weatherStateId" INTEGER,

    CONSTRAINT "Ability_MultiplierEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_GrantedAction" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "grantedToSource" BOOLEAN NOT NULL DEFAULT false,
    "usesPerGrant" INTEGER,

    CONSTRAINT "Ability_GrantedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_CombatBehavior" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "perspective" VARCHAR(20) NOT NULL,
    "behaviorTypeId" INTEGER NOT NULL,
    "actionTypeId" INTEGER,
    "triggerChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "redirectTargetId" INTEGER,
    "biasWeight" DOUBLE PRECISION,
    "restrictActionTypeId" INTEGER,
    "restrictIsBlock" BOOLEAN NOT NULL DEFAULT false,
    "valueThresholdMin" DOUBLE PRECISION,
    "valueThresholdMax" DOUBLE PRECISION,

    CONSTRAINT "Ability_CombatBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_ConditionResistance" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "conditionDefId" INTEGER,
    "conditionTypeId" INTEGER,
    "resistDcBonus" INTEGER,
    "isImmune" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ability_ConditionResistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_DamageModifier" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "damageTypeId" INTEGER NOT NULL,
    "modifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isImmune" BOOLEAN NOT NULL DEFAULT false,
    "valueThresholdMin" DOUBLE PRECISION,
    "valueThresholdMax" DOUBLE PRECISION,

    CONSTRAINT "Ability_DamageModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityEffectType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AbilityEffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityThresholdType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AbilityThresholdType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetScope" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isAbilityTarget" BOOLEAN NOT NULL DEFAULT false,
    "isPresenceScope" BOOLEAN NOT NULL DEFAULT false,
    "isPowerScope" BOOLEAN NOT NULL DEFAULT false,
    "isEfficiencyConsumerScope" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TargetScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerTiming" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TriggerTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackBehavior" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StackBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_ActionTrigger" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "triggerSystemType" VARCHAR(50) NOT NULL,
    "targetScopeId" INTEGER NOT NULL,
    "triggerOnId" INTEGER NOT NULL,
    "triggerChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "abilityEffectTypeId" INTEGER NOT NULL,
    "stackBehaviorId" INTEGER NOT NULL,
    "effectTypeId" INTEGER,
    "effectValue" DOUBLE PRECISION,
    "durationHours" INTEGER,
    "conditionDefId" INTEGER,
    "energyAmount" DOUBLE PRECISION,
    "disciplineDefId" INTEGER,
    "xpAmount" INTEGER,

    CONSTRAINT "Ability_ActionTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_ThresholdTrigger" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "thresholdTypeId" INTEGER NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "thresholdBelow" BOOLEAN NOT NULL DEFAULT true,
    "thresholdAbove" BOOLEAN NOT NULL DEFAULT false,
    "conditionDefId" INTEGER NOT NULL,
    "stackBehaviorId" INTEGER NOT NULL,

    CONSTRAINT "Ability_ThresholdTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability_PresenceEffect" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "presenceScopeId" INTEGER NOT NULL,
    "triggerChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "abilityEffectTypeId" INTEGER NOT NULL,
    "stackBehaviorId" INTEGER NOT NULL,
    "conditionDefId" INTEGER,
    "multiplierTargetTypeId" INTEGER,
    "multiplierValue" DOUBLE PRECISION,
    "targetId" INTEGER,
    "effectTypeId" INTEGER,
    "effectValue" DOUBLE PRECISION,
    "durationHours" INTEGER,

    CONSTRAINT "Ability_PresenceEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionContext" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "ConditionContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "tracksDays" BOOLEAN NOT NULL DEFAULT false,
    "tracksProgression" BOOLEAN NOT NULL DEFAULT false,
    "canSelfResolve" BOOLEAN NOT NULL DEFAULT false,
    "canSpawn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConditionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "conditionTypeId" INTEGER NOT NULL,
    "conditionContextId" INTEGER NOT NULL,
    "isSecondWindConsequence" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isFatalAtCap" BOOLEAN NOT NULL DEFAULT false,
    "progressionCap" DOUBLE PRECISION,
    "dailyRollDC" INTEGER,
    "maxDays" INTEGER,
    "durationMinutes" INTEGER,
    "spawnThreshold" DOUBLE PRECISION,
    "contagionResistDC" INTEGER,
    "energyDebuf" DOUBLE PRECISION,
    "blocksVerbal" BOOLEAN NOT NULL DEFAULT false,
    "blocksSomatic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConditionDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef_DamageModifier" (
    "conditionDefId" INTEGER NOT NULL,
    "damageTypeId" INTEGER NOT NULL,
    "isResistant" BOOLEAN NOT NULL,

    CONSTRAINT "ConditionDef_DamageModifier_pkey" PRIMARY KEY ("conditionDefId","damageTypeId")
);

-- CreateTable
CREATE TABLE "ConditionDef_EnvRule" (
    "conditionDefId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConditionDef_EnvRule_pkey" PRIMARY KEY ("conditionDefId","envConditionId")
);

-- CreateTable
CREATE TABLE "ConditionDef_StatEffect" (
    "conditionDefId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "ConditionDef_StatEffect_pkey" PRIMARY KEY ("conditionDefId","statId")
);

-- CreateTable
CREATE TABLE "ConditionDef_ProficiencyEffect" (
    "conditionDefId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER NOT NULL,
    "amount" INTEGER,
    "hasDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConditionDef_ProficiencyEffect_pkey" PRIMARY KEY ("conditionDefId","proficiencyDefId")
);

-- CreateTable
CREATE TABLE "ConditionDef_CombatEffect" (
    "id" SERIAL NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "statId" INTEGER,
    "flatModifier" INTEGER,

    CONSTRAINT "ConditionDef_CombatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef_Link" (
    "id" SERIAL NOT NULL,
    "parentConditionId" INTEGER NOT NULL,
    "childConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ConditionDef_Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef_SymptomTag" (
    "conditionDefId" INTEGER NOT NULL,
    "symptomId" INTEGER NOT NULL,

    CONSTRAINT "ConditionDef_SymptomTag_pkey" PRIMARY KEY ("conditionDefId","symptomId")
);

-- CreateTable
CREATE TABLE "ConditionDef_GrantedItem" (
    "conditionDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "grantedToSource" BOOLEAN NOT NULL DEFAULT false,
    "usesPerApplication" INTEGER,
    "minProgression" DOUBLE PRECISION,
    "maxProgression" DOUBLE PRECISION,

    CONSTRAINT "ConditionDef_GrantedItem_pkey" PRIMARY KEY ("conditionDefId","itemId")
);

-- CreateTable
CREATE TABLE "ConditionBehaviorType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ConditionBehaviorType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorRedirectTarget" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BehaviorRedirectTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionBehaviorEffect" (
    "id" SERIAL NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "actionTypeId" INTEGER,
    "perspective" TEXT NOT NULL,
    "behaviorTypeId" INTEGER NOT NULL,
    "triggerChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "redirectTargetId" INTEGER,
    "biasWeight" DOUBLE PRECISION,
    "restrictActionTypeId" INTEGER,
    "restrictIsBlock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConditionBehaviorEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemInteraction" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,

    CONSTRAINT "ItemInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemWarning" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "conditionDefId" INTEGER,
    "triggeredByInteractionId" INTEGER,

    CONSTRAINT "ItemWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item_Warning" (
    "itemId" INTEGER NOT NULL,
    "warningId" INTEGER NOT NULL,
    "durationDays" INTEGER,

    CONSTRAINT "Item_Warning_pkey" PRIMARY KEY ("itemId","warningId")
);

-- CreateTable
CREATE TABLE "EquipmentSlotType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "defaultCapacity" INTEGER NOT NULL DEFAULT 1,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EquipmentSlotType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEquipmentProfile" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "slotTypeId" INTEGER NOT NULL,
    "slotCost" INTEGER NOT NULL DEFAULT 1,
    "label" VARCHAR(100),
    "acModifier" INTEGER NOT NULL DEFAULT 0,
    "damageDiceCount" INTEGER,
    "damageDiceSides" INTEGER,
    "damageTypeId" INTEGER,
    "elementalDiceCount" INTEGER,
    "elementalDiceSides" INTEGER,
    "elementalDamageTypeId" INTEGER,
    "healDiceCount" INTEGER,
    "healDiceSides" INTEGER,
    "isMagical" BOOLEAN NOT NULL DEFAULT false,
    "actionCategoryId" INTEGER,
    "actionTypeId" INTEGER,
    "targetScopeId" INTEGER,
    "cooldownRounds" INTEGER NOT NULL DEFAULT 0,
    "durationRounds" INTEGER NOT NULL DEFAULT 0,
    "behaviorEffectTypeId" INTEGER,
    "requiresVerbal" BOOLEAN NOT NULL DEFAULT false,
    "requiresSomatic" BOOLEAN NOT NULL DEFAULT false,
    "allowedInSpar" BOOLEAN NOT NULL DEFAULT true,
    "usageContext" VARCHAR(30) NOT NULL DEFAULT 'any',
    "hitStatId" INTEGER,
    "damageStatId" INTEGER,
    "healStatId" INTEGER,
    "hitBonus" INTEGER NOT NULL DEFAULT 0,
    "damageBonus" INTEGER NOT NULL DEFAULT 0,
    "healBonus" INTEGER NOT NULL DEFAULT 0,
    "triggersEventDefId" INTEGER,
    "triggerDC" INTEGER NOT NULL DEFAULT 1,
    "outOfCombatMaxTargets" INTEGER,
    "summonSpeciesId" INTEGER,
    "summonDiceCount" INTEGER,
    "summonDiceSides" INTEGER,

    CONSTRAINT "ItemEquipmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEquipmentProfile_Condition" (
    "id" SERIAL NOT NULL,
    "equipmentProfileId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "onEquip" BOOLEAN NOT NULL DEFAULT false,
    "appliesTo" TEXT NOT NULL DEFAULT 'target',
    "removes" BOOLEAN NOT NULL DEFAULT false,
    "applicationDC" INTEGER NOT NULL DEFAULT 1,
    "combatInstancedOnly" BOOLEAN NOT NULL DEFAULT false,
    "roundDuration" INTEGER,
    "sourceProficiencyId" INTEGER,
    "maxBonusBase" INTEGER,
    "maxBonusProficient" INTEGER,
    "linkedProfileConditionId" INTEGER,

    CONSTRAINT "ItemEquipmentProfile_Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEquipmentProfile_RequiredItem" (
    "equipmentProfileId" INTEGER NOT NULL,
    "requiredItemId" INTEGER NOT NULL,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ItemEquipmentProfile_RequiredItem_pkey" PRIMARY KEY ("equipmentProfileId","requiredItemId")
);

-- CreateTable
CREATE TABLE "ItemActionType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "dealsDamage" BOOLEAN NOT NULL DEFAULT false,
    "restoresHealth" BOOLEAN NOT NULL DEFAULT false,
    "appliesCondition" BOOLEAN NOT NULL DEFAULT false,
    "isHarmful" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemActionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatTargetScope" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "targetsSelf" BOOLEAN NOT NULL DEFAULT false,
    "targetsSingle" BOOLEAN NOT NULL DEFAULT false,
    "targetsAllies" BOOLEAN NOT NULL DEFAULT false,
    "targetsEnemies" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatTargetScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAction" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemInteractionId" INTEGER NOT NULL,
    "energyCost" INTEGER NOT NULL DEFAULT 0,
    "consumedOnUse" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ItemAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAction_Output" (
    "id" SERIAL NOT NULL,
    "itemActionId" INTEGER NOT NULL,
    "outputItemId" INTEGER NOT NULL,
    "avgQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "quantityVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dropDC" INTEGER NOT NULL DEFAULT 1,
    "craftBonusApplies" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemAction_Output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEffect" (
    "id" SERIAL NOT NULL,
    "itemActionId" INTEGER NOT NULL,
    "symptomId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectiveness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ItemEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemConditionEffect" (
    "id" SERIAL NOT NULL,
    "itemActionId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectiveness" DOUBLE PRECISION,
    "outputConditionDefId" INTEGER,

    CONSTRAINT "ItemConditionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFoodProfile" (
    "itemId" INTEGER NOT NULL,
    "meatNutritionPerGram" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "meatHydrationPerGram" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "plantNutritionPerGram" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "plantHydrationPerGram" DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "measurementTypeId" INTEGER,
    "averageWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weightVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rotCap" INTEGER,
    "maxDurability" INTEGER,
    "maxUses" INTEGER,
    "maxDailyUses" INTEGER,
    "fuelValue" INTEGER,
    "fuelTypeId" INTEGER,
    "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
    "plantDefId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item_Type" (
    "itemId" INTEGER NOT NULL,
    "itemTypeId" INTEGER NOT NULL,

    CONSTRAINT "Item_Type_pkey" PRIMARY KEY ("itemId","itemTypeId")
);

-- CreateTable
CREATE TABLE "Item_CompostOutput" (
    "id" SERIAL NOT NULL,
    "structureDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "outputItemId" INTEGER NOT NULL,
    "measurementTypeId" INTEGER NOT NULL,
    "amountPerUnit" DOUBLE PRECISION NOT NULL,
    "outputQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dropChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Item_CompostOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftingInteraction" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,

    CONSTRAINT "CraftingInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild_CraftingInteractionConfig" (
    "guildId" VARCHAR(50) NOT NULL,
    "craftingInteractionId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Guild_CraftingInteractionConfig_pkey" PRIMARY KEY ("guildId","craftingInteractionId")
);

-- CreateTable
CREATE TABLE "RecipeOutputMode" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "RecipeOutputMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "craftingInteractionId" INTEGER NOT NULL,
    "requiresDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "craftingTimeMins" INTEGER,
    "maxBatchSize" INTEGER,
    "minCraftingLevel" INTEGER,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity_DiscoveredRecipe" (
    "entityId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "discoveredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entity_DiscoveredRecipe_pkey" PRIMARY KEY ("entityId","recipeId")
);

-- CreateTable
CREATE TABLE "Guild_CraftingInteractionRule" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "craftingInteractionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "orGroup" INTEGER,
    "structureDefId" INTEGER,
    "upgradeId" INTEGER,
    "disciplineDefId" INTEGER,
    "minLevel" INTEGER,
    "skillTreeNodeId" INTEGER,

    CONSTRAINT "Guild_CraftingInteractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe_DisciplineReward" (
    "recipeId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "xpAmount" INTEGER NOT NULL,

    CONSTRAINT "Recipe_DisciplineReward_pkey" PRIMARY KEY ("recipeId","disciplineId")
);

-- CreateTable
CREATE TABLE "Recipe_CraftingRequirement" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "orGroup" INTEGER,
    "structureDefId" INTEGER,
    "upgradeId" INTEGER,
    "disciplineDefId" INTEGER,
    "minLevel" INTEGER,
    "skillTreeNodeId" INTEGER,

    CONSTRAINT "Recipe_CraftingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSlot" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "label" VARCHAR(100),
    "quantity" DOUBLE PRECISION NOT NULL,
    "measurementTypeId" INTEGER NOT NULL,
    "consumedOnUse" BOOLEAN NOT NULL DEFAULT true,
    "scalesWithBatch" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecipeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSlotOption" (
    "id" SERIAL NOT NULL,
    "slotId" INTEGER NOT NULL,
    "itemId" INTEGER,

    CONSTRAINT "RecipeSlotOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSlotOption_RequiredTag" (
    "slotOptionId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "RecipeSlotOption_RequiredTag_pkey" PRIMARY KEY ("slotOptionId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "RecipeSlotOption_ExcludedTag" (
    "slotOptionId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "RecipeSlotOption_ExcludedTag_pkey" PRIMARY KEY ("slotOptionId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "RecipeOutput" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "outputItemId" INTEGER,
    "outputModeId" INTEGER NOT NULL,
    "avgQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "quantityVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "inputProportion" DOUBLE PRECISION,
    "dropDC" INTEGER NOT NULL DEFAULT 1,
    "onFailure" BOOLEAN NOT NULL DEFAULT false,
    "craftBonusApplies" BOOLEAN NOT NULL DEFAULT false,
    "preName" VARCHAR(100),
    "postName" VARCHAR(100),
    "rotCapMultiplier" DOUBLE PRECISION,
    "rotVariance" DOUBLE PRECISION,
    "effectivenessMultiplier" DOUBLE PRECISION,
    "outputMeasurementTypeId" INTEGER,

    CONSTRAINT "RecipeOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeOutput_AddTag" (
    "recipeOutputId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "RecipeOutput_AddTag_pkey" PRIMARY KEY ("recipeOutputId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "RecipeOutput_RemoveTag" (
    "recipeOutputId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "RecipeOutput_RemoveTag_pkey" PRIMARY KEY ("recipeOutputId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "RecipeOutput_FoodOverride" (
    "recipeOutputId" INTEGER NOT NULL,
    "meatNutritionPerGram" DOUBLE PRECISION,
    "meatHydrationPerGram" DOUBLE PRECISION,
    "plantNutritionPerGram" DOUBLE PRECISION,
    "plantHydrationPerGram" DOUBLE PRECISION
);

-- CreateTable
CREATE TABLE "Item_IngredientType" (
    "guildId" VARCHAR(50) NOT NULL,
    "itemId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "Item_IngredientType_pkey" PRIMARY KEY ("guildId","itemId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity_Storage" (
    "entityId" INTEGER NOT NULL,
    "storageId" INTEGER NOT NULL,
    "weightCapacity" DOUBLE PRECISION,
    "fluidCapacity" DOUBLE PRECISION,

    CONSTRAINT "Entity_Storage_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "Entity_Housing" (
    "entityId" INTEGER NOT NULL,
    "structureId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entity_Housing_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "Entity_WorkAssignment" (
    "entityId" INTEGER NOT NULL,
    "structureId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedUntil" TIMESTAMPTZ,

    CONSTRAINT "Entity_WorkAssignment_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "Structure_Storage" (
    "structureId" INTEGER NOT NULL,
    "storageId" INTEGER NOT NULL,
    "solidCapacity" DOUBLE PRECISION,
    "liquidCapacity" DOUBLE PRECISION,
    "rotModifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isPrimaryStorage" BOOLEAN NOT NULL DEFAULT false,
    "securityRating" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Structure_Storage_pkey" PRIMARY KEY ("structureId")
);

-- CreateTable
CREATE TABLE "Structure_Storage_ItemType" (
    "storageId" INTEGER NOT NULL,
    "itemTypeId" INTEGER NOT NULL,

    CONSTRAINT "Structure_Storage_ItemType_pkey" PRIMARY KEY ("storageId","itemTypeId")
);

-- CreateTable
CREATE TABLE "StoredItem" (
    "id" SERIAL NOT NULL,
    "storageId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rotProgression" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "craftBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentDurability" INTEGER,
    "usesRemaining" INTEGER,
    "dailyUsesRemaining" INTEGER,
    "currentFuelLevel" DOUBLE PRECISION,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "chosenProfileId" INTEGER,
    "equippedAt" TIMESTAMPTZ,

    CONSTRAINT "StoredItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "StructureType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradeEffectType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "isStorage" BOOLEAN NOT NULL DEFAULT false,
    "isFarming" BOOLEAN NOT NULL DEFAULT false,
    "isHousing" BOOLEAN NOT NULL DEFAULT false,
    "isMedical" BOOLEAN NOT NULL DEFAULT false,
    "isCrafting" BOOLEAN NOT NULL DEFAULT false,
    "isCompost" BOOLEAN NOT NULL DEFAULT false,
    "isPower" BOOLEAN NOT NULL DEFAULT false,
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "isWorkSlot" BOOLEAN NOT NULL DEFAULT false,
    "requiresEnvTarget" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UpgradeEffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "FuelType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "constructionPoints" INTEGER NOT NULL,
    "baseDurability" INTEGER NOT NULL,
    "dailyFilthAverage" INTEGER,
    "isPowered" BOOLEAN NOT NULL DEFAULT false,
    "fuelCostPerHour" DOUBLE PRECISION,

    CONSTRAINT "StructureDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureDef_StructureType" (
    "structureDefId" INTEGER NOT NULL,
    "structureTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_StructureType_pkey" PRIMARY KEY ("structureDefId","structureTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_CampRequirement" (
    "structureDefId" INTEGER NOT NULL,
    "requiredStructureTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_CampRequirement_pkey" PRIMARY KEY ("structureDefId","requiredStructureTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_Relation" (
    "structureDefId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "targetStructureDefId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_Relation_pkey" PRIMARY KEY ("structureDefId","relationTypeId","targetStructureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_BuildCost" (
    "structureDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_BuildCost_pkey" PRIMARY KEY ("structureDefId","itemId")
);

-- CreateTable
CREATE TABLE "StructureDef_StorageConfig" (
    "structureDefId" INTEGER NOT NULL,
    "baseCapacitySolids" INTEGER NOT NULL,
    "baseCapacityLiquids" INTEGER NOT NULL,
    "baseRotModifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "StructureDef_StorageConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_HousingConfig" (
    "structureDefId" INTEGER NOT NULL,
    "comfortableCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER,
    "overcrowdingFilthBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "StructureDef_HousingConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_MedicalConfig" (
    "structureDefId" INTEGER NOT NULL,
    "treatmentRollBonus" INTEGER NOT NULL DEFAULT 0,
    "examRollBonus" INTEGER NOT NULL DEFAULT 0,
    "recoveryModifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "contagionResistBonus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StructureDef_MedicalConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_FarmingConfig" (
    "structureDefId" INTEGER NOT NULL,
    "plotTypeId" INTEGER NOT NULL,
    "basePlotCount" INTEGER NOT NULL,
    "defaultSoilQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "filthPerActivePlot" INTEGER,

    CONSTRAINT "StructureDef_FarmingConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_CraftingConfig" (
    "structureDefId" INTEGER NOT NULL,
    "craftingRollBonus" INTEGER NOT NULL DEFAULT 0,
    "outputQuantityBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "StructureDef_CraftingConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_CraftingConfig_Interaction" (
    "structureDefId" INTEGER NOT NULL,
    "craftingInteractionId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_CraftingConfig_Interaction_pkey" PRIMARY KEY ("structureDefId","craftingInteractionId")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade_CraftingInteraction" (
    "upgradeId" INTEGER NOT NULL,
    "craftingInteractionId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_Upgrade_CraftingInteraction_pkey" PRIMARY KEY ("upgradeId","craftingInteractionId")
);

-- CreateTable
CREATE TABLE "StructureDef_CompostConfig" (
    "structureDefId" INTEGER NOT NULL,
    "conversionDays" INTEGER NOT NULL,
    "weightCapacity" DOUBLE PRECISION,
    "volumeCapacity" DOUBLE PRECISION,

    CONSTRAINT "StructureDef_CompostConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_ProductionConfig" (
    "structureDefId" INTEGER NOT NULL,
    "baseCyclesPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffCyclesPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "poweredCyclesBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filthPerCycle" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StructureDef_ProductionConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_ProductionConfig_EnvCondition" (
    "structureDefId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "cycleRatePerStack" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StructureDef_ProductionConfig_EnvCondition_pkey" PRIMARY KEY ("structureDefId","envConditionId")
);

-- CreateTable
CREATE TABLE "StructureDef_WorkSlotConfig" (
    "structureDefId" INTEGER NOT NULL,
    "totalSlots" INTEGER NOT NULL,
    "requiredSlots" INTEGER NOT NULL DEFAULT 0,
    "energyCostPerHour" INTEGER NOT NULL DEFAULT 0,
    "disciplineDefId" INTEGER,
    "xpGrantPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StructureDef_WorkSlotConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_WorkSlotConfig_Requirement" (
    "structureDefId" INTEGER NOT NULL,
    "disciplineDefId" INTEGER NOT NULL,
    "minimumLevel" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_WorkSlotConfig_Requirement_pkey" PRIMARY KEY ("structureDefId","disciplineDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_ProductionInput" (
    "structureDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "amountPerCycle" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StructureDef_ProductionInput_pkey" PRIMARY KEY ("structureDefId","itemId")
);

-- CreateTable
CREATE TABLE "StructureDef_ProductionOutput" (
    "structureDefId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "amountPerCycle" DOUBLE PRECISION NOT NULL,
    "dropChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "StructureDef_ProductionOutput_pkey" PRIMARY KEY ("structureDefId","itemId")
);

-- CreateTable
CREATE TABLE "Structure_ProductionState" (
    "structureId" INTEGER NOT NULL,
    "accumulatedCycles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastProductionAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Structure_ProductionState_pkey" PRIMARY KEY ("structureId")
);

-- CreateTable
CREATE TABLE "StructureDef_FuelConfig" (
    "structureDefId" INTEGER NOT NULL,
    "isPassive" BOOLEAN NOT NULL DEFAULT false,
    "scopeId" INTEGER NOT NULL,
    "fuelCapacity" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "baseGenerationPerHour" DOUBLE PRECISION,
    "allowsBatteryUse" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StructureDef_FuelConfig_pkey" PRIMARY KEY ("structureDefId")
);

-- CreateTable
CREATE TABLE "StructureDef_FuelConfig_InputFuelType" (
    "structureDefId" INTEGER NOT NULL,
    "fuelTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_FuelConfig_InputFuelType_pkey" PRIMARY KEY ("structureDefId","fuelTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_FuelConfig_OutputFuelType" (
    "structureDefId" INTEGER NOT NULL,
    "fuelTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_FuelConfig_OutputFuelType_pkey" PRIMARY KEY ("structureDefId","fuelTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_FuelConfig_EnvCondition" (
    "structureDefId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "generationRatePerStack" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "StructureDef_FuelConfig_EnvCondition_pkey" PRIMARY KEY ("structureDefId","envConditionId")
);

-- CreateTable
CREATE TABLE "StructureDef_AcceptedFuelType" (
    "structureDefId" INTEGER NOT NULL,
    "fuelTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_AcceptedFuelType_pkey" PRIMARY KEY ("structureDefId","fuelTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade_AcceptedFuelType" (
    "upgradeId" INTEGER NOT NULL,
    "fuelTypeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_Upgrade_AcceptedFuelType_pkey" PRIMARY KEY ("upgradeId","fuelTypeId")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade" (
    "id" SERIAL NOT NULL,
    "structureDefId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "maxApplications" INTEGER NOT NULL,
    "constructionPoints" INTEGER NOT NULL,
    "isPowered" BOOLEAN NOT NULL DEFAULT false,
    "fuelCostPerHour" DOUBLE PRECISION,

    CONSTRAINT "StructureDef_Upgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade_Effect" (
    "id" SERIAL NOT NULL,
    "upgradeId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "effectValue" DOUBLE PRECISION NOT NULL,
    "targetEnvConditionId" INTEGER,
    "efficiencyConsumerScopeId" INTEGER,

    CONSTRAINT "StructureDef_Upgrade_Effect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade_Relation" (
    "upgradeId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "targetUpgradeId" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_Upgrade_Relation_pkey" PRIMARY KEY ("upgradeId","relationTypeId","targetUpgradeId")
);

-- CreateTable
CREATE TABLE "StructureDef_Upgrade_BuildCost" (
    "upgradeId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StructureDef_Upgrade_BuildCost_pkey" PRIMARY KEY ("upgradeId","itemId")
);

-- CreateTable
CREATE TABLE "Structure" (
    "id" SERIAL NOT NULL,
    "campId" INTEGER NOT NULL,
    "structureDefId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "currentDurability" INTEGER NOT NULL,
    "filthLevel" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(200),
    "currentFuel" DOUBLE PRECISION,
    "isFuelActive" BOOLEAN NOT NULL DEFAULT false,
    "isPoweredOn" BOOLEAN NOT NULL DEFAULT false,
    "powerSortOrder" INTEGER,
    "powerPriority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Structure_AppliedUpgrade" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "upgradeId" INTEGER NOT NULL,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPoweredOn" BOOLEAN NOT NULL DEFAULT false,
    "powerPriority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Structure_AppliedUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Construction" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "constructionTypeId" INTEGER NOT NULL,
    "upgradeId" INTEGER,
    "repairCostProportion" DOUBLE PRECISION,
    "pointsRequired" INTEGER NOT NULL,
    "pointsRemaining" INTEGER NOT NULL,
    "initiatedByEntityId" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "Construction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Construction_ItemRequirement" (
    "constructionId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantityRequired" INTEGER NOT NULL,
    "quantityContributed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Construction_ItemRequirement_pkey" PRIMARY KEY ("constructionId","itemId")
);

-- CreateTable
CREATE TABLE "Structure_CompostDeposit" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "measurementTypeId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "depositedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertsAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Structure_CompostDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "preyChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "preyWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "herbChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "herbWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "predatorChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "hazardChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location_Faction" (
    "locationId" INTEGER NOT NULL,
    "factionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,

    CONSTRAINT "Location_Faction_pkey" PRIMARY KEY ("locationId","factionId")
);

-- CreateTable
CREATE TABLE "LocationBorder" (
    "locationId" INTEGER NOT NULL,
    "borderingFactionId" INTEGER NOT NULL,

    CONSTRAINT "LocationBorder_pkey" PRIMARY KEY ("locationId","borderingFactionId")
);

-- CreateTable
CREATE TABLE "Location_Biome" (
    "locationId" INTEGER NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Location_Biome_pkey" PRIMARY KEY ("locationId","biomeId")
);

-- CreateTable
CREATE TABLE "Location_EnvCondition" (
    "locationId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "stacks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Location_EnvCondition_pkey" PRIMARY KEY ("locationId","envConditionId")
);

-- CreateTable
CREATE TABLE "Camp" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "locationId" INTEGER NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Camp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camp_Faction" (
    "campId" INTEGER NOT NULL,
    "factionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,

    CONSTRAINT "Camp_Faction_pkey" PRIMARY KEY ("campId","factionId")
);

-- CreateTable
CREATE TABLE "Camp_StructureLimit" (
    "campId" INTEGER NOT NULL,
    "structureTypeId" INTEGER NOT NULL,
    "maxCount" INTEGER NOT NULL,

    CONSTRAINT "Camp_StructureLimit_pkey" PRIMARY KEY ("campId","structureTypeId")
);

-- CreateTable
CREATE TABLE "ActionSystemType" (
    "id" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "cooldownHours" INTEGER,
    "progressPoints" INTEGER,
    "entityDailyLimit" INTEGER,

    CONSTRAINT "ActionSystemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action_EntityDailyRecord" (
    "entityId" INTEGER NOT NULL,
    "systemType" VARCHAR(50) NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Action_EntityDailyRecord_pkey" PRIMARY KEY ("entityId","systemType","date")
);

-- CreateTable
CREATE TABLE "ActionType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "requiresCanMentor" BOOLEAN NOT NULL DEFAULT false,
    "allowApprenticesWithAdult" BOOLEAN NOT NULL DEFAULT false,
    "requiresCanLeadEvents" BOOLEAN NOT NULL DEFAULT false,
    "minAge" INTEGER,
    "systemTypeId" VARCHAR(50),

    CONSTRAINT "ActionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild_ActionConfig" (
    "guildId" VARCHAR(50) NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "energyCost" INTEGER NOT NULL DEFAULT 10,
    "dailyLimit" INTEGER,
    "minEntities" INTEGER NOT NULL DEFAULT 1,
    "maxEntities" INTEGER,
    "durationMinutes" INTEGER,
    "baseFactionReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Guild_ActionConfig_pkey" PRIMARY KEY ("guildId","actionTypeId")
);

-- CreateTable
CREATE TABLE "ActionType_DisciplineReward" (
    "guildId" VARCHAR(50) NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "recipientScope" VARCHAR(30) NOT NULL DEFAULT 'all',

    CONSTRAINT "ActionType_DisciplineReward_pkey" PRIMARY KEY ("guildId","actionTypeId","disciplineId","recipientScope")
);

-- CreateTable
CREATE TABLE "ActionType_DefaultItem" (
    "actionTypeId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "autoEquip" BOOLEAN NOT NULL DEFAULT true,
    "leaderOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ActionType_DefaultItem_pkey" PRIMARY KEY ("actionTypeId","itemId")
);

-- CreateTable
CREATE TABLE "ActionType_DisciplineRequirement" (
    "guildId" VARCHAR(50) NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "minLevel" INTEGER NOT NULL,
    "scope" VARCHAR(10) NOT NULL DEFAULT 'all',

    CONSTRAINT "ActionType_DisciplineRequirement_pkey" PRIMARY KEY ("guildId","actionTypeId","disciplineId")
);

-- CreateTable
CREATE TABLE "ActionType_Step" (
    "id" SERIAL NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "defaultStatId" INTEGER,

    CONSTRAINT "ActionType_Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild_ActionStep_Config" (
    "guildId" VARCHAR(50) NOT NULL,
    "stepId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER,
    "statId" INTEGER,

    CONSTRAINT "Guild_ActionStep_Config_pkey" PRIMARY KEY ("guildId","stepId")
);

-- CreateTable
CREATE TABLE "Species_ActionStep" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "defaultStatId" INTEGER,

    CONSTRAINT "Species_ActionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild_Species_ActionStep_Config" (
    "guildId" VARCHAR(50) NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "speciesActionStepId" INTEGER NOT NULL,
    "proficiencyDefId" INTEGER,
    "statId" INTEGER,

    CONSTRAINT "Guild_Species_ActionStep_Config_pkey" PRIMARY KEY ("guildId","speciesId","speciesActionStepId")
);

-- CreateTable
CREATE TABLE "Entity_ActionUsage" (
    "entityId" INTEGER NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Entity_ActionUsage_pkey" PRIMARY KEY ("entityId","actionTypeId","date")
);

-- CreateTable
CREATE TABLE "ActionInstance" (
    "id" SERIAL NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "factionId" INTEGER NOT NULL,
    "locationId" INTEGER,
    "leaderEntityId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "ActionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionInstance_Entity" (
    "actionInstanceId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "energySpent" INTEGER NOT NULL DEFAULT 0,
    "factionRepEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ActionInstance_Entity_pkey" PRIMARY KEY ("actionInstanceId","entityId")
);

-- CreateTable
CREATE TABLE "ActionInstance_Entity_DisciplineXp" (
    "actionInstanceId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL,

    CONSTRAINT "ActionInstance_Entity_DisciplineXp_pkey" PRIMARY KEY ("actionInstanceId","entityId","disciplineId")
);

-- CreateTable
CREATE TABLE "EventTriggerType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventTriggerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDef_TriggerType" (
    "eventDefId" INTEGER NOT NULL,
    "triggerTypeId" INTEGER NOT NULL,

    CONSTRAINT "EventDef_TriggerType_pkey" PRIMARY KEY ("eventDefId","triggerTypeId")
);

-- CreateTable
CREATE TABLE "EventScope" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStepType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventStepType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCheckType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventCheckType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventThresholdType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventThresholdType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipantScope" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,
    "appliesToRandom" BOOLEAN NOT NULL DEFAULT false,
    "appliesToLeader" BOOLEAN NOT NULL DEFAULT false,
    "appliesToGroup" BOOLEAN NOT NULL DEFAULT false,
    "appliesToHoused" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventParticipantScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "scopeId" INTEGER NOT NULL,
    "baseWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "unresolvedWeightBoost" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "requiresLeader" BOOLEAN NOT NULL DEFAULT false,
    "requiresCanMentor" BOOLEAN NOT NULL DEFAULT false,
    "allowApprenticesWithAdult" BOOLEAN NOT NULL DEFAULT false,
    "minAge" INTEGER,
    "requiresSignup" BOOLEAN NOT NULL DEFAULT false,
    "minParticipants" INTEGER,
    "maxParticipants" INTEGER,
    "signupWindowHours" INTEGER NOT NULL DEFAULT 18,
    "cooldownDays" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "EventDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDef_WeatherTrigger" (
    "eventDefId" INTEGER NOT NULL,
    "weatherStateId" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "weightMod" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "triggersOnOnset" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventDef_WeatherTrigger_pkey" PRIMARY KEY ("eventDefId","weatherStateId")
);

-- CreateTable
CREATE TABLE "EventDef_ActionType" (
    "eventDefId" INTEGER NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "weightMod" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "EventDef_ActionType_pkey" PRIMARY KEY ("eventDefId","actionTypeId")
);

-- CreateTable
CREATE TABLE "EventDef_ThresholdTrigger" (
    "eventDefId" INTEGER NOT NULL,
    "thresholdTypeId" INTEGER NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "triggerDays" INTEGER,
    "triggerOnHigh" BOOLEAN NOT NULL DEFAULT true,
    "resolutionThreshold" DOUBLE PRECISION,
    "resolutionDays" INTEGER,
    "resolutionOnLow" BOOLEAN,
    "conditionsLingerOnResolution" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventDef_ThresholdTrigger_pkey" PRIMARY KEY ("eventDefId")
);

-- CreateTable
CREATE TABLE "EventDef_Prerequisite" (
    "eventDefId" INTEGER NOT NULL,
    "requiredEventDefId" INTEGER NOT NULL,
    "withinDays" INTEGER,

    CONSTRAINT "EventDef_Prerequisite_pkey" PRIMARY KEY ("eventDefId","requiredEventDefId")
);

-- CreateTable
CREATE TABLE "EnvCondition_EventDef" (
    "envConditionId" INTEGER NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "weightMod" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EnvCondition_EventDef_pkey" PRIMARY KEY ("envConditionId","eventDefId")
);

-- CreateTable
CREATE TABLE "EventStepDef" (
    "id" SERIAL NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "stepTypeId" INTEGER NOT NULL,
    "prompt" VARCHAR(2000) NOT NULL,
    "nextStepId" INTEGER,
    "effectScopeId" INTEGER,
    "marksUnresolved" BOOLEAN NOT NULL DEFAULT false,
    "endsAction" BOOLEAN NOT NULL DEFAULT false,
    "expiresAfterMinutes" INTEGER,
    "choiceScopeId" INTEGER,
    "checkTypeId" INTEGER,
    "checkParticipantScopeId" INTEGER,
    "passStepId" INTEGER,
    "failStepId" INTEGER,
    "checkProficiencyDefId" INTEGER,
    "checkDifficulty" INTEGER NOT NULL DEFAULT 10,
    "conditionCheckDefId" INTEGER,
    "itemCheckItemId" INTEGER,
    "itemCheckItemTypeId" INTEGER,
    "itemCheckMinQuantity" DOUBLE PRECISION,
    "thresholdCheckTypeId" INTEGER,
    "thresholdCheckValue" DOUBLE PRECISION,
    "thresholdCheckOnHigh" BOOLEAN,
    "combatEncounterDefId" INTEGER,
    "winStepId" INTEGER,
    "loseStepId" INTEGER,

    CONSTRAINT "EventStepDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStepChoice" (
    "id" SERIAL NOT NULL,
    "stepDefId" INTEGER NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "nextStepId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventStepChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStepRandomBranch" (
    "id" SERIAL NOT NULL,
    "stepDefId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "nextStepId" INTEGER NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "EventStepRandomBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEffect" (
    "id" SERIAL NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "stepDefId" INTEGER NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "targetScopeId" INTEGER,
    "conditionDefId" INTEGER,
    "remove" BOOLEAN NOT NULL DEFAULT false,
    "itemId" INTEGER,
    "itemTypeId" INTEGER,
    "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isGain" BOOLEAN NOT NULL DEFAULT true,
    "locationBuffEffectTypeId" INTEGER,
    "locationBuffValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "locationBuffDurationHours" INTEGER,
    "statModifierStatId" INTEGER,
    "statModifierValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "proficiencyModifierProficiencyDefId" INTEGER,
    "proficiencyModifierValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "proficiencyModifierHasAdvantage" BOOLEAN NOT NULL DEFAULT false,
    "proficiencyModifierHasDisadvantage" BOOLEAN NOT NULL DEFAULT false,
    "factionRepValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "disciplineXpDisciplineDefId" INTEGER,
    "disciplineXpValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "structureDamageValue" DOUBLE PRECISION,
    "structureDamageIsMultiplier" BOOLEAN NOT NULL DEFAULT false,
    "structureDamageCount" INTEGER,
    "structureDamageStructureTypeId" INTEGER,
    "outputMultiplier" DOUBLE PRECISION,
    "eventWeightTargetEventDefId" INTEGER,
    "eventWeightValue" DOUBLE PRECISION,
    "eventWeightDurationHours" INTEGER,
    "dropTableId" INTEGER,

    CONSTRAINT "EventEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveEvent" (
    "id" SERIAL NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "factionId" INTEGER,
    "actionInstanceId" INTEGER,
    "campId" INTEGER,
    "currentStepId" INTEGER,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "lastInteractionAt" TIMESTAMPTZ,

    CONSTRAINT "ActiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveEvent_Participant" (
    "id" SERIAL NOT NULL,
    "activeEventId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveEvent_Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStepVote" (
    "id" SERIAL NOT NULL,
    "activeEventId" INTEGER NOT NULL,
    "stepDefId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "choiceId" INTEGER NOT NULL,

    CONSTRAINT "EventStepVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWeightModifier" (
    "id" SERIAL NOT NULL,
    "targetEventDefId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sourceActiveEventId" INTEGER,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWeightModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDef_Location" (
    "eventDefId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "weightMod" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "EventDef_Location_pkey" PRIMARY KEY ("eventDefId","locationId")
);

-- CreateTable
CREATE TABLE "EventCooldown" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "factionId" INTEGER,
    "lastFiredAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EventCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventUnresolvedState" (
    "id" SERIAL NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "factionId" INTEGER,
    "unresolvedCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EventUnresolvedState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatInitiationType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "canResultInDeath" BOOLEAN NOT NULL DEFAULT false,
    "isScripted" BOOLEAN NOT NULL DEFAULT false,
    "allowsFleeing" BOOLEAN NOT NULL DEFAULT false,
    "canSecondWind" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CombatInitiationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatOutcome" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "isVictory" BOOLEAN NOT NULL DEFAULT false,
    "isDefeat" BOOLEAN NOT NULL DEFAULT false,
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEffectType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "modifiesRoll" BOOLEAN NOT NULL DEFAULT false,
    "modifiesStat" BOOLEAN NOT NULL DEFAULT false,
    "deniesActions" BOOLEAN NOT NULL DEFAULT false,
    "modifiesAC" BOOLEAN NOT NULL DEFAULT false,
    "redirectsDamage" BOOLEAN NOT NULL DEFAULT false,
    "forcesTargeting" BOOLEAN NOT NULL DEFAULT false,
    "isReactive" BOOLEAN NOT NULL DEFAULT false,
    "absorbsDamage" BOOLEAN NOT NULL DEFAULT false,
    "grantsEvasion" BOOLEAN NOT NULL DEFAULT false,
    "enablesCounterattack" BOOLEAN NOT NULL DEFAULT false,
    "suppressesReactive" BOOLEAN NOT NULL DEFAULT false,
    "removesEffects" BOOLEAN NOT NULL DEFAULT false,
    "preventedAsTarget" BOOLEAN NOT NULL DEFAULT false,
    "reflectsDamage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatEffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatActionCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "actionsAllowedPerRound" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CombatActionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatTargetStrategy" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "CombatTargetStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "DamageCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageType" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "DamageType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesCombatBehavior" (
    "speciesId" INTEGER NOT NULL,
    "attackWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "buffWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "debuffWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "healWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "offensiveTargetStrategyId" INTEGER NOT NULL,
    "supportTargetStrategyId" INTEGER NOT NULL,
    "strategyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.8,

    CONSTRAINT "SpeciesCombatBehavior_pkey" PRIMARY KEY ("speciesId")
);

-- CreateTable
CREATE TABLE "SpeciesDefaultLoadout" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "autoEquip" BOOLEAN NOT NULL DEFAULT true,
    "aiWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "SpeciesDefaultLoadout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "combatEncounterDefId" INTEGER,
    "activeEventId" INTEGER,
    "initiationTypeId" INTEGER NOT NULL,
    "requiresPatrolLeader" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "currentTurnOrder" INTEGER NOT NULL DEFAULT 1,
    "outcomeId" INTEGER,
    "winningAllyFactionId" INTEGER,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "ActiveCombat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_Participant" (
    "id" SERIAL NOT NULL,
    "activeCombatId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "allyFactionId" INTEGER NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "isPatrolLeader" BOOLEAN NOT NULL DEFAULT false,
    "isAiControlled" BOOLEAN NOT NULL DEFAULT false,
    "controllerUserId" VARCHAR(50),
    "joinedAtRound" INTEGER NOT NULL DEFAULT 1,
    "dropTableId" INTEGER,
    "inSecondWind" BOOLEAN NOT NULL DEFAULT false,
    "hasFled" BOOLEAN NOT NULL DEFAULT false,
    "isDefeated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActiveCombat_Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_Participant_ActionCooldown" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "equipmentProfileId" INTEGER NOT NULL,
    "roundsRemaining" INTEGER NOT NULL,

    CONSTRAINT "ActiveCombat_Participant_ActionCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_BehaviorEffect" (
    "id" SERIAL NOT NULL,
    "activeCombatId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "affectedParticipantId" INTEGER NOT NULL,
    "linkedParticipantId" INTEGER,
    "roundsRemaining" INTEGER NOT NULL,
    "flatModifier" INTEGER,
    "percentModifier" DOUBLE PRECISION,

    CONSTRAINT "ActiveCombat_BehaviorEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_Action" (
    "id" SERIAL NOT NULL,
    "activeCombatId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "actorEntityId" INTEGER NOT NULL,
    "actionCategoryId" INTEGER NOT NULL,
    "equipmentProfileId" INTEGER NOT NULL,
    "targetEntityId" INTEGER,
    "hitRoll" INTEGER,
    "hitModifier" INTEGER,
    "hit" BOOLEAN,
    "damageRoll" INTEGER,
    "damageModifier" INTEGER,
    "damageDealt" INTEGER,
    "healDealt" INTEGER,
    "reflectedDamage" INTEGER,
    "absorbedDamage" INTEGER,
    "secondWindTriggered" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveCombat_Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEncounterDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "speciesId" INTEGER,
    "npcCount" INTEGER,

    CONSTRAINT "CombatEncounterDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEncounterDef_NamedEntity" (
    "combatEncounterDefId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,

    CONSTRAINT "CombatEncounterDef_NamedEntity_pkey" PRIMARY KEY ("combatEncounterDefId","entityId")
);

-- CreateTable
CREATE TABLE "CombatRollType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "CombatRollType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "durationRounds" INTEGER,
    "stackBehaviorId" INTEGER NOT NULL,

    CONSTRAINT "CombatStatEffectDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_StatMod" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "context" VARCHAR(50),

    CONSTRAINT "CombatStatEffectDef_StatMod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_RollMod" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "rollTypeId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "CombatStatEffectDef_RollMod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_AcMod" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "CombatStatEffectDef_AcMod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_DamageOverTime" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "diceCount" INTEGER NOT NULL,
    "diceSides" INTEGER NOT NULL,
    "flatDamage" INTEGER NOT NULL DEFAULT 0,
    "damageTypeId" INTEGER,

    CONSTRAINT "CombatStatEffectDef_DamageOverTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_HealOverTime" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "diceCount" INTEGER NOT NULL,
    "diceSides" INTEGER NOT NULL,
    "flatHeal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CombatStatEffectDef_HealOverTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_DamageModifier" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "damageTypeId" INTEGER NOT NULL,
    "modifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isImmune" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatStatEffectDef_DamageModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatStatEffectDef_RollAdvantage" (
    "id" SERIAL NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "rollTypeId" INTEGER NOT NULL,
    "isDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatStatEffectDef_RollAdvantage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_StatEffect" (
    "id" SERIAL NOT NULL,
    "activeCombatId" INTEGER NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "affectedParticipantId" INTEGER NOT NULL,
    "sourceParticipantId" INTEGER,
    "appliedByActionId" INTEGER,
    "sourceEntityConditionId" INTEGER,
    "roundsRemaining" INTEGER,

    CONSTRAINT "ActiveCombat_StatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEquipmentProfile_StatEffect" (
    "id" SERIAL NOT NULL,
    "equipmentProfileId" INTEGER NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "applicationChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ItemEquipmentProfile_StatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef_CombatStatEffect" (
    "id" SERIAL NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "applicationChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ConditionDef_CombatStatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityDef_StatEffect" (
    "id" SERIAL NOT NULL,
    "abilityDefId" INTEGER NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "applicationChance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "AbilityDef_StatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity_PreCombatEffect" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "effectDefId" INTEGER NOT NULL,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "equipmentProfileId" INTEGER,
    "abilityDefId" INTEGER,

    CONSTRAINT "Entity_PreCombatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "PlantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantTrait" (
    "id" SERIAL NOT NULL,
    "codeName" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "PlantTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
    "rootPlantDefId" INTEGER,
    "growthCap" INTEGER NOT NULL,
    "growthStages" INTEGER NOT NULL,
    "maxHarvests" INTEGER NOT NULL,
    "harvestDropTableId" INTEGER NOT NULL,
    "propagationItemId" INTEGER,
    "mutationChance" DOUBLE PRECISION NOT NULL DEFAULT 0.7,

    CONSTRAINT "PlantDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantDef_PlantType" (
    "plantDefId" INTEGER NOT NULL,
    "plantTypeId" INTEGER NOT NULL,

    CONSTRAINT "PlantDef_PlantType_pkey" PRIMARY KEY ("plantDefId","plantTypeId")
);

-- CreateTable
CREATE TABLE "PlantType_EnvConditionEffect" (
    "id" SERIAL NOT NULL,
    "plantTypeId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectTypeId" INTEGER,
    "value" DOUBLE PRECISION,

    CONSTRAINT "PlantType_EnvConditionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantDef_Trait" (
    "plantDefId" INTEGER NOT NULL,
    "plantTraitId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlantDef_Trait_pkey" PRIMARY KEY ("plantDefId","plantTraitId")
);

-- CreateTable
CREATE TABLE "PlantDef_GrowthStage" (
    "plantDefId" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "PlantDef_GrowthStage_pkey" PRIMARY KEY ("plantDefId","stage")
);

-- CreateTable
CREATE TABLE "PlantDef_Biome" (
    "plantDefId" INTEGER NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "spawnRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "growthRateModifier" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "PlantDef_Biome_pkey" PRIMARY KEY ("plantDefId","biomeId")
);

-- CreateTable
CREATE TABLE "PlantDef_EnvConditionEffect" (
    "id" SERIAL NOT NULL,
    "plantDefId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "effectTypeId" INTEGER,
    "value" DOUBLE PRECISION,

    CONSTRAINT "PlantDef_EnvConditionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantDef_PlotType" (
    "plantDefId" INTEGER NOT NULL,
    "plotTypeId" INTEGER NOT NULL,
    "growthRateModifier" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "PlantDef_PlotType_pkey" PRIMARY KEY ("plantDefId","plotTypeId")
);

-- CreateTable
CREATE TABLE "PlotType" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "soilQualityCap" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "PlotType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotType_EnvCondition" (
    "plotTypeId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,

    CONSTRAINT "PlotType_EnvCondition_pkey" PRIMARY KEY ("plotTypeId","envConditionId")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "name" VARCHAR(100),
    "soilQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot_Buff" (
    "id" SERIAL NOT NULL,
    "plotId" INTEGER NOT NULL,
    "sourceEntityId" INTEGER,
    "effectTypeId" INTEGER NOT NULL,
    "effectValue" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Plot_Buff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location_Effect" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "sourceEntityId" INTEGER,
    "sourceActiveEventId" INTEGER,
    "effectTypeId" INTEGER NOT NULL,
    "effectValue" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Location_Effect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotCrop" (
    "id" SERIAL NOT NULL,
    "plotId" INTEGER NOT NULL,
    "plantDefId" INTEGER NOT NULL,
    "plantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "growthProgression" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "harvestCount" INTEGER NOT NULL DEFAULT 0,
    "carePoints" INTEGER NOT NULL DEFAULT 0,
    "lastCrossbredAt" TIMESTAMPTZ,

    CONSTRAINT "PlotCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot_TendRecord" (
    "plotId" INTEGER NOT NULL,
    "systemType" VARCHAR(50) NOT NULL,
    "lastPerformedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Plot_TendRecord_pkey" PRIMARY KEY ("plotId","systemType")
);

-- CreateTable
CREATE TABLE "EntityInspectionLog" (
    "id" SERIAL NOT NULL,
    "patientEntityId" INTEGER NOT NULL,
    "medicEntityId" INTEGER NOT NULL,
    "inspectedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rollResult" INTEGER NOT NULL,

    CONSTRAINT "EntityInspectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityTreatmentLog" (
    "id" SERIAL NOT NULL,
    "entityConditionId" INTEGER NOT NULL,
    "medicEntityId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "treatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progressionChange" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EntityTreatmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE INDEX "User_discordId_idx" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceClient_name_key" ON "ServiceClient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceClient_clientId_key" ON "ServiceClient"("clientId");

-- CreateIndex
CREATE INDEX "ServiceClient_clientId_idx" ON "ServiceClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildSettings_guildId_key" ON "GuildSettings"("guildId");

-- CreateIndex
CREATE INDEX "GuildSettings_seasonId_idx" ON "GuildSettings"("seasonId");

-- CreateIndex
CREATE INDEX "GuildSettings_currentPatternId_idx" ON "GuildSettings"("currentPatternId");

-- CreateIndex
CREATE INDEX "GuildSettings_currentPatternStepId_idx" ON "GuildSettings"("currentPatternStepId");

-- CreateIndex
CREATE UNIQUE INDEX "EchoDens_guildId_channelId_key" ON "EchoDens"("guildId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationType_name_key" ON "RelationType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EffectType_name_key" ON "EffectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionType_name_key" ON "ConstructionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EntityType_name_key" ON "EntityType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sex_name_key" ON "Sex"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Gender_name_key" ON "Gender"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Stat_name_key" ON "Stat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_name_key" ON "Symptom"("name");

-- CreateIndex
CREATE INDEX "Symptom_FlavorText_flavorTextId_idx" ON "Symptom_FlavorText"("flavorTextId");

-- CreateIndex
CREATE INDEX "DropTable_guildId_idx" ON "DropTable"("guildId");

-- CreateIndex
CREATE INDEX "DropTable_Entry_dropTableId_idx" ON "DropTable_Entry"("dropTableId");

-- CreateIndex
CREATE INDEX "DropTable_Entry_itemId_idx" ON "DropTable_Entry"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTable_Entry_dropTableId_itemId_key" ON "DropTable_Entry"("dropTableId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementType_name_key" ON "MeasurementType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientType_name_key" ON "IngredientType"("name");

-- CreateIndex
CREATE INDEX "IngredientType_measurementTypeId_idx" ON "IngredientType"("measurementTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE INDEX "Season_envConditionId_idx" ON "Season"("envConditionId");

-- CreateIndex
CREATE INDEX "WeatherState_guildId_idx" ON "WeatherState"("guildId");

-- CreateIndex
CREATE INDEX "WeatherState_guildId_name_idx" ON "WeatherState"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherState_guildId_codeName_key" ON "WeatherState"("guildId", "codeName");

-- CreateIndex
CREATE UNIQUE INDEX "EnvCondition_codeName_key" ON "EnvCondition"("codeName");

-- CreateIndex
CREATE INDEX "WeatherState_EnvCondition_envConditionId_idx" ON "WeatherState_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "WeatherPattern_guildId_idx" ON "WeatherPattern"("guildId");

-- CreateIndex
CREATE INDEX "WeatherPattern_guildId_name_idx" ON "WeatherPattern"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherPattern_guildId_codeName_key" ON "WeatherPattern"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "WeatherPatternStep_weatherStateId_idx" ON "WeatherPatternStep"("weatherStateId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherPatternStep_patternId_stepOrder_key" ON "WeatherPatternStep"("patternId", "stepOrder");

-- CreateIndex
CREATE INDEX "Season_WeatherPattern_patternId_idx" ON "Season_WeatherPattern"("patternId");

-- CreateIndex
CREATE INDEX "GuildSeason_DefaultWeather_seasonId_idx" ON "GuildSeason_DefaultWeather"("seasonId");

-- CreateIndex
CREATE INDEX "GuildSeason_DefaultWeather_weatherStateId_idx" ON "GuildSeason_DefaultWeather"("weatherStateId");

-- CreateIndex
CREATE INDEX "Guild_WeatherPatternCooldown_patternId_idx" ON "Guild_WeatherPatternCooldown"("patternId");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_guildId_idx" ON "EnvCondition_Modifier"("guildId");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_envConditionId_idx" ON "EnvCondition_Modifier"("envConditionId");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_effectTypeId_idx" ON "EnvCondition_Modifier"("effectTypeId");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_relationTypeId_idx" ON "EnvCondition_Modifier"("relationTypeId");

-- CreateIndex
CREATE INDEX "EnvCondition_StatModifier_guildId_idx" ON "EnvCondition_StatModifier"("guildId");

-- CreateIndex
CREATE INDEX "EnvCondition_StatModifier_envConditionId_idx" ON "EnvCondition_StatModifier"("envConditionId");

-- CreateIndex
CREATE INDEX "EnvCondition_StatModifier_statId_idx" ON "EnvCondition_StatModifier"("statId");

-- CreateIndex
CREATE INDEX "EnvCondition_ProficiencyModifier_guildId_idx" ON "EnvCondition_ProficiencyModifier"("guildId");

-- CreateIndex
CREATE INDEX "EnvCondition_ProficiencyModifier_envConditionId_idx" ON "EnvCondition_ProficiencyModifier"("envConditionId");

-- CreateIndex
CREATE INDEX "EnvCondition_ProficiencyModifier_proficiencyDefId_idx" ON "EnvCondition_ProficiencyModifier"("proficiencyDefId");

-- CreateIndex
CREATE UNIQUE INDEX "Biome_codeName_key" ON "Biome"("codeName");

-- CreateIndex
CREATE UNIQUE INDEX "Biome_name_key" ON "Biome"("name");

-- CreateIndex
CREATE INDEX "Biome_EnvCondition_envConditionId_idx" ON "Biome_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "Guild_BiomeDrop_biomeId_idx" ON "Guild_BiomeDrop"("biomeId");

-- CreateIndex
CREATE INDEX "Guild_BiomeDrop_dropTableId_idx" ON "Guild_BiomeDrop"("dropTableId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesType_name_key" ON "SpeciesType"("name");

-- CreateIndex
CREATE INDEX "Species_guildId_idx" ON "Species"("guildId");

-- CreateIndex
CREATE INDEX "Species_guildId_name_idx" ON "Species"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Species_guildId_codeName_key" ON "Species"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Species_EquipmentLoadout_slotTypeId_idx" ON "Species_EquipmentLoadout"("slotTypeId");

-- CreateIndex
CREATE INDEX "Species_SpeciesType_speciesTypeId_idx" ON "Species_SpeciesType"("speciesTypeId");

-- CreateIndex
CREATE INDEX "Species_Biome_biomeId_idx" ON "Species_Biome"("biomeId");

-- CreateIndex
CREATE INDEX "SpeciesType_EnvConditionEffect_speciesTypeId_idx" ON "SpeciesType_EnvConditionEffect"("speciesTypeId");

-- CreateIndex
CREATE INDEX "SpeciesType_EnvConditionEffect_envConditionId_idx" ON "SpeciesType_EnvConditionEffect"("envConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesType_EnvConditionEffect_speciesTypeId_envConditionId_key" ON "SpeciesType_EnvConditionEffect"("speciesTypeId", "envConditionId", "relationTypeId", "effectTypeId");

-- CreateIndex
CREATE INDEX "Species_EnvConditionEffect_speciesId_idx" ON "Species_EnvConditionEffect"("speciesId");

-- CreateIndex
CREATE INDEX "Species_EnvConditionEffect_envConditionId_idx" ON "Species_EnvConditionEffect"("envConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_EnvConditionEffect_speciesId_envConditionId_relatio_key" ON "Species_EnvConditionEffect"("speciesId", "envConditionId", "relationTypeId", "effectTypeId");

-- CreateIndex
CREATE INDEX "BodyPart_speciesId_idx" ON "BodyPart"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyPart_speciesId_name_key" ON "BodyPart"("speciesId", "name");

-- CreateIndex
CREATE INDEX "Entity_guildId_userId_idx" ON "Entity"("guildId", "userId");

-- CreateIndex
CREATE INDEX "Entity_factionId_idx" ON "Entity"("factionId");

-- CreateIndex
CREATE INDEX "Entity_rankId_idx" ON "Entity"("rankId");

-- CreateIndex
CREATE INDEX "Entity_statusId_idx" ON "Entity"("statusId");

-- CreateIndex
CREATE INDEX "Entity_typeId_idx" ON "Entity"("typeId");

-- CreateIndex
CREATE INDEX "Entity_speciesId_idx" ON "Entity"("speciesId");

-- CreateIndex
CREATE INDEX "Entity_sexId_idx" ON "Entity"("sexId");

-- CreateIndex
CREATE INDEX "Entity_genderId_idx" ON "Entity"("genderId");

-- CreateIndex
CREATE INDEX "EntityBehaviorCounter_counterKey_idx" ON "EntityBehaviorCounter"("counterKey");

-- CreateIndex
CREATE INDEX "EntityImage_entityId_idx" ON "EntityImage"("entityId");

-- CreateIndex
CREATE INDEX "EntityCondition_entityId_idx" ON "EntityCondition"("entityId");

-- CreateIndex
CREATE INDEX "EntityCondition_conditionDefId_idx" ON "EntityCondition"("conditionDefId");

-- CreateIndex
CREATE INDEX "EntityCondition_sourceEntityId_idx" ON "EntityCondition"("sourceEntityId");

-- CreateIndex
CREATE INDEX "EntityCondition_sourceActiveEventId_idx" ON "EntityCondition"("sourceActiveEventId");

-- CreateIndex
CREATE INDEX "EntityCondition_linkedConditionId_idx" ON "EntityCondition"("linkedConditionId");

-- CreateIndex
CREATE INDEX "EntityCondition_appliedInCombatId_idx" ON "EntityCondition"("appliedInCombatId");

-- CreateIndex
CREATE INDEX "EntityCondition_appliedByActionId_idx" ON "EntityCondition"("appliedByActionId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityCondition_entityId_conditionDefId_bodyPartId_key" ON "EntityCondition"("entityId", "conditionDefId", "bodyPartId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipType_name_key" ON "RelationshipType"("name");

-- CreateIndex
CREATE INDEX "EntityRelationship_entityId_idx" ON "EntityRelationship"("entityId");

-- CreateIndex
CREATE INDEX "EntityRelationship_targetEntityId_idx" ON "EntityRelationship"("targetEntityId");

-- CreateIndex
CREATE INDEX "EntityRelationship_relationshipTypeId_idx" ON "EntityRelationship"("relationshipTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRelationship_entityId_targetEntityId_relationshipType_key" ON "EntityRelationship"("entityId", "targetEntityId", "relationshipTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "FactionStandingType_name_key" ON "FactionStandingType"("name");

-- CreateIndex
CREATE INDEX "FactionStanding_targetFactionId_idx" ON "FactionStanding"("targetFactionId");

-- CreateIndex
CREATE INDEX "FactionStanding_standingTypeId_idx" ON "FactionStanding"("standingTypeId");

-- CreateIndex
CREATE INDEX "Faction_guildId_idx" ON "Faction"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Faction_guildId_codeName_key" ON "Faction"("guildId", "codeName");

-- CreateIndex
CREATE UNIQUE INDEX "Faction_guildId_name_key" ON "Faction"("guildId", "name");

-- CreateIndex
CREATE INDEX "Rank_guildId_idx" ON "Rank"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_guildId_name_key" ON "Rank"("guildId", "name");

-- CreateIndex
CREATE INDEX "Rank_Faction_factionId_idx" ON "Rank_Faction"("factionId");

-- CreateIndex
CREATE INDEX "Rank_DefaultItem_itemId_idx" ON "Rank_DefaultItem"("itemId");

-- CreateIndex
CREATE INDEX "ProficiencyDef_guildId_idx" ON "ProficiencyDef"("guildId");

-- CreateIndex
CREATE INDEX "ProficiencyDef_guildId_name_idx" ON "ProficiencyDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "ProficiencyDef_statId_idx" ON "ProficiencyDef"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "ProficiencyDef_guildId_codeName_key" ON "ProficiencyDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Entity_Proficiency_entityId_idx" ON "Entity_Proficiency"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplineDef_codeName_key" ON "DisciplineDef"("codeName");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplineDef_name_key" ON "DisciplineDef"("name");

-- CreateIndex
CREATE INDEX "Guild_DisciplineLevelCap_disciplineDefId_idx" ON "Guild_DisciplineLevelCap"("disciplineDefId");

-- CreateIndex
CREATE INDEX "Entity_Discipline_entityId_idx" ON "Entity_Discipline"("entityId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_guildId_idx" ON "SkillTreeNode"("guildId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_disciplineDefId_idx" ON "SkillTreeNode"("disciplineDefId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_abilityDefId_idx" ON "SkillTreeNode"("abilityDefId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTreeNode_guildId_name_key" ON "SkillTreeNode"("guildId", "name");

-- CreateIndex
CREATE INDEX "SkillTreeNode_DisciplineRequirement_disciplineDefId_idx" ON "SkillTreeNode_DisciplineRequirement"("disciplineDefId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_Relation_targetNodeId_idx" ON "SkillTreeNode_Relation"("targetNodeId");

-- CreateIndex
CREATE INDEX "SkillTreeNode_Relation_relationTypeId_idx" ON "SkillTreeNode_Relation"("relationTypeId");

-- CreateIndex
CREATE INDEX "Entity_SkillTreeNode_entityId_idx" ON "Entity_SkillTreeNode"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_SkillTreeNode_entityId_nodeId_key" ON "Entity_SkillTreeNode"("entityId", "nodeId");

-- CreateIndex
CREATE INDEX "AbilityDef_guildId_idx" ON "AbilityDef"("guildId");

-- CreateIndex
CREATE INDEX "AbilityDef_guildId_name_idx" ON "AbilityDef"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AbilityDef_guildId_codeName_key" ON "AbilityDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Entity_Ability_entityId_idx" ON "Entity_Ability"("entityId");

-- CreateIndex
CREATE INDEX "Entity_Ability_abilityDefId_idx" ON "Entity_Ability"("abilityDefId");

-- CreateIndex
CREATE INDEX "Species_DefaultAbility_abilityDefId_idx" ON "Species_DefaultAbility"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_StatModifier_abilityDefId_idx" ON "Ability_StatModifier"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_StatModifier_statId_idx" ON "Ability_StatModifier"("statId");

-- CreateIndex
CREATE INDEX "Ability_ProficiencyModifier_abilityDefId_idx" ON "Ability_ProficiencyModifier"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_ProficiencyModifier_proficiencyDefId_idx" ON "Ability_ProficiencyModifier"("proficiencyDefId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetType_name_key" ON "TargetType"("name");

-- CreateIndex
CREATE INDEX "Ability_MultiplierEffect_abilityDefId_idx" ON "Ability_MultiplierEffect"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_GrantedAction_abilityDefId_idx" ON "Ability_GrantedAction"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_GrantedAction_itemId_idx" ON "Ability_GrantedAction"("itemId");

-- CreateIndex
CREATE INDEX "Ability_CombatBehavior_abilityDefId_idx" ON "Ability_CombatBehavior"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_CombatBehavior_behaviorTypeId_idx" ON "Ability_CombatBehavior"("behaviorTypeId");

-- CreateIndex
CREATE INDEX "Ability_ConditionResistance_abilityDefId_idx" ON "Ability_ConditionResistance"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_DamageModifier_abilityDefId_idx" ON "Ability_DamageModifier"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_DamageModifier_damageTypeId_idx" ON "Ability_DamageModifier"("damageTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AbilityEffectType_name_key" ON "AbilityEffectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AbilityThresholdType_name_key" ON "AbilityThresholdType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TargetScope_name_key" ON "TargetScope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TriggerTiming_name_key" ON "TriggerTiming"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StackBehavior_name_key" ON "StackBehavior"("name");

-- CreateIndex
CREATE INDEX "Ability_ActionTrigger_abilityDefId_idx" ON "Ability_ActionTrigger"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_ActionTrigger_triggerSystemType_idx" ON "Ability_ActionTrigger"("triggerSystemType");

-- CreateIndex
CREATE INDEX "Ability_ThresholdTrigger_abilityDefId_idx" ON "Ability_ThresholdTrigger"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_PresenceEffect_abilityDefId_idx" ON "Ability_PresenceEffect"("abilityDefId");

-- CreateIndex
CREATE INDEX "Ability_PresenceEffect_presenceScopeId_idx" ON "Ability_PresenceEffect"("presenceScopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionContext_name_key" ON "ConditionContext"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionType_name_key" ON "ConditionType"("name");

-- CreateIndex
CREATE INDEX "ConditionDef_guildId_idx" ON "ConditionDef"("guildId");

-- CreateIndex
CREATE INDEX "ConditionDef_guildId_name_idx" ON "ConditionDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "ConditionDef_conditionTypeId_idx" ON "ConditionDef"("conditionTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_conditionContextId_idx" ON "ConditionDef"("conditionContextId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_guildId_codeName_key" ON "ConditionDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "ConditionDef_DamageModifier_damageTypeId_idx" ON "ConditionDef_DamageModifier"("damageTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_EnvRule_envConditionId_idx" ON "ConditionDef_EnvRule"("envConditionId");

-- CreateIndex
CREATE INDEX "ConditionDef_StatEffect_statId_idx" ON "ConditionDef_StatEffect"("statId");

-- CreateIndex
CREATE INDEX "ConditionDef_ProficiencyEffect_proficiencyDefId_idx" ON "ConditionDef_ProficiencyEffect"("proficiencyDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatEffect_effectTypeId_idx" ON "ConditionDef_CombatEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatEffect_statId_idx" ON "ConditionDef_CombatEffect"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_CombatEffect_conditionDefId_effectTypeId_key" ON "ConditionDef_CombatEffect"("conditionDefId", "effectTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_parentConditionId_relationTypeId_idx" ON "ConditionDef_Link"("parentConditionId", "relationTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_childConditionId_idx" ON "ConditionDef_Link"("childConditionId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_relationTypeId_idx" ON "ConditionDef_Link"("relationTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_Link_parentConditionId_childConditionId_relati_key" ON "ConditionDef_Link"("parentConditionId", "childConditionId", "relationTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_SymptomTag_symptomId_idx" ON "ConditionDef_SymptomTag"("symptomId");

-- CreateIndex
CREATE INDEX "ConditionDef_GrantedItem_conditionDefId_idx" ON "ConditionDef_GrantedItem"("conditionDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_GrantedItem_itemId_idx" ON "ConditionDef_GrantedItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionBehaviorType_name_key" ON "ConditionBehaviorType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorRedirectTarget_name_key" ON "BehaviorRedirectTarget"("name");

-- CreateIndex
CREATE INDEX "ConditionBehaviorEffect_conditionDefId_idx" ON "ConditionBehaviorEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "ConditionBehaviorEffect_actionTypeId_idx" ON "ConditionBehaviorEffect"("actionTypeId");

-- CreateIndex
CREATE INDEX "ConditionBehaviorEffect_behaviorTypeId_idx" ON "ConditionBehaviorEffect"("behaviorTypeId");

-- CreateIndex
CREATE INDEX "ConditionBehaviorEffect_redirectTargetId_idx" ON "ConditionBehaviorEffect"("redirectTargetId");

-- CreateIndex
CREATE INDEX "ConditionBehaviorEffect_restrictActionTypeId_idx" ON "ConditionBehaviorEffect"("restrictActionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemInteraction_name_key" ON "ItemInteraction"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_name_key" ON "ItemType"("name");

-- CreateIndex
CREATE INDEX "ItemWarning_guildId_idx" ON "ItemWarning"("guildId");

-- CreateIndex
CREATE INDEX "ItemWarning_conditionDefId_idx" ON "ItemWarning"("conditionDefId");

-- CreateIndex
CREATE INDEX "ItemWarning_triggeredByInteractionId_idx" ON "ItemWarning"("triggeredByInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemWarning_guildId_name_key" ON "ItemWarning"("guildId", "name");

-- CreateIndex
CREATE INDEX "Item_Warning_warningId_idx" ON "Item_Warning"("warningId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentSlotType_name_key" ON "EquipmentSlotType"("name");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_itemId_idx" ON "ItemEquipmentProfile"("itemId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_slotTypeId_idx" ON "ItemEquipmentProfile"("slotTypeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_damageTypeId_idx" ON "ItemEquipmentProfile"("damageTypeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_elementalDamageTypeId_idx" ON "ItemEquipmentProfile"("elementalDamageTypeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_actionCategoryId_idx" ON "ItemEquipmentProfile"("actionCategoryId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_actionTypeId_idx" ON "ItemEquipmentProfile"("actionTypeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_targetScopeId_idx" ON "ItemEquipmentProfile"("targetScopeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_behaviorEffectTypeId_idx" ON "ItemEquipmentProfile"("behaviorEffectTypeId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_triggersEventDefId_idx" ON "ItemEquipmentProfile"("triggersEventDefId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_summonSpeciesId_idx" ON "ItemEquipmentProfile"("summonSpeciesId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_hitStatId_idx" ON "ItemEquipmentProfile"("hitStatId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_damageStatId_idx" ON "ItemEquipmentProfile"("damageStatId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_healStatId_idx" ON "ItemEquipmentProfile"("healStatId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_equipmentProfileId_idx" ON "ItemEquipmentProfile_Condition"("equipmentProfileId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_conditionDefId_idx" ON "ItemEquipmentProfile_Condition"("conditionDefId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_sourceProficiencyId_idx" ON "ItemEquipmentProfile_Condition"("sourceProficiencyId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_linkedProfileConditionId_idx" ON "ItemEquipmentProfile_Condition"("linkedProfileConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEquipmentProfile_Condition_equipmentProfileId_condition_key" ON "ItemEquipmentProfile_Condition"("equipmentProfileId", "conditionDefId", "appliesTo");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_RequiredItem_requiredItemId_idx" ON "ItemEquipmentProfile_RequiredItem"("requiredItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemActionType_name_key" ON "ItemActionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CombatTargetScope_name_key" ON "CombatTargetScope"("name");

-- CreateIndex
CREATE INDEX "ItemAction_itemId_idx" ON "ItemAction"("itemId");

-- CreateIndex
CREATE INDEX "ItemAction_itemInteractionId_idx" ON "ItemAction"("itemInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAction_itemId_itemInteractionId_key" ON "ItemAction"("itemId", "itemInteractionId");

-- CreateIndex
CREATE INDEX "ItemAction_Output_itemActionId_idx" ON "ItemAction_Output"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemAction_Output_outputItemId_idx" ON "ItemAction_Output"("outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAction_Output_itemActionId_outputItemId_key" ON "ItemAction_Output"("itemActionId", "outputItemId");

-- CreateIndex
CREATE INDEX "ItemEffect_itemActionId_idx" ON "ItemEffect"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemEffect_symptomId_idx" ON "ItemEffect"("symptomId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEffect_itemActionId_symptomId_key" ON "ItemEffect"("itemActionId", "symptomId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_itemActionId_idx" ON "ItemConditionEffect"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_conditionDefId_idx" ON "ItemConditionEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_outputConditionDefId_idx" ON "ItemConditionEffect"("outputConditionDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemConditionEffect_itemActionId_conditionDefId_key" ON "ItemConditionEffect"("itemActionId", "conditionDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemFoodProfile_itemId_key" ON "ItemFoodProfile"("itemId");

-- CreateIndex
CREATE INDEX "Item_guildId_idx" ON "Item"("guildId");

-- CreateIndex
CREATE INDEX "Item_guildId_name_idx" ON "Item"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_guildId_codeName_key" ON "Item"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Item_Type_itemTypeId_idx" ON "Item_Type"("itemTypeId");

-- CreateIndex
CREATE INDEX "Item_CompostOutput_itemId_idx" ON "Item_CompostOutput"("itemId");

-- CreateIndex
CREATE INDEX "Item_CompostOutput_outputItemId_idx" ON "Item_CompostOutput"("outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_CompostOutput_structureDefId_itemId_outputItemId_key" ON "Item_CompostOutput"("structureDefId", "itemId", "outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CraftingInteraction_name_key" ON "CraftingInteraction"("name");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionConfig_craftingInteractionId_idx" ON "Guild_CraftingInteractionConfig"("craftingInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeOutputMode_name_key" ON "RecipeOutputMode"("name");

-- CreateIndex
CREATE INDEX "Recipe_guildId_idx" ON "Recipe"("guildId");

-- CreateIndex
CREATE INDEX "Recipe_guildId_name_idx" ON "Recipe"("guildId", "name");

-- CreateIndex
CREATE INDEX "Recipe_craftingInteractionId_idx" ON "Recipe"("craftingInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_guildId_codeName_key" ON "Recipe"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Entity_DiscoveredRecipe_recipeId_idx" ON "Entity_DiscoveredRecipe"("recipeId");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionRule_guildId_craftingInteractionId_idx" ON "Guild_CraftingInteractionRule"("guildId", "craftingInteractionId");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionRule_structureDefId_idx" ON "Guild_CraftingInteractionRule"("structureDefId");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionRule_upgradeId_idx" ON "Guild_CraftingInteractionRule"("upgradeId");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionRule_disciplineDefId_idx" ON "Guild_CraftingInteractionRule"("disciplineDefId");

-- CreateIndex
CREATE INDEX "Guild_CraftingInteractionRule_skillTreeNodeId_idx" ON "Guild_CraftingInteractionRule"("skillTreeNodeId");

-- CreateIndex
CREATE INDEX "Recipe_DisciplineReward_disciplineId_idx" ON "Recipe_DisciplineReward"("disciplineId");

-- CreateIndex
CREATE INDEX "Recipe_CraftingRequirement_recipeId_idx" ON "Recipe_CraftingRequirement"("recipeId");

-- CreateIndex
CREATE INDEX "Recipe_CraftingRequirement_structureDefId_idx" ON "Recipe_CraftingRequirement"("structureDefId");

-- CreateIndex
CREATE INDEX "Recipe_CraftingRequirement_upgradeId_idx" ON "Recipe_CraftingRequirement"("upgradeId");

-- CreateIndex
CREATE INDEX "Recipe_CraftingRequirement_disciplineDefId_idx" ON "Recipe_CraftingRequirement"("disciplineDefId");

-- CreateIndex
CREATE INDEX "Recipe_CraftingRequirement_skillTreeNodeId_idx" ON "Recipe_CraftingRequirement"("skillTreeNodeId");

-- CreateIndex
CREATE INDEX "RecipeSlot_recipeId_idx" ON "RecipeSlot"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeSlot_measurementTypeId_idx" ON "RecipeSlot"("measurementTypeId");

-- CreateIndex
CREATE INDEX "RecipeSlotOption_slotId_idx" ON "RecipeSlotOption"("slotId");

-- CreateIndex
CREATE INDEX "RecipeSlotOption_itemId_idx" ON "RecipeSlotOption"("itemId");

-- CreateIndex
CREATE INDEX "RecipeSlotOption_RequiredTag_ingredientTypeId_idx" ON "RecipeSlotOption_RequiredTag"("ingredientTypeId");

-- CreateIndex
CREATE INDEX "RecipeSlotOption_ExcludedTag_ingredientTypeId_idx" ON "RecipeSlotOption_ExcludedTag"("ingredientTypeId");

-- CreateIndex
CREATE INDEX "RecipeOutput_recipeId_idx" ON "RecipeOutput"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeOutput_outputItemId_idx" ON "RecipeOutput"("outputItemId");

-- CreateIndex
CREATE INDEX "RecipeOutput_outputModeId_idx" ON "RecipeOutput"("outputModeId");

-- CreateIndex
CREATE INDEX "RecipeOutput_outputMeasurementTypeId_idx" ON "RecipeOutput"("outputMeasurementTypeId");

-- CreateIndex
CREATE INDEX "RecipeOutput_AddTag_ingredientTypeId_idx" ON "RecipeOutput_AddTag"("ingredientTypeId");

-- CreateIndex
CREATE INDEX "RecipeOutput_RemoveTag_ingredientTypeId_idx" ON "RecipeOutput_RemoveTag"("ingredientTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeOutput_FoodOverride_recipeOutputId_key" ON "RecipeOutput_FoodOverride"("recipeOutputId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_guildId_idx" ON "Item_IngredientType"("guildId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_itemId_idx" ON "Item_IngredientType"("itemId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_ingredientTypeId_idx" ON "Item_IngredientType"("ingredientTypeId");

-- CreateIndex
CREATE INDEX "Storage_guildId_idx" ON "Storage"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_Storage_storageId_key" ON "Entity_Storage"("storageId");

-- CreateIndex
CREATE INDEX "Entity_Housing_structureId_idx" ON "Entity_Housing"("structureId");

-- CreateIndex
CREATE INDEX "Entity_WorkAssignment_structureId_idx" ON "Entity_WorkAssignment"("structureId");

-- CreateIndex
CREATE INDEX "Entity_WorkAssignment_assignedUntil_idx" ON "Entity_WorkAssignment"("assignedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_Storage_storageId_key" ON "Structure_Storage"("storageId");

-- CreateIndex
CREATE INDEX "Structure_Storage_ItemType_itemTypeId_idx" ON "Structure_Storage_ItemType"("itemTypeId");

-- CreateIndex
CREATE INDEX "StoredItem_storageId_idx" ON "StoredItem"("storageId");

-- CreateIndex
CREATE INDEX "StoredItem_itemId_idx" ON "StoredItem"("itemId");

-- CreateIndex
CREATE INDEX "StoredItem_chosenProfileId_idx" ON "StoredItem"("chosenProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureType_name_key" ON "StructureType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeEffectType_name_key" ON "UpgradeEffectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FuelType_name_key" ON "FuelType"("name");

-- CreateIndex
CREATE INDEX "StructureDef_guildId_idx" ON "StructureDef"("guildId");

-- CreateIndex
CREATE INDEX "StructureDef_StructureType_structureTypeId_idx" ON "StructureDef_StructureType"("structureTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_CampRequirement_requiredStructureTypeId_idx" ON "StructureDef_CampRequirement"("requiredStructureTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_Relation_targetStructureDefId_idx" ON "StructureDef_Relation"("targetStructureDefId");

-- CreateIndex
CREATE INDEX "StructureDef_Relation_relationTypeId_idx" ON "StructureDef_Relation"("relationTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_BuildCost_itemId_idx" ON "StructureDef_BuildCost"("itemId");

-- CreateIndex
CREATE INDEX "StructureDef_CraftingConfig_Interaction_craftingInteraction_idx" ON "StructureDef_CraftingConfig_Interaction"("craftingInteractionId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_CraftingInteraction_craftingInteractio_idx" ON "StructureDef_Upgrade_CraftingInteraction"("craftingInteractionId");

-- CreateIndex
CREATE INDEX "StructureDef_ProductionConfig_EnvCondition_envConditionId_idx" ON "StructureDef_ProductionConfig_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "StructureDef_WorkSlotConfig_Requirement_disciplineDefId_idx" ON "StructureDef_WorkSlotConfig_Requirement"("disciplineDefId");

-- CreateIndex
CREATE INDEX "StructureDef_ProductionInput_itemId_idx" ON "StructureDef_ProductionInput"("itemId");

-- CreateIndex
CREATE INDEX "StructureDef_ProductionOutput_itemId_idx" ON "StructureDef_ProductionOutput"("itemId");

-- CreateIndex
CREATE INDEX "StructureDef_FuelConfig_InputFuelType_fuelTypeId_idx" ON "StructureDef_FuelConfig_InputFuelType"("fuelTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_FuelConfig_OutputFuelType_fuelTypeId_idx" ON "StructureDef_FuelConfig_OutputFuelType"("fuelTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_FuelConfig_EnvCondition_envConditionId_idx" ON "StructureDef_FuelConfig_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "StructureDef_AcceptedFuelType_fuelTypeId_idx" ON "StructureDef_AcceptedFuelType"("fuelTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_AcceptedFuelType_fuelTypeId_idx" ON "StructureDef_Upgrade_AcceptedFuelType"("fuelTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_structureDefId_idx" ON "StructureDef_Upgrade"("structureDefId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_Effect_upgradeId_idx" ON "StructureDef_Upgrade_Effect"("upgradeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_Effect_effectTypeId_idx" ON "StructureDef_Upgrade_Effect"("effectTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_Relation_targetUpgradeId_idx" ON "StructureDef_Upgrade_Relation"("targetUpgradeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_Relation_relationTypeId_idx" ON "StructureDef_Upgrade_Relation"("relationTypeId");

-- CreateIndex
CREATE INDEX "StructureDef_Upgrade_BuildCost_itemId_idx" ON "StructureDef_Upgrade_BuildCost"("itemId");

-- CreateIndex
CREATE INDEX "Structure_campId_idx" ON "Structure"("campId");

-- CreateIndex
CREATE INDEX "Structure_structureDefId_idx" ON "Structure"("structureDefId");

-- CreateIndex
CREATE INDEX "Structure_AppliedUpgrade_structureId_idx" ON "Structure_AppliedUpgrade"("structureId");

-- CreateIndex
CREATE INDEX "Structure_AppliedUpgrade_upgradeId_idx" ON "Structure_AppliedUpgrade"("upgradeId");

-- CreateIndex
CREATE INDEX "Construction_structureId_idx" ON "Construction"("structureId");

-- CreateIndex
CREATE INDEX "Construction_constructionTypeId_idx" ON "Construction"("constructionTypeId");

-- CreateIndex
CREATE INDEX "Construction_initiatedByEntityId_idx" ON "Construction"("initiatedByEntityId");

-- CreateIndex
CREATE INDEX "Construction_ItemRequirement_itemId_idx" ON "Construction_ItemRequirement"("itemId");

-- CreateIndex
CREATE INDEX "Structure_CompostDeposit_structureId_idx" ON "Structure_CompostDeposit"("structureId");

-- CreateIndex
CREATE INDEX "Structure_CompostDeposit_convertsAt_idx" ON "Structure_CompostDeposit"("convertsAt");

-- CreateIndex
CREATE INDEX "Location_guildId_idx" ON "Location"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_guildId_name_key" ON "Location"("guildId", "name");

-- CreateIndex
CREATE INDEX "Location_Faction_factionId_idx" ON "Location_Faction"("factionId");

-- CreateIndex
CREATE INDEX "Location_Faction_relationTypeId_idx" ON "Location_Faction"("relationTypeId");

-- CreateIndex
CREATE INDEX "LocationBorder_borderingFactionId_idx" ON "LocationBorder"("borderingFactionId");

-- CreateIndex
CREATE INDEX "Location_Biome_biomeId_idx" ON "Location_Biome"("biomeId");

-- CreateIndex
CREATE INDEX "Location_EnvCondition_envConditionId_idx" ON "Location_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "Camp_guildId_idx" ON "Camp"("guildId");

-- CreateIndex
CREATE INDEX "Camp_locationId_idx" ON "Camp"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Camp_guildId_codeName_key" ON "Camp"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Camp_Faction_factionId_idx" ON "Camp_Faction"("factionId");

-- CreateIndex
CREATE INDEX "Camp_StructureLimit_structureTypeId_idx" ON "Camp_StructureLimit"("structureTypeId");

-- CreateIndex
CREATE INDEX "Action_EntityDailyRecord_entityId_date_idx" ON "Action_EntityDailyRecord"("entityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ActionType_name_key" ON "ActionType"("name");

-- CreateIndex
CREATE INDEX "Guild_ActionConfig_actionTypeId_idx" ON "Guild_ActionConfig"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionType_DisciplineReward_actionTypeId_idx" ON "ActionType_DisciplineReward"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionType_DisciplineReward_disciplineId_idx" ON "ActionType_DisciplineReward"("disciplineId");

-- CreateIndex
CREATE INDEX "ActionType_DefaultItem_itemId_idx" ON "ActionType_DefaultItem"("itemId");

-- CreateIndex
CREATE INDEX "ActionType_DisciplineRequirement_actionTypeId_idx" ON "ActionType_DisciplineRequirement"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionType_DisciplineRequirement_disciplineId_idx" ON "ActionType_DisciplineRequirement"("disciplineId");

-- CreateIndex
CREATE INDEX "ActionType_Step_actionTypeId_idx" ON "ActionType_Step"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionType_Step_defaultStatId_idx" ON "ActionType_Step"("defaultStatId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionType_Step_actionTypeId_codeName_key" ON "ActionType_Step"("actionTypeId", "codeName");

-- CreateIndex
CREATE INDEX "Guild_ActionStep_Config_stepId_idx" ON "Guild_ActionStep_Config"("stepId");

-- CreateIndex
CREATE INDEX "Guild_ActionStep_Config_proficiencyDefId_idx" ON "Guild_ActionStep_Config"("proficiencyDefId");

-- CreateIndex
CREATE INDEX "Guild_ActionStep_Config_statId_idx" ON "Guild_ActionStep_Config"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_ActionStep_codeName_key" ON "Species_ActionStep"("codeName");

-- CreateIndex
CREATE INDEX "Species_ActionStep_defaultStatId_idx" ON "Species_ActionStep"("defaultStatId");

-- CreateIndex
CREATE INDEX "Guild_Species_ActionStep_Config_speciesId_idx" ON "Guild_Species_ActionStep_Config"("speciesId");

-- CreateIndex
CREATE INDEX "Guild_Species_ActionStep_Config_speciesActionStepId_idx" ON "Guild_Species_ActionStep_Config"("speciesActionStepId");

-- CreateIndex
CREATE INDEX "Guild_Species_ActionStep_Config_proficiencyDefId_idx" ON "Guild_Species_ActionStep_Config"("proficiencyDefId");

-- CreateIndex
CREATE INDEX "Guild_Species_ActionStep_Config_statId_idx" ON "Guild_Species_ActionStep_Config"("statId");

-- CreateIndex
CREATE INDEX "Entity_ActionUsage_actionTypeId_idx" ON "Entity_ActionUsage"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionInstance_factionId_idx" ON "ActionInstance"("factionId");

-- CreateIndex
CREATE INDEX "ActionInstance_actionTypeId_idx" ON "ActionInstance"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionInstance_locationId_idx" ON "ActionInstance"("locationId");

-- CreateIndex
CREATE INDEX "ActionInstance_leaderEntityId_idx" ON "ActionInstance"("leaderEntityId");

-- CreateIndex
CREATE INDEX "ActionInstance_Entity_entityId_idx" ON "ActionInstance_Entity"("entityId");

-- CreateIndex
CREATE INDEX "ActionInstance_Entity_DisciplineXp_disciplineId_idx" ON "ActionInstance_Entity_DisciplineXp"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTriggerType_name_key" ON "EventTriggerType"("name");

-- CreateIndex
CREATE INDEX "EventDef_TriggerType_triggerTypeId_idx" ON "EventDef_TriggerType"("triggerTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "EventScope_name_key" ON "EventScope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventStepType_name_key" ON "EventStepType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckType_name_key" ON "EventCheckType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventThresholdType_name_key" ON "EventThresholdType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipantScope_name_key" ON "EventParticipantScope"("name");

-- CreateIndex
CREATE INDEX "EventDef_guildId_idx" ON "EventDef"("guildId");

-- CreateIndex
CREATE INDEX "EventDef_guildId_name_idx" ON "EventDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "EventDef_scopeId_idx" ON "EventDef"("scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDef_guildId_codeName_key" ON "EventDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "EventDef_WeatherTrigger_weatherStateId_idx" ON "EventDef_WeatherTrigger"("weatherStateId");

-- CreateIndex
CREATE INDEX "EventDef_ActionType_actionTypeId_idx" ON "EventDef_ActionType"("actionTypeId");

-- CreateIndex
CREATE INDEX "EventDef_Prerequisite_requiredEventDefId_idx" ON "EventDef_Prerequisite"("requiredEventDefId");

-- CreateIndex
CREATE INDEX "EnvCondition_EventDef_eventDefId_idx" ON "EnvCondition_EventDef"("eventDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_eventDefId_idx" ON "EventStepDef"("eventDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_stepTypeId_idx" ON "EventStepDef"("stepTypeId");

-- CreateIndex
CREATE INDEX "EventStepDef_effectScopeId_idx" ON "EventStepDef"("effectScopeId");

-- CreateIndex
CREATE INDEX "EventStepDef_choiceScopeId_idx" ON "EventStepDef"("choiceScopeId");

-- CreateIndex
CREATE INDEX "EventStepDef_checkTypeId_idx" ON "EventStepDef"("checkTypeId");

-- CreateIndex
CREATE INDEX "EventStepDef_checkParticipantScopeId_idx" ON "EventStepDef"("checkParticipantScopeId");

-- CreateIndex
CREATE INDEX "EventStepDef_checkProficiencyDefId_idx" ON "EventStepDef"("checkProficiencyDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_conditionCheckDefId_idx" ON "EventStepDef"("conditionCheckDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_itemCheckItemId_idx" ON "EventStepDef"("itemCheckItemId");

-- CreateIndex
CREATE INDEX "EventStepDef_itemCheckItemTypeId_idx" ON "EventStepDef"("itemCheckItemTypeId");

-- CreateIndex
CREATE INDEX "EventStepDef_thresholdCheckTypeId_idx" ON "EventStepDef"("thresholdCheckTypeId");

-- CreateIndex
CREATE INDEX "EventStepDef_combatEncounterDefId_idx" ON "EventStepDef"("combatEncounterDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_nextStepId_idx" ON "EventStepDef"("nextStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_passStepId_idx" ON "EventStepDef"("passStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_failStepId_idx" ON "EventStepDef"("failStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_winStepId_idx" ON "EventStepDef"("winStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_loseStepId_idx" ON "EventStepDef"("loseStepId");

-- CreateIndex
CREATE INDEX "EventStepChoice_stepDefId_idx" ON "EventStepChoice"("stepDefId");

-- CreateIndex
CREATE INDEX "EventStepChoice_nextStepId_idx" ON "EventStepChoice"("nextStepId");

-- CreateIndex
CREATE INDEX "EventStepRandomBranch_stepDefId_idx" ON "EventStepRandomBranch"("stepDefId");

-- CreateIndex
CREATE INDEX "EventStepRandomBranch_nextStepId_idx" ON "EventStepRandomBranch"("nextStepId");

-- CreateIndex
CREATE INDEX "EventEffect_effectTypeId_idx" ON "EventEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_stepDefId_idx" ON "EventEffect"("stepDefId");

-- CreateIndex
CREATE INDEX "EventEffect_conditionDefId_idx" ON "EventEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "EventEffect_itemId_idx" ON "EventEffect"("itemId");

-- CreateIndex
CREATE INDEX "EventEffect_itemTypeId_idx" ON "EventEffect"("itemTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_targetScopeId_idx" ON "EventEffect"("targetScopeId");

-- CreateIndex
CREATE INDEX "EventEffect_locationBuffEffectTypeId_idx" ON "EventEffect"("locationBuffEffectTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_statModifierStatId_idx" ON "EventEffect"("statModifierStatId");

-- CreateIndex
CREATE INDEX "EventEffect_proficiencyModifierProficiencyDefId_idx" ON "EventEffect"("proficiencyModifierProficiencyDefId");

-- CreateIndex
CREATE INDEX "EventEffect_disciplineXpDisciplineDefId_idx" ON "EventEffect"("disciplineXpDisciplineDefId");

-- CreateIndex
CREATE INDEX "EventEffect_structureDamageStructureTypeId_idx" ON "EventEffect"("structureDamageStructureTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_dropTableId_idx" ON "EventEffect"("dropTableId");

-- CreateIndex
CREATE INDEX "EventEffect_eventWeightTargetEventDefId_idx" ON "EventEffect"("eventWeightTargetEventDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_actionInstanceId_key" ON "ActiveEvent"("actionInstanceId");

-- CreateIndex
CREATE INDEX "ActiveEvent_guildId_idx" ON "ActiveEvent"("guildId");

-- CreateIndex
CREATE INDEX "ActiveEvent_eventDefId_idx" ON "ActiveEvent"("eventDefId");

-- CreateIndex
CREATE INDEX "ActiveEvent_factionId_idx" ON "ActiveEvent"("factionId");

-- CreateIndex
CREATE INDEX "ActiveEvent_campId_idx" ON "ActiveEvent"("campId");

-- CreateIndex
CREATE INDEX "ActiveEvent_currentStepId_idx" ON "ActiveEvent"("currentStepId");

-- CreateIndex
CREATE INDEX "ActiveEvent_Participant_activeEventId_idx" ON "ActiveEvent_Participant"("activeEventId");

-- CreateIndex
CREATE INDEX "ActiveEvent_Participant_entityId_idx" ON "ActiveEvent_Participant"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_Participant_activeEventId_userId_key" ON "ActiveEvent_Participant"("activeEventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_Participant_activeEventId_entityId_key" ON "ActiveEvent_Participant"("activeEventId", "entityId");

-- CreateIndex
CREATE INDEX "EventStepVote_activeEventId_stepDefId_idx" ON "EventStepVote"("activeEventId", "stepDefId");

-- CreateIndex
CREATE INDEX "EventStepVote_entityId_idx" ON "EventStepVote"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EventStepVote_activeEventId_stepDefId_entityId_key" ON "EventStepVote"("activeEventId", "stepDefId", "entityId");

-- CreateIndex
CREATE INDEX "EventWeightModifier_targetEventDefId_idx" ON "EventWeightModifier"("targetEventDefId");

-- CreateIndex
CREATE INDEX "EventWeightModifier_sourceActiveEventId_idx" ON "EventWeightModifier"("sourceActiveEventId");

-- CreateIndex
CREATE INDEX "EventDef_Location_locationId_idx" ON "EventDef_Location"("locationId");

-- CreateIndex
CREATE INDEX "EventCooldown_guildId_eventDefId_idx" ON "EventCooldown"("guildId", "eventDefId");

-- CreateIndex
CREATE INDEX "EventCooldown_factionId_idx" ON "EventCooldown"("factionId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCooldown_guildId_eventDefId_factionId_key" ON "EventCooldown"("guildId", "eventDefId", "factionId");

-- CreateIndex
CREATE INDEX "EventUnresolvedState_eventDefId_idx" ON "EventUnresolvedState"("eventDefId");

-- CreateIndex
CREATE INDEX "EventUnresolvedState_factionId_idx" ON "EventUnresolvedState"("factionId");

-- CreateIndex
CREATE UNIQUE INDEX "EventUnresolvedState_eventDefId_factionId_key" ON "EventUnresolvedState"("eventDefId", "factionId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatInitiationType_name_key" ON "CombatInitiationType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CombatOutcome_name_key" ON "CombatOutcome"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CombatEffectType_name_key" ON "CombatEffectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CombatActionCategory_name_key" ON "CombatActionCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CombatTargetStrategy_name_key" ON "CombatTargetStrategy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DamageCategory_name_key" ON "DamageCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DamageType_codeName_key" ON "DamageType"("codeName");

-- CreateIndex
CREATE UNIQUE INDEX "DamageType_name_key" ON "DamageType"("name");

-- CreateIndex
CREATE INDEX "DamageType_categoryId_idx" ON "DamageType"("categoryId");

-- CreateIndex
CREATE INDEX "SpeciesCombatBehavior_offensiveTargetStrategyId_idx" ON "SpeciesCombatBehavior"("offensiveTargetStrategyId");

-- CreateIndex
CREATE INDEX "SpeciesCombatBehavior_supportTargetStrategyId_idx" ON "SpeciesCombatBehavior"("supportTargetStrategyId");

-- CreateIndex
CREATE INDEX "SpeciesDefaultLoadout_speciesId_idx" ON "SpeciesDefaultLoadout"("speciesId");

-- CreateIndex
CREATE INDEX "SpeciesDefaultLoadout_itemId_idx" ON "SpeciesDefaultLoadout"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesDefaultLoadout_speciesId_itemId_key" ON "SpeciesDefaultLoadout"("speciesId", "itemId");

-- CreateIndex
CREATE INDEX "ActiveCombat_guildId_idx" ON "ActiveCombat"("guildId");

-- CreateIndex
CREATE INDEX "ActiveCombat_activeEventId_idx" ON "ActiveCombat"("activeEventId");

-- CreateIndex
CREATE INDEX "ActiveCombat_combatEncounterDefId_idx" ON "ActiveCombat"("combatEncounterDefId");

-- CreateIndex
CREATE INDEX "ActiveCombat_initiationTypeId_idx" ON "ActiveCombat"("initiationTypeId");

-- CreateIndex
CREATE INDEX "ActiveCombat_outcomeId_idx" ON "ActiveCombat"("outcomeId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Participant_activeCombatId_idx" ON "ActiveCombat_Participant"("activeCombatId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Participant_dropTableId_idx" ON "ActiveCombat_Participant"("dropTableId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCombat_Participant_activeCombatId_entityId_key" ON "ActiveCombat_Participant"("activeCombatId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCombat_Participant_activeCombatId_turnOrder_key" ON "ActiveCombat_Participant"("activeCombatId", "turnOrder");

-- CreateIndex
CREATE INDEX "ActiveCombat_Participant_ActionCooldown_participantId_idx" ON "ActiveCombat_Participant_ActionCooldown"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCombat_Participant_ActionCooldown_participantId_equip_key" ON "ActiveCombat_Participant_ActionCooldown"("participantId", "equipmentProfileId");

-- CreateIndex
CREATE INDEX "ActiveCombat_BehaviorEffect_activeCombatId_idx" ON "ActiveCombat_BehaviorEffect"("activeCombatId");

-- CreateIndex
CREATE INDEX "ActiveCombat_BehaviorEffect_effectTypeId_idx" ON "ActiveCombat_BehaviorEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "ActiveCombat_BehaviorEffect_affectedParticipantId_idx" ON "ActiveCombat_BehaviorEffect"("affectedParticipantId");

-- CreateIndex
CREATE INDEX "ActiveCombat_BehaviorEffect_linkedParticipantId_idx" ON "ActiveCombat_BehaviorEffect"("linkedParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCombat_BehaviorEffect_affectedParticipantId_effectTyp_key" ON "ActiveCombat_BehaviorEffect"("affectedParticipantId", "effectTypeId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Action_activeCombatId_roundNumber_idx" ON "ActiveCombat_Action"("activeCombatId", "roundNumber");

-- CreateIndex
CREATE INDEX "ActiveCombat_Action_actionCategoryId_idx" ON "ActiveCombat_Action"("actionCategoryId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Action_equipmentProfileId_idx" ON "ActiveCombat_Action"("equipmentProfileId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Action_actorEntityId_idx" ON "ActiveCombat_Action"("actorEntityId");

-- CreateIndex
CREATE INDEX "ActiveCombat_Action_targetEntityId_idx" ON "ActiveCombat_Action"("targetEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCombat_Action_activeCombatId_roundNumber_turnIndex_key" ON "ActiveCombat_Action"("activeCombatId", "roundNumber", "turnIndex");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_guildId_idx" ON "CombatEncounterDef"("guildId");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_guildId_name_idx" ON "CombatEncounterDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_speciesId_idx" ON "CombatEncounterDef"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatEncounterDef_guildId_codeName_key" ON "CombatEncounterDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_NamedEntity_entityId_idx" ON "CombatEncounterDef_NamedEntity"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatRollType_name_key" ON "CombatRollType"("name");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_guildId_idx" ON "CombatStatEffectDef"("guildId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_stackBehaviorId_idx" ON "CombatStatEffectDef"("stackBehaviorId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatStatEffectDef_guildId_codeName_key" ON "CombatStatEffectDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_StatMod_effectDefId_idx" ON "CombatStatEffectDef_StatMod"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_StatMod_statId_idx" ON "CombatStatEffectDef_StatMod"("statId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_RollMod_effectDefId_idx" ON "CombatStatEffectDef_RollMod"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_RollMod_rollTypeId_idx" ON "CombatStatEffectDef_RollMod"("rollTypeId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_AcMod_effectDefId_idx" ON "CombatStatEffectDef_AcMod"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_DamageOverTime_effectDefId_idx" ON "CombatStatEffectDef_DamageOverTime"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_DamageOverTime_damageTypeId_idx" ON "CombatStatEffectDef_DamageOverTime"("damageTypeId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_HealOverTime_effectDefId_idx" ON "CombatStatEffectDef_HealOverTime"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_DamageModifier_effectDefId_idx" ON "CombatStatEffectDef_DamageModifier"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_DamageModifier_damageTypeId_idx" ON "CombatStatEffectDef_DamageModifier"("damageTypeId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_RollAdvantage_effectDefId_idx" ON "CombatStatEffectDef_RollAdvantage"("effectDefId");

-- CreateIndex
CREATE INDEX "CombatStatEffectDef_RollAdvantage_rollTypeId_idx" ON "CombatStatEffectDef_RollAdvantage"("rollTypeId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_activeCombatId_idx" ON "ActiveCombat_StatEffect"("activeCombatId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_affectedParticipantId_idx" ON "ActiveCombat_StatEffect"("affectedParticipantId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_effectDefId_idx" ON "ActiveCombat_StatEffect"("effectDefId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_sourceParticipantId_idx" ON "ActiveCombat_StatEffect"("sourceParticipantId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_appliedByActionId_idx" ON "ActiveCombat_StatEffect"("appliedByActionId");

-- CreateIndex
CREATE INDEX "ActiveCombat_StatEffect_sourceEntityConditionId_idx" ON "ActiveCombat_StatEffect"("sourceEntityConditionId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_StatEffect_equipmentProfileId_idx" ON "ItemEquipmentProfile_StatEffect"("equipmentProfileId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_StatEffect_effectDefId_idx" ON "ItemEquipmentProfile_StatEffect"("effectDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatStatEffect_conditionDefId_idx" ON "ConditionDef_CombatStatEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatStatEffect_effectDefId_idx" ON "ConditionDef_CombatStatEffect"("effectDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_CombatStatEffect_conditionDefId_effectDefId_key" ON "ConditionDef_CombatStatEffect"("conditionDefId", "effectDefId");

-- CreateIndex
CREATE INDEX "AbilityDef_StatEffect_abilityDefId_idx" ON "AbilityDef_StatEffect"("abilityDefId");

-- CreateIndex
CREATE INDEX "AbilityDef_StatEffect_effectDefId_idx" ON "AbilityDef_StatEffect"("effectDefId");

-- CreateIndex
CREATE UNIQUE INDEX "AbilityDef_StatEffect_abilityDefId_effectDefId_key" ON "AbilityDef_StatEffect"("abilityDefId", "effectDefId");

-- CreateIndex
CREATE INDEX "Entity_PreCombatEffect_entityId_idx" ON "Entity_PreCombatEffect"("entityId");

-- CreateIndex
CREATE INDEX "Entity_PreCombatEffect_expiresAt_idx" ON "Entity_PreCombatEffect"("expiresAt");

-- CreateIndex
CREATE INDEX "Entity_PreCombatEffect_effectDefId_idx" ON "Entity_PreCombatEffect"("effectDefId");

-- CreateIndex
CREATE INDEX "Entity_PreCombatEffect_equipmentProfileId_idx" ON "Entity_PreCombatEffect"("equipmentProfileId");

-- CreateIndex
CREATE INDEX "Entity_PreCombatEffect_abilityDefId_idx" ON "Entity_PreCombatEffect"("abilityDefId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantType_name_key" ON "PlantType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlantTrait_codeName_key" ON "PlantTrait"("codeName");

-- CreateIndex
CREATE INDEX "PlantDef_guildId_idx" ON "PlantDef"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantDef_guildId_codeName_key" ON "PlantDef"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "PlantDef_PlantType_plantTypeId_idx" ON "PlantDef_PlantType"("plantTypeId");

-- CreateIndex
CREATE INDEX "PlantType_EnvConditionEffect_plantTypeId_idx" ON "PlantType_EnvConditionEffect"("plantTypeId");

-- CreateIndex
CREATE INDEX "PlantType_EnvConditionEffect_envConditionId_idx" ON "PlantType_EnvConditionEffect"("envConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantType_EnvConditionEffect_plantTypeId_envConditionId_rel_key" ON "PlantType_EnvConditionEffect"("plantTypeId", "envConditionId", "relationTypeId", "effectTypeId");

-- CreateIndex
CREATE INDEX "PlantDef_EnvConditionEffect_plantDefId_idx" ON "PlantDef_EnvConditionEffect"("plantDefId");

-- CreateIndex
CREATE INDEX "PlantDef_EnvConditionEffect_envConditionId_idx" ON "PlantDef_EnvConditionEffect"("envConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantDef_EnvConditionEffect_plantDefId_envConditionId_relat_key" ON "PlantDef_EnvConditionEffect"("plantDefId", "envConditionId", "relationTypeId", "effectTypeId");

-- CreateIndex
CREATE INDEX "PlotType_guildId_idx" ON "PlotType"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "PlotType_guildId_name_key" ON "PlotType"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_Buff_plotId_sourceEntityId_effectTypeId_key" ON "Plot_Buff"("plotId", "sourceEntityId", "effectTypeId");

-- CreateIndex
CREATE INDEX "Location_Effect_locationId_effectTypeId_idx" ON "Location_Effect"("locationId", "effectTypeId");

-- CreateIndex
CREATE INDEX "Location_Effect_sourceActiveEventId_idx" ON "Location_Effect"("sourceActiveEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_Effect_locationId_sourceEntityId_sourceActiveEvent_key" ON "Location_Effect"("locationId", "sourceEntityId", "sourceActiveEventId", "effectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlotCrop_plotId_key" ON "PlotCrop"("plotId");

-- CreateIndex
CREATE INDEX "EntityInspectionLog_patientEntityId_idx" ON "EntityInspectionLog"("patientEntityId");

-- CreateIndex
CREATE INDEX "EntityInspectionLog_medicEntityId_idx" ON "EntityInspectionLog"("medicEntityId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_entityConditionId_idx" ON "EntityTreatmentLog"("entityConditionId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_medicEntityId_idx" ON "EntityTreatmentLog"("medicEntityId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_itemId_idx" ON "EntityTreatmentLog"("itemId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_currentPatternId_fkey" FOREIGN KEY ("currentPatternId") REFERENCES "WeatherPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_currentPatternStepId_fkey" FOREIGN KEY ("currentPatternStepId") REFERENCES "WeatherPatternStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom_FlavorText" ADD CONSTRAINT "Symptom_FlavorText_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "Symptom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom_FlavorText" ADD CONSTRAINT "Symptom_FlavorText_flavorTextId_fkey" FOREIGN KEY ("flavorTextId") REFERENCES "SymptomFlavorText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTable_Entry" ADD CONSTRAINT "DropTable_Entry_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTable_Entry" ADD CONSTRAINT "DropTable_Entry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientType" ADD CONSTRAINT "IngredientType_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherState_EnvCondition" ADD CONSTRAINT "WeatherState_EnvCondition_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherState_EnvCondition" ADD CONSTRAINT "WeatherState_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherPatternStep" ADD CONSTRAINT "WeatherPatternStep_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "WeatherPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherPatternStep" ADD CONSTRAINT "WeatherPatternStep_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season_WeatherPattern" ADD CONSTRAINT "Season_WeatherPattern_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season_WeatherPattern" ADD CONSTRAINT "Season_WeatherPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "WeatherPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSeason_DefaultWeather" ADD CONSTRAINT "GuildSeason_DefaultWeather_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSeason_DefaultWeather" ADD CONSTRAINT "GuildSeason_DefaultWeather_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSeason_DefaultWeather" ADD CONSTRAINT "GuildSeason_DefaultWeather_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_WeatherPatternCooldown" ADD CONSTRAINT "Guild_WeatherPatternCooldown_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_WeatherPatternCooldown" ADD CONSTRAINT "Guild_WeatherPatternCooldown_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "WeatherPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_StatModifier" ADD CONSTRAINT "EnvCondition_StatModifier_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_StatModifier" ADD CONSTRAINT "EnvCondition_StatModifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_StatModifier" ADD CONSTRAINT "EnvCondition_StatModifier_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_ProficiencyModifier" ADD CONSTRAINT "EnvCondition_ProficiencyModifier_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_ProficiencyModifier" ADD CONSTRAINT "EnvCondition_ProficiencyModifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_ProficiencyModifier" ADD CONSTRAINT "EnvCondition_ProficiencyModifier_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biome_EnvCondition" ADD CONSTRAINT "Biome_EnvCondition_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biome_EnvCondition" ADD CONSTRAINT "Biome_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_BiomeDrop" ADD CONSTRAINT "Guild_BiomeDrop_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_BiomeDrop" ADD CONSTRAINT "Guild_BiomeDrop_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EquipmentLoadout" ADD CONSTRAINT "Species_EquipmentLoadout_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EquipmentLoadout" ADD CONSTRAINT "Species_EquipmentLoadout_slotTypeId_fkey" FOREIGN KEY ("slotTypeId") REFERENCES "EquipmentSlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_SpeciesType" ADD CONSTRAINT "Species_SpeciesType_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_SpeciesType" ADD CONSTRAINT "Species_SpeciesType_speciesTypeId_fkey" FOREIGN KEY ("speciesTypeId") REFERENCES "SpeciesType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_Biome" ADD CONSTRAINT "Species_Biome_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_Biome" ADD CONSTRAINT "Species_Biome_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesType_EnvConditionEffect" ADD CONSTRAINT "SpeciesType_EnvConditionEffect_speciesTypeId_fkey" FOREIGN KEY ("speciesTypeId") REFERENCES "SpeciesType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesType_EnvConditionEffect" ADD CONSTRAINT "SpeciesType_EnvConditionEffect_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesType_EnvConditionEffect" ADD CONSTRAINT "SpeciesType_EnvConditionEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesType_EnvConditionEffect" ADD CONSTRAINT "SpeciesType_EnvConditionEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EnvConditionEffect" ADD CONSTRAINT "Species_EnvConditionEffect_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EnvConditionEffect" ADD CONSTRAINT "Species_EnvConditionEffect_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EnvConditionEffect" ADD CONSTRAINT "Species_EnvConditionEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EnvConditionEffect" ADD CONSTRAINT "Species_EnvConditionEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyPart" ADD CONSTRAINT "BodyPart_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "EntityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_sexId_fkey" FOREIGN KEY ("sexId") REFERENCES "Sex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityStats" ADD CONSTRAINT "EntityStats_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityBehaviorCounter" ADD CONSTRAINT "EntityBehaviorCounter_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityImage" ADD CONSTRAINT "EntityImage_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityBio" ADD CONSTRAINT "EntityBio_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_sourceActiveEventId_fkey" FOREIGN KEY ("sourceActiveEventId") REFERENCES "ActiveEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_linkedConditionId_fkey" FOREIGN KEY ("linkedConditionId") REFERENCES "EntityCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_bodyPartId_fkey" FOREIGN KEY ("bodyPartId") REFERENCES "BodyPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_appliedInCombatId_fkey" FOREIGN KEY ("appliedInCombatId") REFERENCES "ActiveCombat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_appliedByActionId_fkey" FOREIGN KEY ("appliedByActionId") REFERENCES "ActiveCombat_Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_relationshipTypeId_fkey" FOREIGN KEY ("relationshipTypeId") REFERENCES "RelationshipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionStanding" ADD CONSTRAINT "FactionStanding_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionStanding" ADD CONSTRAINT "FactionStanding_targetFactionId_fkey" FOREIGN KEY ("targetFactionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionStanding" ADD CONSTRAINT "FactionStanding_standingTypeId_fkey" FOREIGN KEY ("standingTypeId") REFERENCES "FactionStandingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_Faction" ADD CONSTRAINT "Rank_Faction_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_Faction" ADD CONSTRAINT "Rank_Faction_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_DefaultItem" ADD CONSTRAINT "Rank_DefaultItem_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_DefaultItem" ADD CONSTRAINT "Rank_DefaultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProficiencyDef" ADD CONSTRAINT "ProficiencyDef_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Proficiency" ADD CONSTRAINT "Entity_Proficiency_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Proficiency" ADD CONSTRAINT "Entity_Proficiency_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_DisciplineLevelCap" ADD CONSTRAINT "Guild_DisciplineLevelCap_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_DisciplineLevelCap" ADD CONSTRAINT "Guild_DisciplineLevelCap_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Discipline" ADD CONSTRAINT "Entity_Discipline_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Discipline" ADD CONSTRAINT "Entity_Discipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode" ADD CONSTRAINT "SkillTreeNode_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode" ADD CONSTRAINT "SkillTreeNode_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode_DisciplineRequirement" ADD CONSTRAINT "SkillTreeNode_DisciplineRequirement_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode_DisciplineRequirement" ADD CONSTRAINT "SkillTreeNode_DisciplineRequirement_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode_Relation" ADD CONSTRAINT "SkillTreeNode_Relation_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode_Relation" ADD CONSTRAINT "SkillTreeNode_Relation_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTreeNode_Relation" ADD CONSTRAINT "SkillTreeNode_Relation_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_SkillTreeNode" ADD CONSTRAINT "Entity_SkillTreeNode_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_SkillTreeNode" ADD CONSTRAINT "Entity_SkillTreeNode_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Ability" ADD CONSTRAINT "Entity_Ability_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Ability" ADD CONSTRAINT "Entity_Ability_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_DefaultAbility" ADD CONSTRAINT "Species_DefaultAbility_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_DefaultAbility" ADD CONSTRAINT "Species_DefaultAbility_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_StatModifier" ADD CONSTRAINT "Ability_StatModifier_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_StatModifier" ADD CONSTRAINT "Ability_StatModifier_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_StatModifier" ADD CONSTRAINT "Ability_StatModifier_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_StatModifier" ADD CONSTRAINT "Ability_StatModifier_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ProficiencyModifier" ADD CONSTRAINT "Ability_ProficiencyModifier_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ProficiencyModifier" ADD CONSTRAINT "Ability_ProficiencyModifier_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ProficiencyModifier" ADD CONSTRAINT "Ability_ProficiencyModifier_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ProficiencyModifier" ADD CONSTRAINT "Ability_ProficiencyModifier_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_MultiplierEffect" ADD CONSTRAINT "Ability_MultiplierEffect_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_MultiplierEffect" ADD CONSTRAINT "Ability_MultiplierEffect_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_MultiplierEffect" ADD CONSTRAINT "Ability_MultiplierEffect_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_MultiplierEffect" ADD CONSTRAINT "Ability_MultiplierEffect_targetTypeId_fkey" FOREIGN KEY ("targetTypeId") REFERENCES "TargetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_GrantedAction" ADD CONSTRAINT "Ability_GrantedAction_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_GrantedAction" ADD CONSTRAINT "Ability_GrantedAction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_CombatBehavior" ADD CONSTRAINT "Ability_CombatBehavior_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_CombatBehavior" ADD CONSTRAINT "Ability_CombatBehavior_behaviorTypeId_fkey" FOREIGN KEY ("behaviorTypeId") REFERENCES "ConditionBehaviorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_CombatBehavior" ADD CONSTRAINT "Ability_CombatBehavior_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ItemActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_CombatBehavior" ADD CONSTRAINT "Ability_CombatBehavior_redirectTargetId_fkey" FOREIGN KEY ("redirectTargetId") REFERENCES "BehaviorRedirectTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_CombatBehavior" ADD CONSTRAINT "Ability_CombatBehavior_restrictActionTypeId_fkey" FOREIGN KEY ("restrictActionTypeId") REFERENCES "ItemActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ConditionResistance" ADD CONSTRAINT "Ability_ConditionResistance_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ConditionResistance" ADD CONSTRAINT "Ability_ConditionResistance_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ConditionResistance" ADD CONSTRAINT "Ability_ConditionResistance_conditionTypeId_fkey" FOREIGN KEY ("conditionTypeId") REFERENCES "ConditionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_DamageModifier" ADD CONSTRAINT "Ability_DamageModifier_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_DamageModifier" ADD CONSTRAINT "Ability_DamageModifier_damageTypeId_fkey" FOREIGN KEY ("damageTypeId") REFERENCES "DamageType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_triggerSystemType_fkey" FOREIGN KEY ("triggerSystemType") REFERENCES "ActionSystemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_abilityEffectTypeId_fkey" FOREIGN KEY ("abilityEffectTypeId") REFERENCES "AbilityEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_targetScopeId_fkey" FOREIGN KEY ("targetScopeId") REFERENCES "TargetScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_triggerOnId_fkey" FOREIGN KEY ("triggerOnId") REFERENCES "TriggerTiming"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_stackBehaviorId_fkey" FOREIGN KEY ("stackBehaviorId") REFERENCES "StackBehavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ActionTrigger" ADD CONSTRAINT "Ability_ActionTrigger_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ThresholdTrigger" ADD CONSTRAINT "Ability_ThresholdTrigger_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ThresholdTrigger" ADD CONSTRAINT "Ability_ThresholdTrigger_thresholdTypeId_fkey" FOREIGN KEY ("thresholdTypeId") REFERENCES "AbilityThresholdType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ThresholdTrigger" ADD CONSTRAINT "Ability_ThresholdTrigger_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_ThresholdTrigger" ADD CONSTRAINT "Ability_ThresholdTrigger_stackBehaviorId_fkey" FOREIGN KEY ("stackBehaviorId") REFERENCES "StackBehavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_presenceScopeId_fkey" FOREIGN KEY ("presenceScopeId") REFERENCES "TargetScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_abilityEffectTypeId_fkey" FOREIGN KEY ("abilityEffectTypeId") REFERENCES "AbilityEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_stackBehaviorId_fkey" FOREIGN KEY ("stackBehaviorId") REFERENCES "StackBehavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_multiplierTargetTypeId_fkey" FOREIGN KEY ("multiplierTargetTypeId") REFERENCES "TargetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability_PresenceEffect" ADD CONSTRAINT "Ability_PresenceEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef" ADD CONSTRAINT "ConditionDef_conditionTypeId_fkey" FOREIGN KEY ("conditionTypeId") REFERENCES "ConditionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef" ADD CONSTRAINT "ConditionDef_conditionContextId_fkey" FOREIGN KEY ("conditionContextId") REFERENCES "ConditionContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_DamageModifier" ADD CONSTRAINT "ConditionDef_DamageModifier_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_DamageModifier" ADD CONSTRAINT "ConditionDef_DamageModifier_damageTypeId_fkey" FOREIGN KEY ("damageTypeId") REFERENCES "DamageType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_EnvRule" ADD CONSTRAINT "ConditionDef_EnvRule_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_EnvRule" ADD CONSTRAINT "ConditionDef_EnvRule_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_EnvRule" ADD CONSTRAINT "ConditionDef_EnvRule_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_StatEffect" ADD CONSTRAINT "ConditionDef_StatEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_StatEffect" ADD CONSTRAINT "ConditionDef_StatEffect_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_ProficiencyEffect" ADD CONSTRAINT "ConditionDef_ProficiencyEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_ProficiencyEffect" ADD CONSTRAINT "ConditionDef_ProficiencyEffect_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "CombatEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_parentConditionId_fkey" FOREIGN KEY ("parentConditionId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_childConditionId_fkey" FOREIGN KEY ("childConditionId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SymptomTag" ADD CONSTRAINT "ConditionDef_SymptomTag_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SymptomTag" ADD CONSTRAINT "ConditionDef_SymptomTag_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "Symptom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_GrantedItem" ADD CONSTRAINT "ConditionDef_GrantedItem_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_GrantedItem" ADD CONSTRAINT "ConditionDef_GrantedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionBehaviorEffect" ADD CONSTRAINT "ConditionBehaviorEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionBehaviorEffect" ADD CONSTRAINT "ConditionBehaviorEffect_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ItemActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionBehaviorEffect" ADD CONSTRAINT "ConditionBehaviorEffect_behaviorTypeId_fkey" FOREIGN KEY ("behaviorTypeId") REFERENCES "ConditionBehaviorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionBehaviorEffect" ADD CONSTRAINT "ConditionBehaviorEffect_redirectTargetId_fkey" FOREIGN KEY ("redirectTargetId") REFERENCES "BehaviorRedirectTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionBehaviorEffect" ADD CONSTRAINT "ConditionBehaviorEffect_restrictActionTypeId_fkey" FOREIGN KEY ("restrictActionTypeId") REFERENCES "ItemActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemWarning" ADD CONSTRAINT "ItemWarning_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemWarning" ADD CONSTRAINT "ItemWarning_triggeredByInteractionId_fkey" FOREIGN KEY ("triggeredByInteractionId") REFERENCES "ItemInteraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Warning" ADD CONSTRAINT "Item_Warning_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Warning" ADD CONSTRAINT "Item_Warning_warningId_fkey" FOREIGN KEY ("warningId") REFERENCES "ItemWarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_damageTypeId_fkey" FOREIGN KEY ("damageTypeId") REFERENCES "DamageType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_elementalDamageTypeId_fkey" FOREIGN KEY ("elementalDamageTypeId") REFERENCES "DamageType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_slotTypeId_fkey" FOREIGN KEY ("slotTypeId") REFERENCES "EquipmentSlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_actionCategoryId_fkey" FOREIGN KEY ("actionCategoryId") REFERENCES "CombatActionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ItemActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_targetScopeId_fkey" FOREIGN KEY ("targetScopeId") REFERENCES "CombatTargetScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_behaviorEffectTypeId_fkey" FOREIGN KEY ("behaviorEffectTypeId") REFERENCES "CombatEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_hitStatId_fkey" FOREIGN KEY ("hitStatId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_damageStatId_fkey" FOREIGN KEY ("damageStatId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_healStatId_fkey" FOREIGN KEY ("healStatId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_triggersEventDefId_fkey" FOREIGN KEY ("triggersEventDefId") REFERENCES "EventDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_summonSpeciesId_fkey" FOREIGN KEY ("summonSpeciesId") REFERENCES "Species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_sourceProficiencyId_fkey" FOREIGN KEY ("sourceProficiencyId") REFERENCES "ProficiencyDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_linkedProfileConditionId_fkey" FOREIGN KEY ("linkedProfileConditionId") REFERENCES "ItemEquipmentProfile_Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_RequiredItem" ADD CONSTRAINT "ItemEquipmentProfile_RequiredItem_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_RequiredItem" ADD CONSTRAINT "ItemEquipmentProfile_RequiredItem_requiredItemId_fkey" FOREIGN KEY ("requiredItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction" ADD CONSTRAINT "ItemAction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction" ADD CONSTRAINT "ItemAction_itemInteractionId_fkey" FOREIGN KEY ("itemInteractionId") REFERENCES "ItemInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction_Output" ADD CONSTRAINT "ItemAction_Output_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction_Output" ADD CONSTRAINT "ItemAction_Output_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "Symptom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_outputConditionDefId_fkey" FOREIGN KEY ("outputConditionDefId") REFERENCES "ConditionDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFoodProfile" ADD CONSTRAINT "ItemFoodProfile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Type" ADD CONSTRAINT "Item_Type_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Type" ADD CONSTRAINT "Item_Type_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_CompostOutput" ADD CONSTRAINT "Item_CompostOutput_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_CompostOutput" ADD CONSTRAINT "Item_CompostOutput_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_CompostOutput" ADD CONSTRAINT "Item_CompostOutput_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_CompostOutput" ADD CONSTRAINT "Item_CompostOutput_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionConfig" ADD CONSTRAINT "Guild_CraftingInteractionConfig_craftingInteractionId_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_craftingInteractionId_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_DiscoveredRecipe" ADD CONSTRAINT "Entity_DiscoveredRecipe_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_DiscoveredRecipe" ADD CONSTRAINT "Entity_DiscoveredRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_craftingInteractionId_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_CraftingInteractionRule" ADD CONSTRAINT "Guild_CraftingInteractionRule_skillTreeNodeId_fkey" FOREIGN KEY ("skillTreeNodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_DisciplineReward" ADD CONSTRAINT "Recipe_DisciplineReward_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_DisciplineReward" ADD CONSTRAINT "Recipe_DisciplineReward_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe_CraftingRequirement" ADD CONSTRAINT "Recipe_CraftingRequirement_skillTreeNodeId_fkey" FOREIGN KEY ("skillTreeNodeId") REFERENCES "SkillTreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlot" ADD CONSTRAINT "RecipeSlot_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlot" ADD CONSTRAINT "RecipeSlot_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption" ADD CONSTRAINT "RecipeSlotOption_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "RecipeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption" ADD CONSTRAINT "RecipeSlotOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption_RequiredTag" ADD CONSTRAINT "RecipeSlotOption_RequiredTag_slotOptionId_fkey" FOREIGN KEY ("slotOptionId") REFERENCES "RecipeSlotOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption_RequiredTag" ADD CONSTRAINT "RecipeSlotOption_RequiredTag_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption_ExcludedTag" ADD CONSTRAINT "RecipeSlotOption_ExcludedTag_slotOptionId_fkey" FOREIGN KEY ("slotOptionId") REFERENCES "RecipeSlotOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSlotOption_ExcludedTag" ADD CONSTRAINT "RecipeSlotOption_ExcludedTag_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput" ADD CONSTRAINT "RecipeOutput_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput" ADD CONSTRAINT "RecipeOutput_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput" ADD CONSTRAINT "RecipeOutput_outputModeId_fkey" FOREIGN KEY ("outputModeId") REFERENCES "RecipeOutputMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput" ADD CONSTRAINT "RecipeOutput_outputMeasurementTypeId_fkey" FOREIGN KEY ("outputMeasurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput_AddTag" ADD CONSTRAINT "RecipeOutput_AddTag_recipeOutputId_fkey" FOREIGN KEY ("recipeOutputId") REFERENCES "RecipeOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput_AddTag" ADD CONSTRAINT "RecipeOutput_AddTag_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput_RemoveTag" ADD CONSTRAINT "RecipeOutput_RemoveTag_recipeOutputId_fkey" FOREIGN KEY ("recipeOutputId") REFERENCES "RecipeOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput_RemoveTag" ADD CONSTRAINT "RecipeOutput_RemoveTag_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOutput_FoodOverride" ADD CONSTRAINT "RecipeOutput_FoodOverride_recipeOutputId_fkey" FOREIGN KEY ("recipeOutputId") REFERENCES "RecipeOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_IngredientType" ADD CONSTRAINT "Item_IngredientType_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_IngredientType" ADD CONSTRAINT "Item_IngredientType_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Storage" ADD CONSTRAINT "Entity_Storage_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Storage" ADD CONSTRAINT "Entity_Storage_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Housing" ADD CONSTRAINT "Entity_Housing_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Housing" ADD CONSTRAINT "Entity_Housing_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_WorkAssignment" ADD CONSTRAINT "Entity_WorkAssignment_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_WorkAssignment" ADD CONSTRAINT "Entity_WorkAssignment_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_Storage" ADD CONSTRAINT "Structure_Storage_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_Storage" ADD CONSTRAINT "Structure_Storage_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_Storage_ItemType" ADD CONSTRAINT "Structure_Storage_ItemType_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Structure_Storage"("storageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_Storage_ItemType" ADD CONSTRAINT "Structure_Storage_ItemType_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_chosenProfileId_fkey" FOREIGN KEY ("chosenProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_StructureType" ADD CONSTRAINT "StructureDef_StructureType_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_StructureType" ADD CONSTRAINT "StructureDef_StructureType_structureTypeId_fkey" FOREIGN KEY ("structureTypeId") REFERENCES "StructureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CampRequirement" ADD CONSTRAINT "StructureDef_CampRequirement_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CampRequirement" ADD CONSTRAINT "StructureDef_CampRequirement_requiredStructureTypeId_fkey" FOREIGN KEY ("requiredStructureTypeId") REFERENCES "StructureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Relation" ADD CONSTRAINT "StructureDef_Relation_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Relation" ADD CONSTRAINT "StructureDef_Relation_targetStructureDefId_fkey" FOREIGN KEY ("targetStructureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Relation" ADD CONSTRAINT "StructureDef_Relation_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_BuildCost" ADD CONSTRAINT "StructureDef_BuildCost_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_BuildCost" ADD CONSTRAINT "StructureDef_BuildCost_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_StorageConfig" ADD CONSTRAINT "StructureDef_StorageConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_HousingConfig" ADD CONSTRAINT "StructureDef_HousingConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_MedicalConfig" ADD CONSTRAINT "StructureDef_MedicalConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FarmingConfig" ADD CONSTRAINT "StructureDef_FarmingConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FarmingConfig" ADD CONSTRAINT "StructureDef_FarmingConfig_plotTypeId_fkey" FOREIGN KEY ("plotTypeId") REFERENCES "PlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CraftingConfig" ADD CONSTRAINT "StructureDef_CraftingConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CraftingConfig_Interaction" ADD CONSTRAINT "StructureDef_CraftingConfig_Interaction_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef_CraftingConfig"("structureDefId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CraftingConfig_Interaction" ADD CONSTRAINT "StructureDef_CraftingConfig_Interaction_craftingInteractio_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_CraftingInteraction" ADD CONSTRAINT "StructureDef_Upgrade_CraftingInteraction_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_CraftingInteraction" ADD CONSTRAINT "StructureDef_Upgrade_CraftingInteraction_craftingInteracti_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_CompostConfig" ADD CONSTRAINT "StructureDef_CompostConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionConfig" ADD CONSTRAINT "StructureDef_ProductionConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionConfig_EnvCondition" ADD CONSTRAINT "StructureDef_ProductionConfig_EnvCondition_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionConfig_EnvCondition" ADD CONSTRAINT "StructureDef_ProductionConfig_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_WorkSlotConfig" ADD CONSTRAINT "StructureDef_WorkSlotConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_WorkSlotConfig" ADD CONSTRAINT "StructureDef_WorkSlotConfig_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_WorkSlotConfig_Requirement" ADD CONSTRAINT "StructureDef_WorkSlotConfig_Requirement_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_WorkSlotConfig_Requirement" ADD CONSTRAINT "StructureDef_WorkSlotConfig_Requirement_disciplineDefId_fkey" FOREIGN KEY ("disciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionInput" ADD CONSTRAINT "StructureDef_ProductionInput_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionInput" ADD CONSTRAINT "StructureDef_ProductionInput_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionOutput" ADD CONSTRAINT "StructureDef_ProductionOutput_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_ProductionOutput" ADD CONSTRAINT "StructureDef_ProductionOutput_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_ProductionState" ADD CONSTRAINT "Structure_ProductionState_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig" ADD CONSTRAINT "StructureDef_FuelConfig_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig" ADD CONSTRAINT "StructureDef_FuelConfig_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "TargetScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_InputFuelType" ADD CONSTRAINT "StructureDef_FuelConfig_InputFuelType_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef_FuelConfig"("structureDefId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_InputFuelType" ADD CONSTRAINT "StructureDef_FuelConfig_InputFuelType_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_OutputFuelType" ADD CONSTRAINT "StructureDef_FuelConfig_OutputFuelType_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef_FuelConfig"("structureDefId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_OutputFuelType" ADD CONSTRAINT "StructureDef_FuelConfig_OutputFuelType_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_EnvCondition" ADD CONSTRAINT "StructureDef_FuelConfig_EnvCondition_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef_FuelConfig"("structureDefId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_FuelConfig_EnvCondition" ADD CONSTRAINT "StructureDef_FuelConfig_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_AcceptedFuelType" ADD CONSTRAINT "StructureDef_AcceptedFuelType_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_AcceptedFuelType" ADD CONSTRAINT "StructureDef_AcceptedFuelType_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_AcceptedFuelType" ADD CONSTRAINT "StructureDef_Upgrade_AcceptedFuelType_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_AcceptedFuelType" ADD CONSTRAINT "StructureDef_Upgrade_AcceptedFuelType_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade" ADD CONSTRAINT "StructureDef_Upgrade_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Effect" ADD CONSTRAINT "StructureDef_Upgrade_Effect_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Effect" ADD CONSTRAINT "StructureDef_Upgrade_Effect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "UpgradeEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Effect" ADD CONSTRAINT "StructureDef_Upgrade_Effect_targetEnvConditionId_fkey" FOREIGN KEY ("targetEnvConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Effect" ADD CONSTRAINT "StructureDef_Upgrade_Effect_efficiencyConsumerScopeId_fkey" FOREIGN KEY ("efficiencyConsumerScopeId") REFERENCES "TargetScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Relation" ADD CONSTRAINT "StructureDef_Upgrade_Relation_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Relation" ADD CONSTRAINT "StructureDef_Upgrade_Relation_targetUpgradeId_fkey" FOREIGN KEY ("targetUpgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_Relation" ADD CONSTRAINT "StructureDef_Upgrade_Relation_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_BuildCost" ADD CONSTRAINT "StructureDef_Upgrade_BuildCost_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureDef_Upgrade_BuildCost" ADD CONSTRAINT "StructureDef_Upgrade_BuildCost_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_structureDefId_fkey" FOREIGN KEY ("structureDefId") REFERENCES "StructureDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_AppliedUpgrade" ADD CONSTRAINT "Structure_AppliedUpgrade_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_AppliedUpgrade" ADD CONSTRAINT "Structure_AppliedUpgrade_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction" ADD CONSTRAINT "Construction_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction" ADD CONSTRAINT "Construction_constructionTypeId_fkey" FOREIGN KEY ("constructionTypeId") REFERENCES "ConstructionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction" ADD CONSTRAINT "Construction_upgradeId_fkey" FOREIGN KEY ("upgradeId") REFERENCES "StructureDef_Upgrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction" ADD CONSTRAINT "Construction_initiatedByEntityId_fkey" FOREIGN KEY ("initiatedByEntityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction_ItemRequirement" ADD CONSTRAINT "Construction_ItemRequirement_constructionId_fkey" FOREIGN KEY ("constructionId") REFERENCES "Construction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Construction_ItemRequirement" ADD CONSTRAINT "Construction_ItemRequirement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_CompostDeposit" ADD CONSTRAINT "Structure_CompostDeposit_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_CompostDeposit" ADD CONSTRAINT "Structure_CompostDeposit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure_CompostDeposit" ADD CONSTRAINT "Structure_CompostDeposit_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Faction" ADD CONSTRAINT "Location_Faction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Faction" ADD CONSTRAINT "Location_Faction_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Faction" ADD CONSTRAINT "Location_Faction_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBorder" ADD CONSTRAINT "LocationBorder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBorder" ADD CONSTRAINT "LocationBorder_borderingFactionId_fkey" FOREIGN KEY ("borderingFactionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Biome" ADD CONSTRAINT "Location_Biome_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Biome" ADD CONSTRAINT "Location_Biome_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_EnvCondition" ADD CONSTRAINT "Location_EnvCondition_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_EnvCondition" ADD CONSTRAINT "Location_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp" ADD CONSTRAINT "Camp_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp_Faction" ADD CONSTRAINT "Camp_Faction_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp_Faction" ADD CONSTRAINT "Camp_Faction_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp_Faction" ADD CONSTRAINT "Camp_Faction_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp_StructureLimit" ADD CONSTRAINT "Camp_StructureLimit_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp_StructureLimit" ADD CONSTRAINT "Camp_StructureLimit_structureTypeId_fkey" FOREIGN KEY ("structureTypeId") REFERENCES "StructureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action_EntityDailyRecord" ADD CONSTRAINT "Action_EntityDailyRecord_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action_EntityDailyRecord" ADD CONSTRAINT "Action_EntityDailyRecord_systemType_fkey" FOREIGN KEY ("systemType") REFERENCES "ActionSystemType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType" ADD CONSTRAINT "ActionType_systemTypeId_fkey" FOREIGN KEY ("systemTypeId") REFERENCES "ActionSystemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_ActionConfig" ADD CONSTRAINT "Guild_ActionConfig_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DisciplineReward" ADD CONSTRAINT "ActionType_DisciplineReward_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DisciplineReward" ADD CONSTRAINT "ActionType_DisciplineReward_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DefaultItem" ADD CONSTRAINT "ActionType_DefaultItem_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DefaultItem" ADD CONSTRAINT "ActionType_DefaultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DisciplineRequirement" ADD CONSTRAINT "ActionType_DisciplineRequirement_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DisciplineRequirement" ADD CONSTRAINT "ActionType_DisciplineRequirement_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_Step" ADD CONSTRAINT "ActionType_Step_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_Step" ADD CONSTRAINT "ActionType_Step_defaultStatId_fkey" FOREIGN KEY ("defaultStatId") REFERENCES "Stat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_ActionStep_Config" ADD CONSTRAINT "Guild_ActionStep_Config_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ActionType_Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_ActionStep_Config" ADD CONSTRAINT "Guild_ActionStep_Config_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_ActionStep_Config" ADD CONSTRAINT "Guild_ActionStep_Config_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_ActionStep" ADD CONSTRAINT "Species_ActionStep_defaultStatId_fkey" FOREIGN KEY ("defaultStatId") REFERENCES "Stat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_Species_ActionStep_Config" ADD CONSTRAINT "Guild_Species_ActionStep_Config_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_Species_ActionStep_Config" ADD CONSTRAINT "Guild_Species_ActionStep_Config_speciesActionStepId_fkey" FOREIGN KEY ("speciesActionStepId") REFERENCES "Species_ActionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_Species_ActionStep_Config" ADD CONSTRAINT "Guild_Species_ActionStep_Config_proficiencyDefId_fkey" FOREIGN KEY ("proficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild_Species_ActionStep_Config" ADD CONSTRAINT "Guild_Species_ActionStep_Config_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_ActionUsage" ADD CONSTRAINT "Entity_ActionUsage_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_ActionUsage" ADD CONSTRAINT "Entity_ActionUsage_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_leaderEntityId_fkey" FOREIGN KEY ("leaderEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity" ADD CONSTRAINT "ActionInstance_Entity_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "ActionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity" ADD CONSTRAINT "ActionInstance_Entity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity_DisciplineXp" ADD CONSTRAINT "ActionInstance_Entity_DisciplineXp_actionInstanceId_entity_fkey" FOREIGN KEY ("actionInstanceId", "entityId") REFERENCES "ActionInstance_Entity"("actionInstanceId", "entityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity_DisciplineXp" ADD CONSTRAINT "ActionInstance_Entity_DisciplineXp_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_TriggerType" ADD CONSTRAINT "EventDef_TriggerType_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_TriggerType" ADD CONSTRAINT "EventDef_TriggerType_triggerTypeId_fkey" FOREIGN KEY ("triggerTypeId") REFERENCES "EventTriggerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef" ADD CONSTRAINT "EventDef_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "EventScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_WeatherTrigger" ADD CONSTRAINT "EventDef_WeatherTrigger_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_WeatherTrigger" ADD CONSTRAINT "EventDef_WeatherTrigger_weatherStateId_fkey" FOREIGN KEY ("weatherStateId") REFERENCES "WeatherState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_ActionType" ADD CONSTRAINT "EventDef_ActionType_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_ActionType" ADD CONSTRAINT "EventDef_ActionType_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_ThresholdTrigger" ADD CONSTRAINT "EventDef_ThresholdTrigger_thresholdTypeId_fkey" FOREIGN KEY ("thresholdTypeId") REFERENCES "EventThresholdType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_ThresholdTrigger" ADD CONSTRAINT "EventDef_ThresholdTrigger_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Prerequisite" ADD CONSTRAINT "EventDef_Prerequisite_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Prerequisite" ADD CONSTRAINT "EventDef_Prerequisite_requiredEventDefId_fkey" FOREIGN KEY ("requiredEventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_EventDef" ADD CONSTRAINT "EnvCondition_EventDef_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_EventDef" ADD CONSTRAINT "EnvCondition_EventDef_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_stepTypeId_fkey" FOREIGN KEY ("stepTypeId") REFERENCES "EventStepType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_effectScopeId_fkey" FOREIGN KEY ("effectScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_choiceScopeId_fkey" FOREIGN KEY ("choiceScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_checkParticipantScopeId_fkey" FOREIGN KEY ("checkParticipantScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_checkTypeId_fkey" FOREIGN KEY ("checkTypeId") REFERENCES "EventCheckType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_checkProficiencyDefId_fkey" FOREIGN KEY ("checkProficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_conditionCheckDefId_fkey" FOREIGN KEY ("conditionCheckDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_itemCheckItemId_fkey" FOREIGN KEY ("itemCheckItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_itemCheckItemTypeId_fkey" FOREIGN KEY ("itemCheckItemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_thresholdCheckTypeId_fkey" FOREIGN KEY ("thresholdCheckTypeId") REFERENCES "EventThresholdType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_passStepId_fkey" FOREIGN KEY ("passStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_failStepId_fkey" FOREIGN KEY ("failStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_winStepId_fkey" FOREIGN KEY ("winStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_loseStepId_fkey" FOREIGN KEY ("loseStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_combatEncounterDefId_fkey" FOREIGN KEY ("combatEncounterDefId") REFERENCES "CombatEncounterDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepChoice" ADD CONSTRAINT "EventStepChoice_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepChoice" ADD CONSTRAINT "EventStepChoice_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepRandomBranch" ADD CONSTRAINT "EventStepRandomBranch_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepRandomBranch" ADD CONSTRAINT "EventStepRandomBranch_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_targetScopeId_fkey" FOREIGN KEY ("targetScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_locationBuffEffectTypeId_fkey" FOREIGN KEY ("locationBuffEffectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_statModifierStatId_fkey" FOREIGN KEY ("statModifierStatId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_proficiencyModifierProficiencyDefId_fkey" FOREIGN KEY ("proficiencyModifierProficiencyDefId") REFERENCES "ProficiencyDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_disciplineXpDisciplineDefId_fkey" FOREIGN KEY ("disciplineXpDisciplineDefId") REFERENCES "DisciplineDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_structureDamageStructureTypeId_fkey" FOREIGN KEY ("structureDamageStructureTypeId") REFERENCES "StructureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_eventWeightTargetEventDefId_fkey" FOREIGN KEY ("eventWeightTargetEventDefId") REFERENCES "EventDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "EventStepDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "ActionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent_Participant" ADD CONSTRAINT "ActiveEvent_Participant_activeEventId_fkey" FOREIGN KEY ("activeEventId") REFERENCES "ActiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent_Participant" ADD CONSTRAINT "ActiveEvent_Participant_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepVote" ADD CONSTRAINT "EventStepVote_activeEventId_fkey" FOREIGN KEY ("activeEventId") REFERENCES "ActiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepVote" ADD CONSTRAINT "EventStepVote_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepVote" ADD CONSTRAINT "EventStepVote_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "EventStepChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepVote" ADD CONSTRAINT "EventStepVote_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWeightModifier" ADD CONSTRAINT "EventWeightModifier_targetEventDefId_fkey" FOREIGN KEY ("targetEventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWeightModifier" ADD CONSTRAINT "EventWeightModifier_sourceActiveEventId_fkey" FOREIGN KEY ("sourceActiveEventId") REFERENCES "ActiveEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Location" ADD CONSTRAINT "EventDef_Location_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Location" ADD CONSTRAINT "EventDef_Location_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCooldown" ADD CONSTRAINT "EventCooldown_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUnresolvedState" ADD CONSTRAINT "EventUnresolvedState_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageType" ADD CONSTRAINT "DamageType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DamageCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesCombatBehavior" ADD CONSTRAINT "SpeciesCombatBehavior_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesCombatBehavior" ADD CONSTRAINT "SpeciesCombatBehavior_offensiveTargetStrategyId_fkey" FOREIGN KEY ("offensiveTargetStrategyId") REFERENCES "CombatTargetStrategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesCombatBehavior" ADD CONSTRAINT "SpeciesCombatBehavior_supportTargetStrategyId_fkey" FOREIGN KEY ("supportTargetStrategyId") REFERENCES "CombatTargetStrategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesDefaultLoadout" ADD CONSTRAINT "SpeciesDefaultLoadout_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesDefaultLoadout" ADD CONSTRAINT "SpeciesDefaultLoadout_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat" ADD CONSTRAINT "ActiveCombat_combatEncounterDefId_fkey" FOREIGN KEY ("combatEncounterDefId") REFERENCES "CombatEncounterDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat" ADD CONSTRAINT "ActiveCombat_activeEventId_fkey" FOREIGN KEY ("activeEventId") REFERENCES "ActiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat" ADD CONSTRAINT "ActiveCombat_initiationTypeId_fkey" FOREIGN KEY ("initiationTypeId") REFERENCES "CombatInitiationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat" ADD CONSTRAINT "ActiveCombat_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "CombatOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Participant" ADD CONSTRAINT "ActiveCombat_Participant_activeCombatId_fkey" FOREIGN KEY ("activeCombatId") REFERENCES "ActiveCombat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Participant" ADD CONSTRAINT "ActiveCombat_Participant_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Participant" ADD CONSTRAINT "ActiveCombat_Participant_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Participant_ActionCooldown" ADD CONSTRAINT "ActiveCombat_Participant_ActionCooldown_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ActiveCombat_Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Participant_ActionCooldown" ADD CONSTRAINT "ActiveCombat_Participant_ActionCooldown_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_BehaviorEffect" ADD CONSTRAINT "ActiveCombat_BehaviorEffect_activeCombatId_fkey" FOREIGN KEY ("activeCombatId") REFERENCES "ActiveCombat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_BehaviorEffect" ADD CONSTRAINT "ActiveCombat_BehaviorEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "CombatEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_BehaviorEffect" ADD CONSTRAINT "ActiveCombat_BehaviorEffect_affectedParticipantId_fkey" FOREIGN KEY ("affectedParticipantId") REFERENCES "ActiveCombat_Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_BehaviorEffect" ADD CONSTRAINT "ActiveCombat_BehaviorEffect_linkedParticipantId_fkey" FOREIGN KEY ("linkedParticipantId") REFERENCES "ActiveCombat_Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Action" ADD CONSTRAINT "ActiveCombat_Action_activeCombatId_fkey" FOREIGN KEY ("activeCombatId") REFERENCES "ActiveCombat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Action" ADD CONSTRAINT "ActiveCombat_Action_actionCategoryId_fkey" FOREIGN KEY ("actionCategoryId") REFERENCES "CombatActionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Action" ADD CONSTRAINT "ActiveCombat_Action_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Action" ADD CONSTRAINT "ActiveCombat_Action_actorEntityId_fkey" FOREIGN KEY ("actorEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_Action" ADD CONSTRAINT "ActiveCombat_Action_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef" ADD CONSTRAINT "CombatEncounterDef_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef_NamedEntity" ADD CONSTRAINT "CombatEncounterDef_NamedEntity_combatEncounterDefId_fkey" FOREIGN KEY ("combatEncounterDefId") REFERENCES "CombatEncounterDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef_NamedEntity" ADD CONSTRAINT "CombatEncounterDef_NamedEntity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef" ADD CONSTRAINT "CombatStatEffectDef_stackBehaviorId_fkey" FOREIGN KEY ("stackBehaviorId") REFERENCES "StackBehavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_StatMod" ADD CONSTRAINT "CombatStatEffectDef_StatMod_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_StatMod" ADD CONSTRAINT "CombatStatEffectDef_StatMod_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_RollMod" ADD CONSTRAINT "CombatStatEffectDef_RollMod_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_RollMod" ADD CONSTRAINT "CombatStatEffectDef_RollMod_rollTypeId_fkey" FOREIGN KEY ("rollTypeId") REFERENCES "CombatRollType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_AcMod" ADD CONSTRAINT "CombatStatEffectDef_AcMod_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_DamageOverTime" ADD CONSTRAINT "CombatStatEffectDef_DamageOverTime_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_DamageOverTime" ADD CONSTRAINT "CombatStatEffectDef_DamageOverTime_damageTypeId_fkey" FOREIGN KEY ("damageTypeId") REFERENCES "DamageType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_HealOverTime" ADD CONSTRAINT "CombatStatEffectDef_HealOverTime_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_DamageModifier" ADD CONSTRAINT "CombatStatEffectDef_DamageModifier_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_DamageModifier" ADD CONSTRAINT "CombatStatEffectDef_DamageModifier_damageTypeId_fkey" FOREIGN KEY ("damageTypeId") REFERENCES "DamageType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_RollAdvantage" ADD CONSTRAINT "CombatStatEffectDef_RollAdvantage_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatStatEffectDef_RollAdvantage" ADD CONSTRAINT "CombatStatEffectDef_RollAdvantage_rollTypeId_fkey" FOREIGN KEY ("rollTypeId") REFERENCES "CombatRollType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_activeCombatId_fkey" FOREIGN KEY ("activeCombatId") REFERENCES "ActiveCombat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_affectedParticipantId_fkey" FOREIGN KEY ("affectedParticipantId") REFERENCES "ActiveCombat_Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_sourceParticipantId_fkey" FOREIGN KEY ("sourceParticipantId") REFERENCES "ActiveCombat_Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_appliedByActionId_fkey" FOREIGN KEY ("appliedByActionId") REFERENCES "ActiveCombat_Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCombat_StatEffect" ADD CONSTRAINT "ActiveCombat_StatEffect_sourceEntityConditionId_fkey" FOREIGN KEY ("sourceEntityConditionId") REFERENCES "EntityCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_StatEffect" ADD CONSTRAINT "ItemEquipmentProfile_StatEffect_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_StatEffect" ADD CONSTRAINT "ItemEquipmentProfile_StatEffect_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatStatEffect" ADD CONSTRAINT "ConditionDef_CombatStatEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatStatEffect" ADD CONSTRAINT "ConditionDef_CombatStatEffect_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityDef_StatEffect" ADD CONSTRAINT "AbilityDef_StatEffect_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityDef_StatEffect" ADD CONSTRAINT "AbilityDef_StatEffect_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_PreCombatEffect" ADD CONSTRAINT "Entity_PreCombatEffect_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_PreCombatEffect" ADD CONSTRAINT "Entity_PreCombatEffect_effectDefId_fkey" FOREIGN KEY ("effectDefId") REFERENCES "CombatStatEffectDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_PreCombatEffect" ADD CONSTRAINT "Entity_PreCombatEffect_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_PreCombatEffect" ADD CONSTRAINT "Entity_PreCombatEffect_abilityDefId_fkey" FOREIGN KEY ("abilityDefId") REFERENCES "AbilityDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef" ADD CONSTRAINT "PlantDef_rootPlantDefId_fkey" FOREIGN KEY ("rootPlantDefId") REFERENCES "PlantDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef" ADD CONSTRAINT "PlantDef_harvestDropTableId_fkey" FOREIGN KEY ("harvestDropTableId") REFERENCES "DropTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef" ADD CONSTRAINT "PlantDef_propagationItemId_fkey" FOREIGN KEY ("propagationItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_PlantType" ADD CONSTRAINT "PlantDef_PlantType_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_PlantType" ADD CONSTRAINT "PlantDef_PlantType_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantType_EnvConditionEffect" ADD CONSTRAINT "PlantType_EnvConditionEffect_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantType_EnvConditionEffect" ADD CONSTRAINT "PlantType_EnvConditionEffect_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantType_EnvConditionEffect" ADD CONSTRAINT "PlantType_EnvConditionEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantType_EnvConditionEffect" ADD CONSTRAINT "PlantType_EnvConditionEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_Trait" ADD CONSTRAINT "PlantDef_Trait_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_Trait" ADD CONSTRAINT "PlantDef_Trait_plantTraitId_fkey" FOREIGN KEY ("plantTraitId") REFERENCES "PlantTrait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_GrowthStage" ADD CONSTRAINT "PlantDef_GrowthStage_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_Biome" ADD CONSTRAINT "PlantDef_Biome_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_Biome" ADD CONSTRAINT "PlantDef_Biome_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_EnvConditionEffect" ADD CONSTRAINT "PlantDef_EnvConditionEffect_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_EnvConditionEffect" ADD CONSTRAINT "PlantDef_EnvConditionEffect_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_EnvConditionEffect" ADD CONSTRAINT "PlantDef_EnvConditionEffect_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_EnvConditionEffect" ADD CONSTRAINT "PlantDef_EnvConditionEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_PlotType" ADD CONSTRAINT "PlantDef_PlotType_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDef_PlotType" ADD CONSTRAINT "PlantDef_PlotType_plotTypeId_fkey" FOREIGN KEY ("plotTypeId") REFERENCES "PlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotType_EnvCondition" ADD CONSTRAINT "PlotType_EnvCondition_plotTypeId_fkey" FOREIGN KEY ("plotTypeId") REFERENCES "PlotType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotType_EnvCondition" ADD CONSTRAINT "PlotType_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot_Buff" ADD CONSTRAINT "Plot_Buff_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot_Buff" ADD CONSTRAINT "Plot_Buff_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot_Buff" ADD CONSTRAINT "Plot_Buff_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Effect" ADD CONSTRAINT "Location_Effect_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Effect" ADD CONSTRAINT "Location_Effect_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Effect" ADD CONSTRAINT "Location_Effect_sourceActiveEventId_fkey" FOREIGN KEY ("sourceActiveEventId") REFERENCES "ActiveEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Effect" ADD CONSTRAINT "Location_Effect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotCrop" ADD CONSTRAINT "PlotCrop_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotCrop" ADD CONSTRAINT "PlotCrop_plantDefId_fkey" FOREIGN KEY ("plantDefId") REFERENCES "PlantDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot_TendRecord" ADD CONSTRAINT "Plot_TendRecord_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot_TendRecord" ADD CONSTRAINT "Plot_TendRecord_systemType_fkey" FOREIGN KEY ("systemType") REFERENCES "ActionSystemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityInspectionLog" ADD CONSTRAINT "EntityInspectionLog_patientEntityId_fkey" FOREIGN KEY ("patientEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityInspectionLog" ADD CONSTRAINT "EntityInspectionLog_medicEntityId_fkey" FOREIGN KEY ("medicEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_entityConditionId_fkey" FOREIGN KEY ("entityConditionId") REFERENCES "EntityCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_medicEntityId_fkey" FOREIGN KEY ("medicEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
