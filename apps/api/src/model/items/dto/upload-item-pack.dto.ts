export interface ItemRowDto {
    row:             number;
    codeName:        string | null;
    name:            string | null;
    description:     string | null;
    types:           string | null; // comma-separated ItemType names
    measurementType: string | null;
    averageWeight:   number | null;
    weightVariance:  number | null;
    averageVolume:   number | null;
    rotCap:          number | null;
    maxDurability:   number | null;
    maxUses:         number | null;
    maxDailyUses:    number | null;
    fuelValue:       number | null;
    fuelType:        string | null;
    isEphemeral:     boolean | null;
}

export interface ItemEquipmentRowDto {
    row:                   number;
    itemCodeName:          string | null;
    slotType:              string | null;
    slotCost:              number | null;
    label:                 string | null;
    acModifier:            number | null;
    damageDiceCount:       number | null;
    damageDiceSides:       number | null;
    damageType:            string | null;
    elementalDiceCount:    number | null;
    elementalDiceSides:    number | null;
    elementalDamageType:   string | null;
    healDiceCount:         number | null;
    healDiceSides:         number | null;
    isMagical:             boolean | null;
    actionCategory:        string | null;
    actionType:            string | null;
    targetScope:           string | null;
    cooldownRounds:        number | null;
    durationRounds:        number | null;
    behaviorEffectType:    string | null;
    flatModifier:          number | null;
    percentModifier:       number | null;
    isReactionAction:      boolean | null;
    requiresVerbal:        boolean | null;
    requiresSomatic:       boolean | null;
    allowedInSpar:         boolean | null;
    usageContext:          string | null;
    hitStat:               string | null;
    damageStat:            string | null;
    healStat:              string | null;
    hitBonus:              number | null;
    damageBonus:           number | null;
    healBonus:             number | null;
    savingThrowStat:       string | null;
    saveDC:                number | null;
    triggersEventDef:      string | null;
    triggerDC:             number | null;
    outOfCombatMaxTargets: number | null;
    summonSpecies:         string | null;
    summonDiceCount:       number | null;
    summonDiceSides:       number | null;
    attackCount:           number | null;
}

export interface ItemFoodRowDto {
    row:                   number;
    itemCodeName:          string | null;
    meatNutritionPerGram:  number | null;
    meatHydrationPerGram:  number | null;
    plantNutritionPerGram: number | null;
    plantHydrationPerGram: number | null;
}

export interface ItemActionRowDto {
    row:          number;
    itemCodeName: string | null;
    interaction:  string | null;
    energyCost:   number | null;
    consumedOnUse: boolean | null;
}

export interface ItemEffectRowDto {
    row:          number;
    itemCodeName: string | null;
    interaction:  string | null;
    symptom:      string | null;
    relationType: string | null;
    effectiveness: number | null;
}

export interface UploadItemPackDto {
    guildId:   string;
    items:     ItemRowDto[];
    equipment: ItemEquipmentRowDto[];
    food:      ItemFoodRowDto[];
    actions:   ItemActionRowDto[];
    effects:   ItemEffectRowDto[];
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface ItemSavedRow {
    row:      number;
    codeName: string;
    name:     string;
}

export interface ItemOverwrittenRow {
    row:     number;
    codeName: string;
    oldName: string;
    newName: string;
}

export interface UploadItemPackResult {
    saved:      ItemSavedRow[];
    overwrites: ItemOverwrittenRow[];
    errors:     RowError[];
}

export interface ItemTemplateData {
    measurementTypes:    string[];
    fuelTypes:           string[];
    itemTypes:           string[];
    slotTypes:           string[];
    damageTypes:         string[];
    stats:               string[];
    actionCategories:    string[];
    itemActionTypes:     string[];
    targetScopes:        string[];
    behaviorEffectTypes: string[];
    itemInteractions:    string[];
    symptoms:            string[];
    relationTypes:       string[];
    speciesCodes:        string[];
    eventDefCodes:       string[];
    existingItems:       string[];
}

export interface ResetItemPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
