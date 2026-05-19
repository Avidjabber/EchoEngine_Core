export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadItemPackNewResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
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

export interface DownloadItemRow {
    codeName:        string;
    name:            string;
    description:     string | null;
    types:           string;
    measurementType: string | null;
    averageWeight:   number;
    weightVariance:  number;
    averageVolume:   number;
    rotCap:          number | null;
    maxDurability:   number | null;
    maxUses:         number | null;
    maxDailyUses:    number | null;
    fuelValue:       number | null;
    fuelType:        string | null;
    isEphemeral:     boolean;
}

export interface DownloadEquipmentRow {
    itemCodeName:          string;
    slotType:              string;
    slotCost:              number;
    label:                 string | null;
    acModifier:            number;
    damageDiceCount:       number | null;
    damageDiceSides:       number | null;
    damageType:            string | null;
    elementalDiceCount:    number | null;
    elementalDiceSides:    number | null;
    elementalDamageType:   string | null;
    healDiceCount:         number | null;
    healDiceSides:         number | null;
    isMagical:             boolean;
    actionCategory:        string | null;
    actionType:            string | null;
    targetScope:           string | null;
    cooldownRounds:        number;
    durationRounds:        number;
    behaviorEffectType:    string | null;
    flatModifier:          number | null;
    percentModifier:       number | null;
    isReactionAction:      boolean;
    requiresVerbal:        boolean;
    requiresSomatic:       boolean;
    allowedInSpar:         boolean;
    usageContext:          string;
    hitStat:               string | null;
    damageStat:            string | null;
    healStat:              string | null;
    hitBonus:              number;
    damageBonus:           number;
    healBonus:             number;
    savingThrowStat:       string | null;
    saveDC:                number;
    triggersEventDef:      string | null;
    triggerDC:             number;
    outOfCombatMaxTargets: number | null;
    summonSpecies:         string | null;
    summonDiceCount:       number | null;
    summonDiceSides:       number | null;
    attackCount:           number;
}

export interface DownloadFoodRow {
    itemCodeName:          string;
    meatNutritionPerGram:  number;
    meatHydrationPerGram:  number;
    plantNutritionPerGram: number;
    plantHydrationPerGram: number;
}

export interface DownloadActionRow {
    itemCodeName:  string;
    interaction:   string;
    energyCost:    number;
    consumedOnUse: boolean;
}

export interface DownloadEffectRow {
    itemCodeName:  string;
    interaction:   string;
    symptom:       string;
    relationType:  string;
    effectiveness: number;
}

export interface ItemDownloadData {
    items:        DownloadItemRow[];
    equipment:    DownloadEquipmentRow[];
    food:         DownloadFoodRow[];
    actions:      DownloadActionRow[];
    effects:      DownloadEffectRow[];
    templateData: ItemTemplateData;
}
