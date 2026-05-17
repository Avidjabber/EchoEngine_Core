export interface ConditionDefRowDto {
    row:                     number;
    codeName:                string | null;
    name:                    string | null;
    description:             string | null;
    conditionType:           string | null;
    conditionContext:        string | null;
    isDeathSaveFailureConsequence: boolean | null;
    isHidden:                boolean | null;
    isFatalAtCap:            boolean | null;
    progressionCap:          number | null;
    dailyRollDC:             number | null;
    maxDays:                 number | null;
    durationMinutes:         number | null;
    spawnThreshold:          number | null;
    contagionResistDC:       number | null;
    energyDebuf:             number | null;
    blocksVerbal:            boolean | null;
    blocksSomatic:           boolean | null;
}

export interface ConditionStatEffectRowDto {
    row:               number;
    conditionCodeName: string | null;
    stat:              string | null;
    amount:            number | null;
}

export interface ConditionProfEffectRowDto {
    row:               number;
    conditionCodeName: string | null;
    proficiencyCode:   string | null;
    amount:            number | null;
    hasDisadvantage:   boolean | null;
}

export interface ConditionCombatEffectRowDto {
    row:               number;
    conditionCodeName: string | null;
    effectType:        string | null;
    stat:              string | null;
    flatModifier:      number | null;
}

export interface ConditionCombatStatEffectRowDto {
    row:               number;
    conditionCodeName: string | null;
    effectDefCode:     string | null;
    applicationChance: number | null;
}

export interface ConditionDamageModifierRowDto {
    row:               number;
    conditionCodeName: string | null;
    damageType:        string | null;
    isResistant:       boolean | null;
}

export interface ConditionEnvRuleRowDto {
    row:               number;
    conditionCodeName: string | null;
    envConditionCode:  string | null;
    relationType:      string | null;
    value:             number | null;
}

export interface ConditionSymptomTagRowDto {
    row:               number;
    conditionCodeName: string | null;
    symptom:           string | null;
}

export interface ConditionGrantedItemRowDto {
    row:                number;
    conditionCodeName:  string | null;
    itemCodeName:       string | null;
    grantedToSource:    boolean | null;
    usesPerApplication: number | null;
    minProgression:     number | null;
    maxProgression:     number | null;
}

export interface ConditionLinkRowDto {
    row:                 number;
    parentConditionCode: string | null;
    childConditionCode:  string | null;
    relationType:        string | null;
    weight:              number | null;
}

export interface ConditionBehaviorEffectRowDto {
    row:                number;
    conditionCodeName:  string | null;
    actionType:         string | null;
    perspective:        string | null;
    behaviorType:       string | null;
    triggerChance:      number | null;
    redirectTarget:     string | null;
    biasWeight:         number | null;
    restrictActionType: string | null;
    restrictIsBlock:    boolean | null;
}

export interface UploadConditionPackDto {
    guildId:           string;
    conditions:        ConditionDefRowDto[];
    statEffects:       ConditionStatEffectRowDto[];
    profEffects:       ConditionProfEffectRowDto[];
    combatEffects:     ConditionCombatEffectRowDto[];
    combatStatEffects: ConditionCombatStatEffectRowDto[];
    damageModifiers:   ConditionDamageModifierRowDto[];
    envRules:          ConditionEnvRuleRowDto[];
    symptomTags:       ConditionSymptomTagRowDto[];
    grantedItems:      ConditionGrantedItemRowDto[];
    links:             ConditionLinkRowDto[];
    behaviorEffects:   ConditionBehaviorEffectRowDto[];
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface ConditionSavedRow {
    row:      number;
    codeName: string;
    name:     string;
}

export interface ConditionOverwrittenRow {
    row:      number;
    codeName: string;
    oldName:  string;
    newName:  string;
}

export interface UploadConditionPackResult {
    saved:      ConditionSavedRow[];
    overwrites: ConditionOverwrittenRow[];
    errors:     RowError[];
}

export interface ConditionTemplateData {
    conditionTypes:         string[];
    conditionContexts:      string[];
    stats:                  string[];
    proficiencyCodes:       string[];
    combatEffectTypes:      string[];
    combatStatEffectCodes:  string[];
    damageTypes:            string[];
    envConditionCodes:      string[];
    symptoms:               string[];
    itemCodes:              string[];
    itemActionTypes:        string[];
    behaviorTypes:          string[];
    redirectTargets:        string[];
    conditionRelationTypes: string[];
    existingConditions:     string[];
}

export interface ResetConditionPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
