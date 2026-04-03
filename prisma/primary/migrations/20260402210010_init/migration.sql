-- Enable citext extension
CREATE EXTENSION IF NOT EXISTS citext;

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
CREATE TABLE "GuildSettings" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "seasonId" INTEGER,
    "currentPatternId" INTEGER,
    "currentPatternStepId" INTEGER,
    "currentStepStartedAt" TIMESTAMPTZ,
    "maxGroups" INTEGER NOT NULL DEFAULT 10,
    "maxRanks" INTEGER NOT NULL DEFAULT 100,
    "defaultDailyEnergy" INTEGER NOT NULL DEFAULT 100,
    "expCap" INTEGER NOT NULL DEFAULT 300,
    "filthCapPerCat" INTEGER NOT NULL DEFAULT 10,
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
    "defaultsSeededAt" TIMESTAMPTZ,
    "lastTickAt" TIMESTAMPTZ,
    "lastEventAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherState" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,
    "isSevere" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeatherState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvCondition" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "EnvCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season_EnvCondition" (
    "seasonId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,

    CONSTRAINT "Season_EnvCondition_pkey" PRIMARY KEY ("seasonId","envConditionId")
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
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
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
    "durationMinutes" INTEGER NOT NULL,

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
CREATE TABLE "ItemInteraction" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,

    CONSTRAINT "ItemInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "LocationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isOrganized" BOOLEAN NOT NULL DEFAULT true,
    "hasWorldSim" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GroupType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ConditionContext" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "showInHealthPanel" BOOLEAN NOT NULL DEFAULT false,
    "isTrait" BOOLEAN NOT NULL DEFAULT false,

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
CREATE TABLE "ConditionLinkType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "ConditionLinkType_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DropTable" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "DropTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTable_Entry" (
    "id" SERIAL NOT NULL,
    "dropTableId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "dropDC" INTEGER NOT NULL DEFAULT 1,
    "avgQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "quantityVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "DropTable_Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EntityStatus_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Species" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,
    "isBaseSpecies" BOOLEAN NOT NULL DEFAULT false,
    "isPlayerCreatable" BOOLEAN NOT NULL DEFAULT false,
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
    "isPrey" BOOLEAN NOT NULL DEFAULT false,
    "isPredator" BOOLEAN NOT NULL DEFAULT false,
    "combatRating" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dropTableId" INTEGER,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species_DefaultCondition" (
    "speciesId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,

    CONSTRAINT "Species_DefaultCondition_pkey" PRIMARY KEY ("speciesId","conditionDefId")
);

-- CreateTable
CREATE TABLE "Species_EquipmentLoadout" (
    "speciesId" INTEGER NOT NULL,
    "slotTypeId" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Species_EquipmentLoadout_pkey" PRIMARY KEY ("speciesId","slotTypeId")
);

-- CreateTable
CREATE TABLE "Species_Biome" (
    "speciesId" INTEGER NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "spawnWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Species_Biome_pkey" PRIMARY KEY ("speciesId","biomeId")
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
    "clanRep" INTEGER NOT NULL DEFAULT 0,
    "nutritionLevel" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "hydrationLevel" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "sexId" INTEGER,
    "genderId" INTEGER,
    "groupId" INTEGER,
    "rankId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityStats" (
    "entityId" INTEGER NOT NULL,
    "exp" INTEGER NOT NULL DEFAULT 0,
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
CREATE TABLE "SkillDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "statId" INTEGER NOT NULL,

    CONSTRAINT "SkillDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDef_Species" (
    "skillDefId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,

    CONSTRAINT "SkillDef_Species_pkey" PRIMARY KEY ("skillDefId","speciesId")
);

-- CreateTable
CREATE TABLE "Entity_Skill" (
    "entityId" INTEGER NOT NULL,
    "skillDefId" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "isProficient" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Entity_Skill_pkey" PRIMARY KEY ("entityId","skillDefId")
);

-- CreateTable
CREATE TABLE "EntityCondition" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "bodyPartId" INTEGER,
    "sourceEntityId" INTEGER,
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
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EntityCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
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
    "difficultyMod" INTEGER NOT NULL,

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
CREATE TABLE "ConditionDef_SkillEffect" (
    "conditionDefId" INTEGER NOT NULL,
    "skillDefId" INTEGER NOT NULL,
    "amount" INTEGER,
    "hasDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConditionDef_SkillEffect_pkey" PRIMARY KEY ("conditionDefId","skillDefId")
);

-- CreateTable
CREATE TABLE "ConditionDef_CombatEffect" (
    "id" SERIAL NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "diceCount" INTEGER,
    "diceSides" INTEGER,
    "statId" INTEGER,
    "flatModifier" INTEGER,

    CONSTRAINT "ConditionDef_CombatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvCondition_StatModifier" (
    "envConditionId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EnvCondition_StatModifier_pkey" PRIMARY KEY ("envConditionId","statId")
);

-- CreateTable
CREATE TABLE "EnvCondition_SkillModifier" (
    "envConditionId" INTEGER NOT NULL,
    "skillDefId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "hasDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EnvCondition_SkillModifier_pkey" PRIMARY KEY ("envConditionId","skillDefId")
);

-- CreateTable
CREATE TABLE "ConditionDef_Link" (
    "id" SERIAL NOT NULL,
    "parentConditionId" INTEGER NOT NULL,
    "childConditionId" INTEGER NOT NULL,
    "linkTypeId" INTEGER NOT NULL,
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
CREATE TABLE "GroupStandingType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "GroupStandingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupStanding" (
    "groupId" INTEGER NOT NULL,
    "targetGroupId" INTEGER NOT NULL,
    "standingTypeId" INTEGER NOT NULL,

    CONSTRAINT "GroupStanding_pkey" PRIMARY KEY ("groupId","targetGroupId")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "groupTypeId" INTEGER NOT NULL,
    "filth" INTEGER NOT NULL DEFAULT 0,
    "lastEventAt" TIMESTAMPTZ,
    "hasWaterAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvModifierType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EnvModifierType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvCondition_Modifier" (
    "envConditionId" INTEGER NOT NULL,
    "modTypeId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EnvCondition_Modifier_pkey" PRIMARY KEY ("envConditionId","modTypeId")
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
CREATE TABLE "Location_Group" (
    "locationId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,

    CONSTRAINT "Location_Group_pkey" PRIMARY KEY ("locationId","groupId")
);

-- CreateTable
CREATE TABLE "LocationBorder" (
    "locationId" INTEGER NOT NULL,
    "borderingGroupId" INTEGER NOT NULL,

    CONSTRAINT "LocationBorder_pkey" PRIMARY KEY ("locationId","borderingGroupId")
);

-- CreateTable
CREATE TABLE "Biome" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "color" CHAR(6),
    "dropTableId" INTEGER,

    CONSTRAINT "Biome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location_Biome" (
    "locationId" INTEGER NOT NULL,
    "biomeId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Location_Biome_pkey" PRIMARY KEY ("locationId","biomeId")
);

-- CreateTable
CREATE TABLE "Biome_EnvCondition" (
    "biomeId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "stacks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Biome_EnvCondition_pkey" PRIMARY KEY ("biomeId","envConditionId")
);

-- CreateTable
CREATE TABLE "Location_EnvCondition" (
    "locationId" INTEGER NOT NULL,
    "envConditionId" INTEGER NOT NULL,
    "stacks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Location_EnvCondition_pkey" PRIMARY KEY ("locationId","envConditionId")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "groupId" INTEGER,
    "entityId" INTEGER,
    "weightCapacity" DOUBLE PRECISION,
    "fluidCapacity" DOUBLE PRECISION,
    "expirationModifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isPrimaryStorage" BOOLEAN NOT NULL DEFAULT false,
    "acceptsAll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage_ItemType" (
    "storageId" INTEGER NOT NULL,
    "itemTypeId" INTEGER NOT NULL,

    CONSTRAINT "Storage_ItemType_pkey" PRIMARY KEY ("storageId","itemTypeId")
);

-- CreateTable
CREATE TABLE "StoredItem" (
    "id" SERIAL NOT NULL,
    "storageId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "storedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "craftBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentDurability" INTEGER,
    "usesRemaining" INTEGER,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "chosenProfileId" INTEGER,
    "equippedAt" TIMESTAMPTZ,

    CONSTRAINT "StoredItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "codeName" VARCHAR(200) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "measurementTypeId" INTEGER,
    "averageWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weightVariance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "decayDays" INTEGER,
    "maxDurability" INTEGER,
    "maxUses" INTEGER,
    "fuelValue" INTEGER,
    "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "ItemWarning" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
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
    "hitStatId" INTEGER,
    "damageStatId" INTEGER,
    "healStatId" INTEGER,
    "hitBonus" INTEGER NOT NULL DEFAULT 0,
    "damageBonus" INTEGER NOT NULL DEFAULT 0,
    "healBonus" INTEGER NOT NULL DEFAULT 0,
    "triggersEventDefId" INTEGER,
    "triggerDC" INTEGER NOT NULL DEFAULT 1,
    "summonSpeciesId" INTEGER,
    "summonDiceCount" INTEGER,
    "summonDiceSides" INTEGER,

    CONSTRAINT "ItemEquipmentProfile_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ItemEffectType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "ItemEffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEffect" (
    "id" SERIAL NOT NULL,
    "itemActionId" INTEGER NOT NULL,
    "symptomId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "effectiveness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ItemEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemConditionEffect" (
    "id" SERIAL NOT NULL,
    "itemActionId" INTEGER NOT NULL,
    "conditionDefId" INTEGER NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
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
CREATE TABLE "Item_IngredientType" (
    "guildId" VARCHAR(50) NOT NULL,
    "itemId" INTEGER NOT NULL,
    "ingredientTypeId" INTEGER NOT NULL,

    CONSTRAINT "Item_IngredientType_pkey" PRIMARY KEY ("guildId","itemId","ingredientTypeId")
);

-- CreateTable
CREATE TABLE "CraftingInteraction" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,

    CONSTRAINT "CraftingInteraction_pkey" PRIMARY KEY ("id")
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
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "craftingInteractionId" INTEGER NOT NULL,
    "requiresDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "craftingTimeMins" INTEGER,
    "maxBatchSize" INTEGER,
    "minCraftingLevel" INTEGER,
    "craftingXpReward" INTEGER NOT NULL DEFAULT 0,

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
    "decayDaysMultiplier" DOUBLE PRECISION,
    "decayVariance" DOUBLE PRECISION,
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
CREATE TABLE "Rank_Group" (
    "rankId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "Rank_Group_pkey" PRIMARY KEY ("rankId","groupId")
);

-- CreateTable
CREATE TABLE "Rank_DefaultItem" (
    "rankId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "autoEquip" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rank_DefaultItem_pkey" PRIMARY KEY ("rankId","itemId")
);

-- CreateTable
CREATE TABLE "ActionType" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "energyCost" INTEGER NOT NULL DEFAULT 10,
    "minCats" INTEGER NOT NULL DEFAULT 1,
    "maxCats" INTEGER,
    "durationMinutes" INTEGER,
    "baseExpReward" INTEGER NOT NULL DEFAULT 0,
    "baseClanRepReward" INTEGER NOT NULL DEFAULT 0,
    "requiresCanMentor" BOOLEAN NOT NULL DEFAULT false,
    "allowApprenticesWithAdult" BOOLEAN NOT NULL DEFAULT false,
    "requiresCanLeadEvents" BOOLEAN NOT NULL DEFAULT false,
    "minAgeMoons" INTEGER,
    "isInteractive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActionType_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ActionInstance" (
    "id" SERIAL NOT NULL,
    "actionTypeId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "locationId" INTEGER,
    "leaderCatId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "ActionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionInstance_Entity" (
    "actionInstanceId" INTEGER NOT NULL,
    "catId" INTEGER NOT NULL,
    "energySpent" INTEGER NOT NULL DEFAULT 0,
    "expEarned" INTEGER NOT NULL DEFAULT 0,
    "clanRepEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ActionInstance_Entity_pkey" PRIMARY KEY ("actionInstanceId","catId")
);

-- CreateTable
CREATE TABLE "EventTriggerType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventTriggerType_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "EventParticipantScope" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,
    "appliesToRandom" BOOLEAN NOT NULL DEFAULT false,
    "appliesToLeader" BOOLEAN NOT NULL DEFAULT false,
    "appliesToGroup" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventParticipantScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEffectType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventEffectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCheckMode" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EventCheckMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "triggerTypeId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,
    "baseWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "chancePerDay" DOUBLE PRECISION,
    "requiresLeader" BOOLEAN NOT NULL DEFAULT false,
    "requiresCanMentor" BOOLEAN NOT NULL DEFAULT false,
    "allowApprenticesWithAdult" BOOLEAN NOT NULL DEFAULT false,
    "minAgeMoons" INTEGER,
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
CREATE TABLE "EventDef_FilthTrigger" (
    "eventDefId" INTEGER NOT NULL,
    "filthThreshold" DOUBLE PRECISION NOT NULL,
    "chancePerDay" DOUBLE PRECISION NOT NULL,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventDef_FilthTrigger_pkey" PRIMARY KEY ("eventDefId")
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
    "sortOrder" INTEGER NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "stepTypeId" INTEGER NOT NULL,
    "prompt" VARCHAR(2000) NOT NULL,
    "effectScopeId" INTEGER,
    "nextStepId" INTEGER,
    "expiresAfterMinutes" INTEGER,
    "defaultChoiceDefId" INTEGER,
    "combatEncounterDefId" INTEGER,
    "winStepId" INTEGER,
    "loseStepId" INTEGER,
    "winExpReward" INTEGER NOT NULL DEFAULT 0,
    "winClanRepReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventStepDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEffect" (
    "id" SERIAL NOT NULL,
    "effectTypeId" INTEGER NOT NULL,
    "stepDefId" INTEGER,
    "outcomeDefId" INTEGER,
    "conditionDefId" INTEGER,
    "remove" BOOLEAN NOT NULL DEFAULT false,
    "itemId" INTEGER,
    "itemTypeId" INTEGER,
    "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isGain" BOOLEAN NOT NULL DEFAULT true,
    "targetScopeId" INTEGER,

    CONSTRAINT "EventEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChoiceDef" (
    "id" SERIAL NOT NULL,
    "stepDefId" INTEGER NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "statId" INTEGER,
    "skillDefId" INTEGER,
    "difficulty" INTEGER,
    "checkModeId" INTEGER,

    CONSTRAINT "EventChoiceDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOutcomeDef" (
    "id" SERIAL NOT NULL,
    "choiceDefId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "effectScopeId" INTEGER NOT NULL,
    "endsAction" BOOLEAN NOT NULL DEFAULT false,
    "nextStepId" INTEGER,

    CONSTRAINT "EventOutcomeDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveEvent" (
    "id" SERIAL NOT NULL,
    "eventDefId" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "groupId" INTEGER,
    "actionInstanceId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentStepId" INTEGER,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,

    CONSTRAINT "ActiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveEvent_Participant" (
    "id" SERIAL NOT NULL,
    "activeEventId" INTEGER NOT NULL,
    "catId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveEvent_Participant_pkey" PRIMARY KEY ("id")
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
    "eventDefId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "lastEventAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EventCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEncounterDef" (
    "id" SERIAL NOT NULL,
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
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
    "isPerRound" BOOLEAN NOT NULL DEFAULT false,
    "dealsDamage" BOOLEAN NOT NULL DEFAULT false,
    "restoresHealth" BOOLEAN NOT NULL DEFAULT false,
    "modifiesRoll" BOOLEAN NOT NULL DEFAULT false,
    "modifiesStat" BOOLEAN NOT NULL DEFAULT false,
    "deniesActions" BOOLEAN NOT NULL DEFAULT false,
    "modifiesAC" BOOLEAN NOT NULL DEFAULT false,
    "grantsAdvantage" BOOLEAN NOT NULL DEFAULT false,
    "grantsDisadvantage" BOOLEAN NOT NULL DEFAULT false,
    "redirectsDamage" BOOLEAN NOT NULL DEFAULT false,
    "forcesTargeting" BOOLEAN NOT NULL DEFAULT false,
    "isReactive" BOOLEAN NOT NULL DEFAULT false,
    "absorbsDamage" BOOLEAN NOT NULL DEFAULT false,
    "grantsEvasion" BOOLEAN NOT NULL DEFAULT false,
    "enablesCounterattack" BOOLEAN NOT NULL DEFAULT false,
    "suppressesReactive" BOOLEAN NOT NULL DEFAULT false,
    "removesEffects" BOOLEAN NOT NULL DEFAULT false,
    "preventedAsTarget" BOOLEAN NOT NULL DEFAULT false,

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
    "guildId" VARCHAR(50) NOT NULL DEFAULT 'global',
    "name" VARCHAR(50) NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "DamageType_pkey" PRIMARY KEY ("id")
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
    "sourceSkillId" INTEGER,
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
    "winningAllyGroupId" INTEGER,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "ActiveCombat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCombat_Participant" (
    "id" SERIAL NOT NULL,
    "activeCombatId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "allyGroupId" INTEGER NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "isPatrolLeader" BOOLEAN NOT NULL DEFAULT false,
    "isAiControlled" BOOLEAN NOT NULL DEFAULT false,
    "dropTableId" INTEGER,
    "initiativeRoll" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "baseAc" INTEGER NOT NULL,
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
    "secondWindTriggered" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveCombat_Action_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "EchoDens_guildId_channelId_key" ON "EchoDens"("guildId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildSettings_guildId_key" ON "GuildSettings"("guildId");

-- CreateIndex
CREATE INDEX "GuildSettings_seasonId_idx" ON "GuildSettings"("seasonId");

-- CreateIndex
CREATE INDEX "GuildSettings_currentPatternId_idx" ON "GuildSettings"("currentPatternId");

-- CreateIndex
CREATE INDEX "GuildSettings_currentPatternStepId_idx" ON "GuildSettings"("currentPatternStepId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE INDEX "WeatherState_guildId_idx" ON "WeatherState"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherState_guildId_name_key" ON "WeatherState"("guildId", "name");

-- CreateIndex
CREATE INDEX "EnvCondition_guildId_idx" ON "EnvCondition"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvCondition_guildId_name_key" ON "EnvCondition"("guildId", "name");

-- CreateIndex
CREATE INDEX "Season_EnvCondition_envConditionId_idx" ON "Season_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "WeatherState_EnvCondition_envConditionId_idx" ON "WeatherState_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "WeatherPattern_guildId_idx" ON "WeatherPattern"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherPattern_guildId_name_key" ON "WeatherPattern"("guildId", "name");

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
CREATE UNIQUE INDEX "ItemInteraction_name_key" ON "ItemInteraction"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LocationStatus_name_key" ON "LocationStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupType_name_key" ON "GroupType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_name_key" ON "ItemType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sex_name_key" ON "Sex"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Gender_name_key" ON "Gender"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionContext_name_key" ON "ConditionContext"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionType_name_key" ON "ConditionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionLinkType_name_key" ON "ConditionLinkType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Stat_name_key" ON "Stat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_name_key" ON "Symptom"("name");

-- CreateIndex
CREATE INDEX "DropTable_Entry_dropTableId_idx" ON "DropTable_Entry"("dropTableId");

-- CreateIndex
CREATE INDEX "DropTable_Entry_itemId_idx" ON "DropTable_Entry"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTable_Entry_dropTableId_itemId_key" ON "DropTable_Entry"("dropTableId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityStatus_name_key" ON "EntityStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EntityType_name_key" ON "EntityType"("name");

-- CreateIndex
CREATE INDEX "Species_guildId_idx" ON "Species"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_guildId_name_key" ON "Species"("guildId", "name");

-- CreateIndex
CREATE INDEX "Species_DefaultCondition_conditionDefId_idx" ON "Species_DefaultCondition"("conditionDefId");

-- CreateIndex
CREATE INDEX "Species_EquipmentLoadout_slotTypeId_idx" ON "Species_EquipmentLoadout"("slotTypeId");

-- CreateIndex
CREATE INDEX "Species_Biome_biomeId_idx" ON "Species_Biome"("biomeId");

-- CreateIndex
CREATE INDEX "BodyPart_speciesId_idx" ON "BodyPart"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyPart_speciesId_name_key" ON "BodyPart"("speciesId", "name");

-- CreateIndex
CREATE INDEX "Entity_guildId_userId_idx" ON "Entity"("guildId", "userId");

-- CreateIndex
CREATE INDEX "Entity_groupId_idx" ON "Entity"("groupId");

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
CREATE INDEX "SkillDef_guildId_idx" ON "SkillDef"("guildId");

-- CreateIndex
CREATE INDEX "SkillDef_statId_idx" ON "SkillDef"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDef_guildId_name_key" ON "SkillDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "SkillDef_Species_skillDefId_idx" ON "SkillDef_Species"("skillDefId");

-- CreateIndex
CREATE INDEX "SkillDef_Species_speciesId_idx" ON "SkillDef_Species"("speciesId");

-- CreateIndex
CREATE INDEX "Entity_Skill_entityId_idx" ON "Entity_Skill"("entityId");

-- CreateIndex
CREATE INDEX "EntityCondition_entityId_idx" ON "EntityCondition"("entityId");

-- CreateIndex
CREATE INDEX "EntityCondition_conditionDefId_idx" ON "EntityCondition"("conditionDefId");

-- CreateIndex
CREATE INDEX "EntityCondition_sourceEntityId_idx" ON "EntityCondition"("sourceEntityId");

-- CreateIndex
CREATE INDEX "EntityCondition_linkedConditionId_idx" ON "EntityCondition"("linkedConditionId");

-- CreateIndex
CREATE INDEX "EntityCondition_appliedInCombatId_idx" ON "EntityCondition"("appliedInCombatId");

-- CreateIndex
CREATE INDEX "EntityCondition_appliedByActionId_idx" ON "EntityCondition"("appliedByActionId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityCondition_entityId_conditionDefId_bodyPartId_key" ON "EntityCondition"("entityId", "conditionDefId", "bodyPartId");

-- CreateIndex
CREATE INDEX "ConditionDef_guildId_idx" ON "ConditionDef"("guildId");

-- CreateIndex
CREATE INDEX "ConditionDef_conditionTypeId_idx" ON "ConditionDef"("conditionTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_conditionContextId_idx" ON "ConditionDef"("conditionContextId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_guildId_name_key" ON "ConditionDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "ConditionDef_DamageModifier_damageTypeId_idx" ON "ConditionDef_DamageModifier"("damageTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_EnvRule_envConditionId_idx" ON "ConditionDef_EnvRule"("envConditionId");

-- CreateIndex
CREATE INDEX "ConditionDef_StatEffect_statId_idx" ON "ConditionDef_StatEffect"("statId");

-- CreateIndex
CREATE INDEX "ConditionDef_SkillEffect_skillDefId_idx" ON "ConditionDef_SkillEffect"("skillDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatEffect_effectTypeId_idx" ON "ConditionDef_CombatEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_CombatEffect_statId_idx" ON "ConditionDef_CombatEffect"("statId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_CombatEffect_conditionDefId_effectTypeId_key" ON "ConditionDef_CombatEffect"("conditionDefId", "effectTypeId");

-- CreateIndex
CREATE INDEX "EnvCondition_StatModifier_statId_idx" ON "EnvCondition_StatModifier"("statId");

-- CreateIndex
CREATE INDEX "EnvCondition_SkillModifier_skillDefId_idx" ON "EnvCondition_SkillModifier"("skillDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_parentConditionId_linkTypeId_idx" ON "ConditionDef_Link"("parentConditionId", "linkTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_childConditionId_idx" ON "ConditionDef_Link"("childConditionId");

-- CreateIndex
CREATE INDEX "ConditionDef_Link_linkTypeId_idx" ON "ConditionDef_Link"("linkTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionDef_Link_parentConditionId_childConditionId_linkTy_key" ON "ConditionDef_Link"("parentConditionId", "childConditionId", "linkTypeId");

-- CreateIndex
CREATE INDEX "ConditionDef_SymptomTag_symptomId_idx" ON "ConditionDef_SymptomTag"("symptomId");

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
CREATE INDEX "ConditionDef_GrantedItem_conditionDefId_idx" ON "ConditionDef_GrantedItem"("conditionDefId");

-- CreateIndex
CREATE INDEX "ConditionDef_GrantedItem_itemId_idx" ON "ConditionDef_GrantedItem"("itemId");

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
CREATE UNIQUE INDEX "GroupStandingType_name_key" ON "GroupStandingType"("name");

-- CreateIndex
CREATE INDEX "GroupStanding_targetGroupId_idx" ON "GroupStanding"("targetGroupId");

-- CreateIndex
CREATE INDEX "GroupStanding_standingTypeId_idx" ON "GroupStanding"("standingTypeId");

-- CreateIndex
CREATE INDEX "Group_guildId_idx" ON "Group"("guildId");

-- CreateIndex
CREATE INDEX "Group_groupTypeId_idx" ON "Group"("groupTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_guildId_name_key" ON "Group"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EnvModifierType_name_key" ON "EnvModifierType"("name");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_envConditionId_idx" ON "EnvCondition_Modifier"("envConditionId");

-- CreateIndex
CREATE INDEX "EnvCondition_Modifier_modTypeId_idx" ON "EnvCondition_Modifier"("modTypeId");

-- CreateIndex
CREATE INDEX "Location_guildId_idx" ON "Location"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_guildId_name_key" ON "Location"("guildId", "name");

-- CreateIndex
CREATE INDEX "Location_Group_groupId_idx" ON "Location_Group"("groupId");

-- CreateIndex
CREATE INDEX "Location_Group_statusId_idx" ON "Location_Group"("statusId");

-- CreateIndex
CREATE INDEX "LocationBorder_borderingGroupId_idx" ON "LocationBorder"("borderingGroupId");

-- CreateIndex
CREATE INDEX "Biome_guildId_idx" ON "Biome"("guildId");

-- CreateIndex
CREATE INDEX "Biome_dropTableId_idx" ON "Biome"("dropTableId");

-- CreateIndex
CREATE UNIQUE INDEX "Biome_guildId_name_key" ON "Biome"("guildId", "name");

-- CreateIndex
CREATE INDEX "Location_Biome_biomeId_idx" ON "Location_Biome"("biomeId");

-- CreateIndex
CREATE INDEX "Biome_EnvCondition_envConditionId_idx" ON "Biome_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "Location_EnvCondition_envConditionId_idx" ON "Location_EnvCondition"("envConditionId");

-- CreateIndex
CREATE INDEX "Storage_guildId_idx" ON "Storage"("guildId");

-- CreateIndex
CREATE INDEX "Storage_groupId_idx" ON "Storage"("groupId");

-- CreateIndex
CREATE INDEX "Storage_entityId_idx" ON "Storage"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Storage_groupId_name_key" ON "Storage"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Storage_entityId_name_key" ON "Storage"("entityId", "name");

-- CreateIndex
CREATE INDEX "Storage_ItemType_itemTypeId_idx" ON "Storage_ItemType"("itemTypeId");

-- CreateIndex
CREATE INDEX "StoredItem_storageId_idx" ON "StoredItem"("storageId");

-- CreateIndex
CREATE INDEX "StoredItem_itemId_idx" ON "StoredItem"("itemId");

-- CreateIndex
CREATE INDEX "StoredItem_storedAt_idx" ON "StoredItem"("storedAt");

-- CreateIndex
CREATE INDEX "StoredItem_chosenProfileId_idx" ON "StoredItem"("chosenProfileId");

-- CreateIndex
CREATE INDEX "Item_guildId_idx" ON "Item"("guildId");

-- CreateIndex
CREATE INDEX "Item_guildId_name_idx" ON "Item"("guildId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_guildId_codeName_key" ON "Item"("guildId", "codeName");

-- CreateIndex
CREATE INDEX "Item_Type_itemTypeId_idx" ON "Item_Type"("itemTypeId");

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
CREATE UNIQUE INDEX "ItemEffectType_name_key" ON "ItemEffectType"("name");

-- CreateIndex
CREATE INDEX "ItemEffect_itemActionId_idx" ON "ItemEffect"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemEffect_symptomId_idx" ON "ItemEffect"("symptomId");

-- CreateIndex
CREATE INDEX "ItemEffect_effectTypeId_idx" ON "ItemEffect"("effectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEffect_itemActionId_symptomId_key" ON "ItemEffect"("itemActionId", "symptomId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_itemActionId_idx" ON "ItemConditionEffect"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_conditionDefId_idx" ON "ItemConditionEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_effectTypeId_idx" ON "ItemConditionEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "ItemConditionEffect_outputConditionDefId_idx" ON "ItemConditionEffect"("outputConditionDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemConditionEffect_itemActionId_conditionDefId_key" ON "ItemConditionEffect"("itemActionId", "conditionDefId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemFoodProfile_itemId_key" ON "ItemFoodProfile"("itemId");

-- CreateIndex
CREATE INDEX "ItemAction_Output_itemActionId_idx" ON "ItemAction_Output"("itemActionId");

-- CreateIndex
CREATE INDEX "ItemAction_Output_outputItemId_idx" ON "ItemAction_Output"("outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAction_Output_itemActionId_outputItemId_key" ON "ItemAction_Output"("itemActionId", "outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementType_name_key" ON "MeasurementType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientType_name_key" ON "IngredientType"("name");

-- CreateIndex
CREATE INDEX "IngredientType_measurementTypeId_idx" ON "IngredientType"("measurementTypeId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_guildId_idx" ON "Item_IngredientType"("guildId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_itemId_idx" ON "Item_IngredientType"("itemId");

-- CreateIndex
CREATE INDEX "Item_IngredientType_ingredientTypeId_idx" ON "Item_IngredientType"("ingredientTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CraftingInteraction_name_key" ON "CraftingInteraction"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeOutputMode_name_key" ON "RecipeOutputMode"("name");

-- CreateIndex
CREATE INDEX "Recipe_guildId_idx" ON "Recipe"("guildId");

-- CreateIndex
CREATE INDEX "Recipe_craftingInteractionId_idx" ON "Recipe"("craftingInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_guildId_name_key" ON "Recipe"("guildId", "name");

-- CreateIndex
CREATE INDEX "Entity_DiscoveredRecipe_recipeId_idx" ON "Entity_DiscoveredRecipe"("recipeId");

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
CREATE INDEX "Rank_guildId_idx" ON "Rank"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_guildId_name_key" ON "Rank"("guildId", "name");

-- CreateIndex
CREATE INDEX "Rank_Group_groupId_idx" ON "Rank_Group"("groupId");

-- CreateIndex
CREATE INDEX "Rank_DefaultItem_itemId_idx" ON "Rank_DefaultItem"("itemId");

-- CreateIndex
CREATE INDEX "ActionType_guildId_idx" ON "ActionType"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionType_guildId_name_key" ON "ActionType"("guildId", "name");

-- CreateIndex
CREATE INDEX "ActionType_DefaultItem_itemId_idx" ON "ActionType_DefaultItem"("itemId");

-- CreateIndex
CREATE INDEX "ActionInstance_groupId_idx" ON "ActionInstance"("groupId");

-- CreateIndex
CREATE INDEX "ActionInstance_actionTypeId_idx" ON "ActionInstance"("actionTypeId");

-- CreateIndex
CREATE INDEX "ActionInstance_locationId_idx" ON "ActionInstance"("locationId");

-- CreateIndex
CREATE INDEX "ActionInstance_leaderCatId_idx" ON "ActionInstance"("leaderCatId");

-- CreateIndex
CREATE INDEX "ActionInstance_Entity_catId_idx" ON "ActionInstance_Entity"("catId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTriggerType_name_key" ON "EventTriggerType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventScope_name_key" ON "EventScope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventStepType_name_key" ON "EventStepType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipantScope_name_key" ON "EventParticipantScope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventEffectType_name_key" ON "EventEffectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckMode_name_key" ON "EventCheckMode"("name");

-- CreateIndex
CREATE INDEX "EventDef_guildId_idx" ON "EventDef"("guildId");

-- CreateIndex
CREATE INDEX "EventDef_triggerTypeId_idx" ON "EventDef"("triggerTypeId");

-- CreateIndex
CREATE INDEX "EventDef_scopeId_idx" ON "EventDef"("scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDef_guildId_name_key" ON "EventDef"("guildId", "name");

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
CREATE INDEX "EventStepDef_defaultChoiceDefId_idx" ON "EventStepDef"("defaultChoiceDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_combatEncounterDefId_idx" ON "EventStepDef"("combatEncounterDefId");

-- CreateIndex
CREATE INDEX "EventStepDef_nextStepId_idx" ON "EventStepDef"("nextStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_winStepId_idx" ON "EventStepDef"("winStepId");

-- CreateIndex
CREATE INDEX "EventStepDef_loseStepId_idx" ON "EventStepDef"("loseStepId");

-- CreateIndex
CREATE UNIQUE INDEX "EventStepDef_eventDefId_sortOrder_key" ON "EventStepDef"("eventDefId", "sortOrder");

-- CreateIndex
CREATE INDEX "EventEffect_effectTypeId_idx" ON "EventEffect"("effectTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_stepDefId_idx" ON "EventEffect"("stepDefId");

-- CreateIndex
CREATE INDEX "EventEffect_outcomeDefId_idx" ON "EventEffect"("outcomeDefId");

-- CreateIndex
CREATE INDEX "EventEffect_conditionDefId_idx" ON "EventEffect"("conditionDefId");

-- CreateIndex
CREATE INDEX "EventEffect_itemId_idx" ON "EventEffect"("itemId");

-- CreateIndex
CREATE INDEX "EventEffect_itemTypeId_idx" ON "EventEffect"("itemTypeId");

-- CreateIndex
CREATE INDEX "EventEffect_targetScopeId_idx" ON "EventEffect"("targetScopeId");

-- CreateIndex
CREATE INDEX "EventChoiceDef_stepDefId_idx" ON "EventChoiceDef"("stepDefId");

-- CreateIndex
CREATE INDEX "EventChoiceDef_checkModeId_idx" ON "EventChoiceDef"("checkModeId");

-- CreateIndex
CREATE INDEX "EventOutcomeDef_choiceDefId_idx" ON "EventOutcomeDef"("choiceDefId");

-- CreateIndex
CREATE INDEX "EventOutcomeDef_effectScopeId_idx" ON "EventOutcomeDef"("effectScopeId");

-- CreateIndex
CREATE INDEX "EventOutcomeDef_nextStepId_idx" ON "EventOutcomeDef"("nextStepId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_actionInstanceId_key" ON "ActiveEvent"("actionInstanceId");

-- CreateIndex
CREATE INDEX "ActiveEvent_guildId_idx" ON "ActiveEvent"("guildId");

-- CreateIndex
CREATE INDEX "ActiveEvent_eventDefId_idx" ON "ActiveEvent"("eventDefId");

-- CreateIndex
CREATE INDEX "ActiveEvent_groupId_idx" ON "ActiveEvent"("groupId");

-- CreateIndex
CREATE INDEX "ActiveEvent_currentStepId_idx" ON "ActiveEvent"("currentStepId");

-- CreateIndex
CREATE INDEX "ActiveEvent_Participant_activeEventId_idx" ON "ActiveEvent_Participant"("activeEventId");

-- CreateIndex
CREATE INDEX "ActiveEvent_Participant_catId_idx" ON "ActiveEvent_Participant"("catId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_Participant_activeEventId_userId_key" ON "ActiveEvent_Participant"("activeEventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveEvent_Participant_activeEventId_catId_key" ON "ActiveEvent_Participant"("activeEventId", "catId");

-- CreateIndex
CREATE INDEX "EventDef_Location_locationId_idx" ON "EventDef_Location"("locationId");

-- CreateIndex
CREATE INDEX "EventCooldown_eventDefId_idx" ON "EventCooldown"("eventDefId");

-- CreateIndex
CREATE INDEX "EventCooldown_groupId_idx" ON "EventCooldown"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCooldown_eventDefId_groupId_key" ON "EventCooldown"("eventDefId", "groupId");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_guildId_idx" ON "CombatEncounterDef"("guildId");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_speciesId_idx" ON "CombatEncounterDef"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatEncounterDef_guildId_name_key" ON "CombatEncounterDef"("guildId", "name");

-- CreateIndex
CREATE INDEX "CombatEncounterDef_NamedEntity_entityId_idx" ON "CombatEncounterDef_NamedEntity"("entityId");

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
CREATE INDEX "DamageType_guildId_idx" ON "DamageType"("guildId");

-- CreateIndex
CREATE INDEX "DamageType_categoryId_idx" ON "DamageType"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DamageType_guildId_name_key" ON "DamageType"("guildId", "name");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_equipmentProfileId_idx" ON "ItemEquipmentProfile_Condition"("equipmentProfileId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_conditionDefId_idx" ON "ItemEquipmentProfile_Condition"("conditionDefId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_sourceSkillId_idx" ON "ItemEquipmentProfile_Condition"("sourceSkillId");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_Condition_linkedProfileConditionId_idx" ON "ItemEquipmentProfile_Condition"("linkedProfileConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEquipmentProfile_Condition_equipmentProfileId_condition_key" ON "ItemEquipmentProfile_Condition"("equipmentProfileId", "conditionDefId", "appliesTo");

-- CreateIndex
CREATE INDEX "ItemEquipmentProfile_RequiredItem_requiredItemId_idx" ON "ItemEquipmentProfile_RequiredItem"("requiredItemId");

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
CREATE INDEX "EntityInspectionLog_patientEntityId_idx" ON "EntityInspectionLog"("patientEntityId");

-- CreateIndex
CREATE INDEX "EntityInspectionLog_medicEntityId_idx" ON "EntityInspectionLog"("medicEntityId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_entityConditionId_idx" ON "EntityTreatmentLog"("entityConditionId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_medicEntityId_idx" ON "EntityTreatmentLog"("medicEntityId");

-- CreateIndex
CREATE INDEX "EntityTreatmentLog_itemId_idx" ON "EntityTreatmentLog"("itemId");

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

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_currentPatternId_fkey" FOREIGN KEY ("currentPatternId") REFERENCES "WeatherPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_currentPatternStepId_fkey" FOREIGN KEY ("currentPatternStepId") REFERENCES "WeatherPatternStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season_EnvCondition" ADD CONSTRAINT "Season_EnvCondition_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season_EnvCondition" ADD CONSTRAINT "Season_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "DropTable_Entry" ADD CONSTRAINT "DropTable_Entry_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTable_Entry" ADD CONSTRAINT "DropTable_Entry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_DefaultCondition" ADD CONSTRAINT "Species_DefaultCondition_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_DefaultCondition" ADD CONSTRAINT "Species_DefaultCondition_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EquipmentLoadout" ADD CONSTRAINT "Species_EquipmentLoadout_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_EquipmentLoadout" ADD CONSTRAINT "Species_EquipmentLoadout_slotTypeId_fkey" FOREIGN KEY ("slotTypeId") REFERENCES "EquipmentSlotType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_Biome" ADD CONSTRAINT "Species_Biome_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species_Biome" ADD CONSTRAINT "Species_Biome_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyPart" ADD CONSTRAINT "BodyPart_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "EntityStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "EntityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_sexId_fkey" FOREIGN KEY ("sexId") REFERENCES "Sex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "SkillDef" ADD CONSTRAINT "SkillDef_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDef_Species" ADD CONSTRAINT "SkillDef_Species_skillDefId_fkey" FOREIGN KEY ("skillDefId") REFERENCES "SkillDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDef_Species" ADD CONSTRAINT "SkillDef_Species_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Skill" ADD CONSTRAINT "Entity_Skill_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_Skill" ADD CONSTRAINT "Entity_Skill_skillDefId_fkey" FOREIGN KEY ("skillDefId") REFERENCES "SkillDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCondition" ADD CONSTRAINT "EntityCondition_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ConditionDef_StatEffect" ADD CONSTRAINT "ConditionDef_StatEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_StatEffect" ADD CONSTRAINT "ConditionDef_StatEffect_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SkillEffect" ADD CONSTRAINT "ConditionDef_SkillEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SkillEffect" ADD CONSTRAINT "ConditionDef_SkillEffect_skillDefId_fkey" FOREIGN KEY ("skillDefId") REFERENCES "SkillDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "CombatEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_CombatEffect" ADD CONSTRAINT "ConditionDef_CombatEffect_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_StatModifier" ADD CONSTRAINT "EnvCondition_StatModifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_StatModifier" ADD CONSTRAINT "EnvCondition_StatModifier_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_SkillModifier" ADD CONSTRAINT "EnvCondition_SkillModifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_SkillModifier" ADD CONSTRAINT "EnvCondition_SkillModifier_skillDefId_fkey" FOREIGN KEY ("skillDefId") REFERENCES "SkillDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_parentConditionId_fkey" FOREIGN KEY ("parentConditionId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_childConditionId_fkey" FOREIGN KEY ("childConditionId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_Link" ADD CONSTRAINT "ConditionDef_Link_linkTypeId_fkey" FOREIGN KEY ("linkTypeId") REFERENCES "ConditionLinkType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SymptomTag" ADD CONSTRAINT "ConditionDef_SymptomTag_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_SymptomTag" ADD CONSTRAINT "ConditionDef_SymptomTag_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "Symptom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "ConditionDef_GrantedItem" ADD CONSTRAINT "ConditionDef_GrantedItem_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionDef_GrantedItem" ADD CONSTRAINT "ConditionDef_GrantedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRelationship" ADD CONSTRAINT "EntityRelationship_relationshipTypeId_fkey" FOREIGN KEY ("relationshipTypeId") REFERENCES "RelationshipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_standingTypeId_fkey" FOREIGN KEY ("standingTypeId") REFERENCES "GroupStandingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_groupTypeId_fkey" FOREIGN KEY ("groupTypeId") REFERENCES "GroupType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvCondition_Modifier" ADD CONSTRAINT "EnvCondition_Modifier_modTypeId_fkey" FOREIGN KEY ("modTypeId") REFERENCES "EnvModifierType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Group" ADD CONSTRAINT "Location_Group_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Group" ADD CONSTRAINT "Location_Group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Group" ADD CONSTRAINT "Location_Group_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "LocationStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBorder" ADD CONSTRAINT "LocationBorder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBorder" ADD CONSTRAINT "LocationBorder_borderingGroupId_fkey" FOREIGN KEY ("borderingGroupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biome" ADD CONSTRAINT "Biome_dropTableId_fkey" FOREIGN KEY ("dropTableId") REFERENCES "DropTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Biome" ADD CONSTRAINT "Location_Biome_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_Biome" ADD CONSTRAINT "Location_Biome_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biome_EnvCondition" ADD CONSTRAINT "Biome_EnvCondition_biomeId_fkey" FOREIGN KEY ("biomeId") REFERENCES "Biome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biome_EnvCondition" ADD CONSTRAINT "Biome_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_EnvCondition" ADD CONSTRAINT "Location_EnvCondition_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location_EnvCondition" ADD CONSTRAINT "Location_EnvCondition_envConditionId_fkey" FOREIGN KEY ("envConditionId") REFERENCES "EnvCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage_ItemType" ADD CONSTRAINT "Storage_ItemType_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage_ItemType" ADD CONSTRAINT "Storage_ItemType_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredItem" ADD CONSTRAINT "StoredItem_chosenProfileId_fkey" FOREIGN KEY ("chosenProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Type" ADD CONSTRAINT "Item_Type_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Type" ADD CONSTRAINT "Item_Type_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "ItemAction" ADD CONSTRAINT "ItemAction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction" ADD CONSTRAINT "ItemAction_itemInteractionId_fkey" FOREIGN KEY ("itemInteractionId") REFERENCES "ItemInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_symptomId_fkey" FOREIGN KEY ("symptomId") REFERENCES "Symptom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "ItemEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "ItemEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemConditionEffect" ADD CONSTRAINT "ItemConditionEffect_outputConditionDefId_fkey" FOREIGN KEY ("outputConditionDefId") REFERENCES "ConditionDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFoodProfile" ADD CONSTRAINT "ItemFoodProfile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction_Output" ADD CONSTRAINT "ItemAction_Output_itemActionId_fkey" FOREIGN KEY ("itemActionId") REFERENCES "ItemAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAction_Output" ADD CONSTRAINT "ItemAction_Output_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientType" ADD CONSTRAINT "IngredientType_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_IngredientType" ADD CONSTRAINT "Item_IngredientType_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_IngredientType" ADD CONSTRAINT "Item_IngredientType_ingredientTypeId_fkey" FOREIGN KEY ("ingredientTypeId") REFERENCES "IngredientType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_craftingInteractionId_fkey" FOREIGN KEY ("craftingInteractionId") REFERENCES "CraftingInteraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_DiscoveredRecipe" ADD CONSTRAINT "Entity_DiscoveredRecipe_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity_DiscoveredRecipe" ADD CONSTRAINT "Entity_DiscoveredRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Rank_Group" ADD CONSTRAINT "Rank_Group_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_Group" ADD CONSTRAINT "Rank_Group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_DefaultItem" ADD CONSTRAINT "Rank_DefaultItem_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank_DefaultItem" ADD CONSTRAINT "Rank_DefaultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DefaultItem" ADD CONSTRAINT "ActionType_DefaultItem_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType_DefaultItem" ADD CONSTRAINT "ActionType_DefaultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_leaderCatId_fkey" FOREIGN KEY ("leaderCatId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity" ADD CONSTRAINT "ActionInstance_Entity_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "ActionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance_Entity" ADD CONSTRAINT "ActionInstance_Entity_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef" ADD CONSTRAINT "EventDef_triggerTypeId_fkey" FOREIGN KEY ("triggerTypeId") REFERENCES "EventTriggerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "EventDef_FilthTrigger" ADD CONSTRAINT "EventDef_FilthTrigger_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_winStepId_fkey" FOREIGN KEY ("winStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_loseStepId_fkey" FOREIGN KEY ("loseStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_defaultChoiceDefId_fkey" FOREIGN KEY ("defaultChoiceDefId") REFERENCES "EventChoiceDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStepDef" ADD CONSTRAINT "EventStepDef_combatEncounterDefId_fkey" FOREIGN KEY ("combatEncounterDefId") REFERENCES "CombatEncounterDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_effectTypeId_fkey" FOREIGN KEY ("effectTypeId") REFERENCES "EventEffectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_outcomeDefId_fkey" FOREIGN KEY ("outcomeDefId") REFERENCES "EventOutcomeDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEffect" ADD CONSTRAINT "EventEffect_targetScopeId_fkey" FOREIGN KEY ("targetScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoiceDef" ADD CONSTRAINT "EventChoiceDef_stepDefId_fkey" FOREIGN KEY ("stepDefId") REFERENCES "EventStepDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoiceDef" ADD CONSTRAINT "EventChoiceDef_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoiceDef" ADD CONSTRAINT "EventChoiceDef_skillDefId_fkey" FOREIGN KEY ("skillDefId") REFERENCES "SkillDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoiceDef" ADD CONSTRAINT "EventChoiceDef_checkModeId_fkey" FOREIGN KEY ("checkModeId") REFERENCES "EventCheckMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOutcomeDef" ADD CONSTRAINT "EventOutcomeDef_choiceDefId_fkey" FOREIGN KEY ("choiceDefId") REFERENCES "EventChoiceDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOutcomeDef" ADD CONSTRAINT "EventOutcomeDef_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "EventStepDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOutcomeDef" ADD CONSTRAINT "EventOutcomeDef_effectScopeId_fkey" FOREIGN KEY ("effectScopeId") REFERENCES "EventParticipantScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "EventStepDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent" ADD CONSTRAINT "ActiveEvent_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "ActionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent_Participant" ADD CONSTRAINT "ActiveEvent_Participant_activeEventId_fkey" FOREIGN KEY ("activeEventId") REFERENCES "ActiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEvent_Participant" ADD CONSTRAINT "ActiveEvent_Participant_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Location" ADD CONSTRAINT "EventDef_Location_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDef_Location" ADD CONSTRAINT "EventDef_Location_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCooldown" ADD CONSTRAINT "EventCooldown_eventDefId_fkey" FOREIGN KEY ("eventDefId") REFERENCES "EventDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef" ADD CONSTRAINT "CombatEncounterDef_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef_NamedEntity" ADD CONSTRAINT "CombatEncounterDef_NamedEntity_combatEncounterDefId_fkey" FOREIGN KEY ("combatEncounterDefId") REFERENCES "CombatEncounterDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEncounterDef_NamedEntity" ADD CONSTRAINT "CombatEncounterDef_NamedEntity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageType" ADD CONSTRAINT "DamageType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DamageCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_conditionDefId_fkey" FOREIGN KEY ("conditionDefId") REFERENCES "ConditionDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_sourceSkillId_fkey" FOREIGN KEY ("sourceSkillId") REFERENCES "SkillDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_Condition" ADD CONSTRAINT "ItemEquipmentProfile_Condition_linkedProfileConditionId_fkey" FOREIGN KEY ("linkedProfileConditionId") REFERENCES "ItemEquipmentProfile_Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_RequiredItem" ADD CONSTRAINT "ItemEquipmentProfile_RequiredItem_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEquipmentProfile_RequiredItem" ADD CONSTRAINT "ItemEquipmentProfile_RequiredItem_requiredItemId_fkey" FOREIGN KEY ("requiredItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "EntityInspectionLog" ADD CONSTRAINT "EntityInspectionLog_patientEntityId_fkey" FOREIGN KEY ("patientEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityInspectionLog" ADD CONSTRAINT "EntityInspectionLog_medicEntityId_fkey" FOREIGN KEY ("medicEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_entityConditionId_fkey" FOREIGN KEY ("entityConditionId") REFERENCES "EntityCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_medicEntityId_fkey" FOREIGN KEY ("medicEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTreatmentLog" ADD CONSTRAINT "EntityTreatmentLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
