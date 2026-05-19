import { apiClient } from '../api';

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface ConditionPackUploadResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
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

export interface DownloadConditionRow {
    codeName:                      string;
    name:                          string;
    description:                   string | null;
    conditionType:                 string;
    conditionContext:              string;
    isDeathSaveFailureConsequence: boolean;
    isHidden:                      boolean;
    isFatalAtCap:                  boolean;
    progressionCap:                number | null;
    dailyRollDC:                   number | null;
    maxDays:                       number | null;
    durationMinutes:               number | null;
    spawnThreshold:                number | null;
    contagionResistDC:             number | null;
    energyDebuf:                   number | null;
    blocksVerbal:                  boolean;
    blocksSomatic:                 boolean;
}

export interface DownloadStatEffectRow    { conditionCodeName: string; stat: string; amount: number }
export interface DownloadProfEffectRow    { conditionCodeName: string; proficiencyCode: string; amount: number | null; hasDisadvantage: boolean }
export interface DownloadCombatEffectRow  { conditionCodeName: string; effectType: string; stat: string | null; flatModifier: number | null }
export interface DownloadCombatStatEffectRow { conditionCodeName: string; effectDefCode: string; applicationChance: number }
export interface DownloadDamageModifierRow   { conditionCodeName: string; damageType: string; isResistant: boolean }
export interface DownloadEnvRuleRow      { conditionCodeName: string; envConditionCode: string; relationType: string; value: number }
export interface DownloadSymptomTagRow   { conditionCodeName: string; symptom: string }
export interface DownloadGrantedItemRow  { conditionCodeName: string; itemCodeName: string; grantedToSource: boolean; usesPerApplication: number | null; minProgression: number | null; maxProgression: number | null }
export interface DownloadLinkRow         { parentConditionCode: string; childConditionCode: string; relationType: string; weight: number }
export interface DownloadBehaviorEffectRow { conditionCodeName: string; actionType: string | null; perspective: string; behaviorType: string; triggerChance: number; redirectTarget: string | null; biasWeight: number | null; restrictActionType: string | null; restrictIsBlock: boolean }

export interface ConditionDownloadData {
    conditions:        DownloadConditionRow[];
    statEffects:       DownloadStatEffectRow[];
    profEffects:       DownloadProfEffectRow[];
    combatEffects:     DownloadCombatEffectRow[];
    combatStatEffects: DownloadCombatStatEffectRow[];
    damageModifiers:   DownloadDamageModifierRow[];
    envRules:          DownloadEnvRuleRow[];
    symptomTags:       DownloadSymptomTagRow[];
    grantedItems:      DownloadGrantedItemRow[];
    links:             DownloadLinkRow[];
    behaviorEffects:   DownloadBehaviorEffectRow[];
    templateData:      ConditionTemplateData;
}

export function uploadConditionPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<ConditionPackUploadResult>(
        '/model/conditions/upload',
        { guildId },
        { name: 'conditions.xlsx', buffer: fileBuffer },
        120_000,
    );
}

export function fetchConditionTemplateData(guildId: string) {
    return apiClient.get<ConditionTemplateData>('/model/conditions/template-data', { guildId });
}

export function fetchConditionDownloadData(guildId: string) {
    return apiClient.get<ConditionDownloadData>('/model/conditions/download', { guildId });
}

export function resetConditionPack(guildId: string) {
    return apiClient.post<ResetConditionPackResult>('/model/conditions/reset', { guildId });
}
