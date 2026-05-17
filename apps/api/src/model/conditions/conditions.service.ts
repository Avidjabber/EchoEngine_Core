import { Injectable } from '@nestjs/common';
import {
    ConditionDefRowDto,
    ConditionStatEffectRowDto,
    ConditionProfEffectRowDto,
    ConditionCombatEffectRowDto,
    ConditionCombatStatEffectRowDto,
    ConditionDamageModifierRowDto,
    ConditionEnvRuleRowDto,
    ConditionSymptomTagRowDto,
    ConditionGrantedItemRowDto,
    ConditionLinkRowDto,
    ConditionBehaviorEffectRowDto,
    UploadConditionPackDto,
    UploadConditionPackResult,
    ConditionTemplateData,
    ResetConditionPackResult,
    ConditionSavedRow,
    ConditionOverwrittenRow,
    RowError,
} from './dto/upload-condition-pack.dto';
import { ConditionsRepository, UpsertConditionData } from './conditions.repository';
import { validateName, validateCodeName, validateDescription } from '../../utils/contentFilter';

function rowInput(...parts: (string | number | null | undefined)[]): string {
    return parts.map(p => (p === null || p === undefined) ? '?' : String(p)).join(' | ');
}

interface StatEffectCandidate {
    statId: number;
    amount: number;
}

interface ProfEffectCandidate {
    proficiencyDefId: number;
    amount:           number | null;
    hasDisadvantage:  boolean;
}

interface CombatEffectCandidate {
    effectTypeId: number;
    statId:       number | null;
    flatModifier: number | null;
}

interface CombatStatEffectCandidate {
    effectDefId:       number;
    applicationChance: number;
}

interface DamageModifierCandidate {
    damageTypeId: number;
    isResistant:  boolean;
}

interface EnvRuleCandidate {
    envConditionId: number;
    relationTypeId: number;
    value:          number;
}

interface SymptomTagCandidate {
    symptomId: number;
}

interface GrantedItemCandidate {
    itemId:             number;
    grantedToSource:    boolean;
    usesPerApplication: number | null;
    minProgression:     number | null;
    maxProgression:     number | null;
}

interface BehaviorEffectCandidate {
    actionTypeId:         number | null;
    perspective:          string;
    behaviorTypeId:       number;
    triggerChance:        number;
    redirectTargetId:     number | null;
    biasWeight:           number | null;
    restrictActionTypeId: number | null;
    restrictIsBlock:      boolean;
}

interface LinkCandidate {
    childConditionCode: string;
    relationTypeId:     number;
    weight:             number;
    row:                number;
}

interface ConditionCandidate {
    dto:                     ConditionDefRowDto;
    codeName:                string;
    name:                    string;
    description:             string | null;
    conditionTypeId:         number;
    conditionContextId:      number;
    isDeathSaveFailureConsequence: boolean;
    isHidden:                boolean;
    isFatalAtCap:            boolean;
    progressionCap:          number | null;
    dailyRollDC:             number | null;
    maxDays:                 number | null;
    durationMinutes:         number | null;
    spawnThreshold:          number | null;
    contagionResistDC:       number | null;
    energyDebuf:             number | null;
    blocksVerbal:            boolean;
    blocksSomatic:           boolean;
    statEffects:       StatEffectCandidate[];
    profEffects:       ProfEffectCandidate[];
    combatEffects:     CombatEffectCandidate[];
    combatStatEffects: CombatStatEffectCandidate[];
    damageModifiers:   DamageModifierCandidate[];
    envRules:          EnvRuleCandidate[];
    symptomTags:       SymptomTagCandidate[];
    grantedItems:      GrantedItemCandidate[];
    links:             LinkCandidate[];
    behaviorEffects:   BehaviorEffectCandidate[];
    existing:          { id: number; codeName: string; name: string } | undefined;
}

@Injectable()
export class ConditionsService {
    constructor(private readonly repo: ConditionsRepository) {}

    async getTemplateData(guildId: string): Promise<ConditionTemplateData> {
        const [
            conditionTypes, conditionContexts, stats, proficiencyDefs, combatEffectTypes,
            combatStatEffectDefs, damageTypes, envConditions, symptoms, items,
            itemActionTypes, behaviorTypes, redirectTargets, conditionRelationTypes, existingConditions,
        ] = await Promise.all([
            this.repo.findAllConditionTypes(),
            this.repo.findAllConditionContexts(),
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(guildId),
            this.repo.findAllCombatEffectTypes(),
            this.repo.findGuildCombatStatEffectDefs(guildId),
            this.repo.findAllDamageTypes(),
            this.repo.findAllEnvConditions(),
            this.repo.findAllSymptoms(),
            this.repo.findGuildItems(guildId),
            this.repo.findAllItemActionTypes(),
            this.repo.findAllConditionBehaviorTypes(),
            this.repo.findAllBehaviorRedirectTargets(),
            this.repo.findConditionRelationTypes(),
            this.repo.findGuildConditions(guildId),
        ]);

        return {
            conditionTypes:         conditionTypes.map(x => x.name),
            conditionContexts:      conditionContexts.map(x => x.name),
            stats:                  stats.map(x => x.name),
            proficiencyCodes:       proficiencyDefs.map(x => x.codeName),
            combatEffectTypes:      combatEffectTypes.map(x => x.name),
            combatStatEffectCodes:  combatStatEffectDefs.map(x => x.codeName),
            damageTypes:            damageTypes.map(x => x.name),
            envConditionCodes:      envConditions.map(x => x.codeName),
            symptoms:               symptoms.map(x => x.name),
            itemCodes:              items.map(x => x.codeName),
            itemActionTypes:        itemActionTypes.map(x => x.name),
            behaviorTypes:          behaviorTypes.map(x => x.name),
            redirectTargets:        redirectTargets.map(x => x.name),
            conditionRelationTypes: conditionRelationTypes.map(x => x.name),
            existingConditions:     existingConditions.map(x => x.codeName),
        };
    }

    async resetPack(guildId: string): Promise<ResetConditionPackResult> {
        const conditions = await this.repo.findGuildConditions(guildId);
        const deletable  = conditions.filter(c => !c.isEngineOwned);

        const deleted: ResetConditionPackResult['deleted'] = [];
        const failed:  ResetConditionPackResult['failed']  = [];

        const results = await Promise.allSettled(deletable.map(c => this.repo.deleteConditionById(c.id)));

        results.forEach((result, i) => {
            const condition = deletable[i];
            if (result.status === 'fulfilled') {
                deleted.push({ codeName: condition.codeName, name: condition.name });
            } else {
                failed.push({ codeName: condition.codeName, name: condition.name, reason: 'Still in use — cannot be removed' });
            }
        });

        return { deleted, failed };
    }

    async uploadPack(dto: UploadConditionPackDto): Promise<UploadConditionPackResult> {
        const [
            conditionTypes, conditionContexts, stats, proficiencyDefs, combatEffectTypes,
            combatStatEffectDefs, damageTypes, envConditions, symptoms, items,
            itemActionTypes, behaviorTypes, redirectTargets, conditionRelationTypes, existingConditions,
        ] = await Promise.all([
            this.repo.findAllConditionTypes(),
            this.repo.findAllConditionContexts(),
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(dto.guildId),
            this.repo.findAllCombatEffectTypes(),
            this.repo.findGuildCombatStatEffectDefs(dto.guildId),
            this.repo.findAllDamageTypes(),
            this.repo.findAllEnvConditions(),
            this.repo.findAllSymptoms(),
            this.repo.findGuildItems(dto.guildId),
            this.repo.findAllItemActionTypes(),
            this.repo.findAllConditionBehaviorTypes(),
            this.repo.findAllBehaviorRedirectTargets(),
            this.repo.findConditionRelationTypes(),
            this.repo.findGuildConditions(dto.guildId),
        ]);

        const conditionTypeMap      = new Map(conditionTypes.map(x      => [x.name.toLowerCase(),     x]));
        const conditionContextMap   = new Map(conditionContexts.map(x   => [x.name.toLowerCase(),     x]));
        const statMap               = new Map(stats.map(x               => [x.name.toLowerCase(),     x]));
        const proficiencyMap        = new Map(proficiencyDefs.map(x     => [x.codeName.toLowerCase(), x]));
        const combatEffectTypeMap   = new Map(combatEffectTypes.map(x   => [x.name.toLowerCase(),     x]));
        const combatStatEffectMap   = new Map(combatStatEffectDefs.map(x => [x.codeName.toLowerCase(), x]));
        const damageTypeMap         = new Map(damageTypes.map(x         => [x.name.toLowerCase(),     x]));
        const envConditionMap       = new Map(envConditions.map(x       => [x.codeName.toLowerCase(), x]));
        const symptomMap            = new Map(symptoms.map(x            => [x.name.toLowerCase(),     x]));
        const itemMap               = new Map(items.map(x               => [x.codeName.toLowerCase(), x]));
        const itemActionTypeMap     = new Map(itemActionTypes.map(x     => [x.name.toLowerCase(),     x]));
        const behaviorTypeMap       = new Map(behaviorTypes.map(x       => [x.name.toLowerCase(),     x]));
        const redirectTargetMap     = new Map(redirectTargets.map(x     => [x.name.toLowerCase(),     x]));
        const conditionRelTypeMap   = new Map(conditionRelationTypes.map(x => [x.name.toLowerCase(), x]));
        const existingMap           = new Map(existingConditions.map(x  => [x.codeName.toLowerCase(), x]));

        // ── Index sub-rows by conditionCodeName ───────────────────────────────
        const statEffectsByCode       = indexByCode(dto.statEffects,       r => r.conditionCodeName);
        const profEffectsByCode       = indexByCode(dto.profEffects,       r => r.conditionCodeName);
        const combatEffectsByCode     = indexByCode(dto.combatEffects,     r => r.conditionCodeName);
        const combatStatEffectsByCode = indexByCode(dto.combatStatEffects, r => r.conditionCodeName);
        const damageModsByCode        = indexByCode(dto.damageModifiers,   r => r.conditionCodeName);
        const envRulesByCode          = indexByCode(dto.envRules,          r => r.conditionCodeName);
        const symptomTagsByCode       = indexByCode(dto.symptomTags,       r => r.conditionCodeName);
        const grantedItemsByCode      = indexByCode(dto.grantedItems,      r => r.conditionCodeName);
        const linksByCode             = indexByCode(dto.links,             r => r.parentConditionCode);
        const behaviorEffectsByCode   = indexByCode(dto.behaviorEffects,   r => r.conditionCodeName);

        // ── Validate main condition rows ──────────────────────────────────────
        const errors:     RowError[]           = [];
        const candidates: ConditionCandidate[] = [];
        const seen = new Map<string, number>();

        for (const row of dto.conditions) {
            const input = rowInput(row.codeName, row.name);

            if (!row.codeName || !row.name || !row.conditionType || !row.conditionContext) {
                const missing = ([
                    !row.codeName        && 'code_name',
                    !row.name            && 'name',
                    !row.conditionType   && 'condition_type',
                    !row.conditionContext && 'condition_context',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const codeNameCheck = validateCodeName(row.codeName);
            if (!codeNameCheck.valid) {
                errors.push({ row: row.row, input, message: `code_name ${codeNameCheck.reason}` });
                continue;
            }

            const nameCheck = validateName(row.name);
            if (!nameCheck.valid) {
                errors.push({ row: row.row, input, message: `name ${nameCheck.reason}` });
                continue;
            }

            let cleanDescription: string | null = null;
            if (row.description) {
                const descCheck = validateDescription(row.description);
                if (!descCheck.valid) {
                    errors.push({ row: row.row, input, message: `description ${descCheck.reason}` });
                    continue;
                }
                cleanDescription = descCheck.value;
            }

            const cleanCodeName = codeNameCheck.value;

            if (seen.has(cleanCodeName)) {
                errors.push({ row: row.row, input, message: `Duplicate of row ${seen.get(cleanCodeName)}` });
                continue;
            }
            seen.set(cleanCodeName, row.row);

            if (existingMap.get(cleanCodeName)?.isEngineOwned) {
                errors.push({ row: row.row, input, message: `This is an engine-owned condition and cannot be modified` });
                continue;
            }

            const conditionType = conditionTypeMap.get(row.conditionType.toLowerCase());
            if (!conditionType) {
                errors.push({ row: row.row, input, message: `'${row.conditionType}' is not a valid condition_type` });
                continue;
            }

            const conditionContext = conditionContextMap.get(row.conditionContext.toLowerCase());
            if (!conditionContext) {
                errors.push({ row: row.row, input, message: `'${row.conditionContext}' is not a valid condition_context` });
                continue;
            }

            // ── Sub-row validation ─────────────────────────────────────────────

            const statEffects = validateStatEffects(
                statEffectsByCode.get(cleanCodeName) ?? [],
                statMap, errors,
            );

            const profEffects = validateProfEffects(
                profEffectsByCode.get(cleanCodeName) ?? [],
                proficiencyMap, errors,
            );

            const combatEffects = validateCombatEffects(
                combatEffectsByCode.get(cleanCodeName) ?? [],
                combatEffectTypeMap, statMap, errors,
            );

            const combatStatEffects = validateCombatStatEffects(
                combatStatEffectsByCode.get(cleanCodeName) ?? [],
                combatStatEffectMap, errors,
            );

            const damageModifiers = validateDamageModifiers(
                damageModsByCode.get(cleanCodeName) ?? [],
                damageTypeMap, errors,
            );

            const envRules = validateEnvRules(
                envRulesByCode.get(cleanCodeName) ?? [],
                envConditionMap, conditionRelTypeMap, errors,
            );

            const symptomTags = validateSymptomTags(
                symptomTagsByCode.get(cleanCodeName) ?? [],
                symptomMap, errors,
            );

            const grantedItems = validateGrantedItems(
                grantedItemsByCode.get(cleanCodeName) ?? [],
                itemMap, errors,
            );

            const links = validateLinks(
                linksByCode.get(cleanCodeName) ?? [],
                conditionRelTypeMap, errors,
            );

            const behaviorEffects = validateBehaviorEffects(
                behaviorEffectsByCode.get(cleanCodeName) ?? [],
                itemActionTypeMap, behaviorTypeMap, redirectTargetMap, errors,
            );

            candidates.push({
                dto:                     row,
                codeName:                cleanCodeName,
                name:                    nameCheck.value,
                description:             cleanDescription,
                conditionTypeId:         conditionType.id,
                conditionContextId:      conditionContext.id,
                isDeathSaveFailureConsequence: row.isDeathSaveFailureConsequence ?? false,
                isHidden:                row.isHidden                ?? false,
                isFatalAtCap:            row.isFatalAtCap            ?? false,
                progressionCap:          row.progressionCap          ?? null,
                dailyRollDC:             row.dailyRollDC             ?? null,
                maxDays:                 row.maxDays                 ?? null,
                durationMinutes:         row.durationMinutes         ?? null,
                spawnThreshold:          row.spawnThreshold          ?? null,
                contagionResistDC:       row.contagionResistDC       ?? null,
                energyDebuf:             row.energyDebuf             ?? null,
                blocksVerbal:            row.blocksVerbal            ?? false,
                blocksSomatic:           row.blocksSomatic           ?? false,
                statEffects,
                profEffects,
                combatEffects,
                combatStatEffects,
                damageModifiers,
                envRules,
                symptomTags,
                grantedItems,
                links,
                behaviorEffects,
                existing: existingMap.get(cleanCodeName),
            });
        }

        // Orphaned sub-rows that reference a condition not in the conditions sheet
        checkOrphans('stat_effects',        statEffectsByCode,       seen, errors);
        checkOrphans('prof_effects',         profEffectsByCode,       seen, errors);
        checkOrphans('combat_effects',       combatEffectsByCode,     seen, errors);
        checkOrphans('combat_stat_effects',  combatStatEffectsByCode, seen, errors);
        checkOrphans('damage_modifiers',     damageModsByCode,        seen, errors);
        checkOrphans('env_rules',            envRulesByCode,          seen, errors);
        checkOrphans('symptom_tags',         symptomTagsByCode,       seen, errors);
        checkOrphans('granted_items',        grantedItemsByCode,      seen, errors);
        checkOrphans('links',                linksByCode,             seen, errors);
        checkOrphans('behavior_effects',     behaviorEffectsByCode,   seen, errors);

        // ── Upsert all candidates, collect id map for link resolution ─────────
        const saved:      ConditionSavedRow[]       = [];
        const overwrites: ConditionOverwrittenRow[] = [];
        const uploadedIdMap = new Map<string, number>();

        for (const c of candidates) {
            try {
                const upsertData: UpsertConditionData = {
                    guildId:                 dto.guildId,
                    codeName:                c.codeName,
                    name:                    c.name,
                    description:             c.description,
                    conditionTypeId:         c.conditionTypeId,
                    conditionContextId:      c.conditionContextId,
                    isDeathSaveFailureConsequence: c.isDeathSaveFailureConsequence,
                    isHidden:                c.isHidden,
                    isFatalAtCap:            c.isFatalAtCap,
                    progressionCap:          c.progressionCap,
                    dailyRollDC:             c.dailyRollDC,
                    maxDays:                 c.maxDays,
                    durationMinutes:         c.durationMinutes,
                    spawnThreshold:          c.spawnThreshold,
                    contagionResistDC:       c.contagionResistDC,
                    energyDebuf:             c.energyDebuf,
                    blocksVerbal:            c.blocksVerbal,
                    blocksSomatic:           c.blocksSomatic,
                    statEffects:       c.statEffects,
                    profEffects:       c.profEffects,
                    combatEffects:     c.combatEffects,
                    combatStatEffects: c.combatStatEffects,
                    damageModifiers:   c.damageModifiers,
                    envRules:          c.envRules,
                    symptomTags:       c.symptomTags,
                    grantedItems:      c.grantedItems,
                    behaviorEffects:   c.behaviorEffects,
                };

                const result = await this.repo.upsertCondition(upsertData);
                uploadedIdMap.set(c.codeName, result.id);

                saved.push({ row: c.dto.row, codeName: c.codeName, name: c.name });
                if (c.existing) {
                    overwrites.push({
                        row:      c.dto.row,
                        codeName: c.codeName,
                        oldName:  c.existing.name,
                        newName:  c.name,
                    });
                }
            } catch {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName, c.name), message: 'Failed to save to database' });
            }
        }

        // ── Save links (two-phase: needs IDs of all just-saved conditions) ────
        const combinedIdMap = new Map([
            ...existingConditions.map(x => [x.codeName.toLowerCase(), x.id] as [string, number]),
            ...uploadedIdMap.entries(),
        ]);

        for (const c of candidates) {
            if (c.links.length === 0) continue;
            const conditionId = uploadedIdMap.get(c.codeName);
            if (conditionId === undefined) continue; // save failed — skip links

            const resolvedLinks: Array<{ childConditionId: number; relationTypeId: number; weight: number }> = [];

            for (const link of c.links) {
                const childId = combinedIdMap.get(link.childConditionCode.toLowerCase());
                if (childId === undefined) {
                    errors.push({
                        row:     link.row,
                        input:   rowInput(c.codeName, link.childConditionCode),
                        message: `child condition '${link.childConditionCode}' does not exist in this upload or the guild`,
                    });
                    continue;
                }
                resolvedLinks.push({ childConditionId: childId, relationTypeId: link.relationTypeId, weight: link.weight });
            }

            try {
                await this.repo.upsertConditionLinks({ conditionId, links: resolvedLinks });
            } catch {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName), message: 'Failed to save condition links' });
            }
        }

        errors.sort((a, b) => a.row - b.row);
        return { saved, overwrites, errors };
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function indexByCode<T>(rows: T[], getCode: (r: T) => string | null): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows) {
        const key = (getCode(row) ?? '').toLowerCase();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
    }
    return map;
}

function checkOrphans(
    sheetName: string,
    indexedRows: Map<string, unknown[]>,
    seenCodes: Map<string, number>,
    errors: RowError[],
) {
    for (const [key, rows] of indexedRows) {
        if (!seenCodes.has(key) && (rows as unknown[]).length > 0) {
            errors.push({ row: 0, input: key, message: `${sheetName} sheet references condition '${key}' which is not in the conditions sheet` });
        }
    }
}

function validateStatEffects(
    rows: ConditionStatEffectRowDto[],
    statMap: Map<string, { id: number }>,
    errors: RowError[],
): StatEffectCandidate[] {
    const valid: StatEffectCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.stat, row.amount);
        if (!row.stat || row.amount === null) {
            const missing = ([!row.stat && 'stat', row.amount === null && 'amount'] as (string | false)[]).filter(Boolean).join(', ');
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
            continue;
        }
        const stat = statMap.get(row.stat.toLowerCase());
        if (!stat) {
            errors.push({ row: row.row, input, message: `'${row.stat}' is not a valid stat` });
            continue;
        }
        valid.push({ statId: stat.id, amount: row.amount });
    }
    return valid;
}

function validateProfEffects(
    rows: ConditionProfEffectRowDto[],
    proficiencyMap: Map<string, { id: number }>,
    errors: RowError[],
): ProfEffectCandidate[] {
    const valid: ProfEffectCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.proficiencyCode);
        if (!row.proficiencyCode) {
            errors.push({ row: row.row, input, message: 'Missing required field: proficiency_code' });
            continue;
        }
        const prof = proficiencyMap.get(row.proficiencyCode.toLowerCase());
        if (!prof) {
            errors.push({ row: row.row, input, message: `'${row.proficiencyCode}' is not a valid proficiency codeName` });
            continue;
        }
        valid.push({ proficiencyDefId: prof.id, amount: row.amount ?? null, hasDisadvantage: row.hasDisadvantage ?? false });
    }
    return valid;
}

function validateCombatEffects(
    rows: ConditionCombatEffectRowDto[],
    combatEffectTypeMap: Map<string, { id: number }>,
    statMap: Map<string, { id: number }>,
    errors: RowError[],
): CombatEffectCandidate[] {
    const valid: CombatEffectCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.effectType);
        if (!row.effectType) {
            errors.push({ row: row.row, input, message: 'Missing required field: effect_type' });
            continue;
        }
        const effectType = combatEffectTypeMap.get(row.effectType.toLowerCase());
        if (!effectType) {
            errors.push({ row: row.row, input, message: `'${row.effectType}' is not a valid combat effect_type` });
            continue;
        }
        let statId: number | null = null;
        if (row.stat) {
            const stat = statMap.get(row.stat.toLowerCase());
            if (!stat) {
                errors.push({ row: row.row, input, message: `'${row.stat}' is not a valid stat` });
                continue;
            }
            statId = stat.id;
        }
        valid.push({ effectTypeId: effectType.id, statId, flatModifier: row.flatModifier ?? null });
    }
    return valid;
}

function validateCombatStatEffects(
    rows: ConditionCombatStatEffectRowDto[],
    combatStatEffectMap: Map<string, { id: number }>,
    errors: RowError[],
): CombatStatEffectCandidate[] {
    const valid: CombatStatEffectCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.effectDefCode);
        if (!row.effectDefCode) {
            errors.push({ row: row.row, input, message: 'Missing required field: effect_def_code' });
            continue;
        }
        const effectDef = combatStatEffectMap.get(row.effectDefCode.toLowerCase());
        if (!effectDef) {
            errors.push({ row: row.row, input, message: `'${row.effectDefCode}' is not a valid combat stat effect def codeName` });
            continue;
        }
        valid.push({ effectDefId: effectDef.id, applicationChance: row.applicationChance ?? 1.0 });
    }
    return valid;
}

function validateDamageModifiers(
    rows: ConditionDamageModifierRowDto[],
    damageTypeMap: Map<string, { id: number }>,
    errors: RowError[],
): DamageModifierCandidate[] {
    const valid: DamageModifierCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.damageType);
        if (!row.damageType || row.isResistant === null) {
            const missing = ([!row.damageType && 'damage_type', row.isResistant === null && 'is_resistant'] as (string | false)[]).filter(Boolean).join(', ');
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
            continue;
        }
        const damageType = damageTypeMap.get(row.damageType.toLowerCase());
        if (!damageType) {
            errors.push({ row: row.row, input, message: `'${row.damageType}' is not a valid damage_type` });
            continue;
        }
        valid.push({ damageTypeId: damageType.id, isResistant: row.isResistant });
    }
    return valid;
}

function validateEnvRules(
    rows: ConditionEnvRuleRowDto[],
    envConditionMap: Map<string, { id: number }>,
    conditionRelTypeMap: Map<string, { id: number }>,
    errors: RowError[],
): EnvRuleCandidate[] {
    const valid: EnvRuleCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.envConditionCode, row.relationType);
        if (!row.envConditionCode || !row.relationType || row.value === null) {
            const missing = ([
                !row.envConditionCode && 'env_condition_code',
                !row.relationType     && 'relation_type',
                row.value === null    && 'value',
            ] as (string | false)[]).filter(Boolean).join(', ');
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
            continue;
        }
        const envCondition = envConditionMap.get(row.envConditionCode.toLowerCase());
        if (!envCondition) {
            errors.push({ row: row.row, input, message: `'${row.envConditionCode}' is not a valid env condition codeName` });
            continue;
        }
        const relationType = conditionRelTypeMap.get(row.relationType.toLowerCase());
        if (!relationType) {
            errors.push({ row: row.row, input, message: `'${row.relationType}' is not a valid condition relation_type` });
            continue;
        }
        if (row.value <= 0 || row.value > 2.0) {
            errors.push({ row: row.row, input, message: `value must be > 0.0 and <= 2.0 (got ${row.value})` });
            continue;
        }
        valid.push({ envConditionId: envCondition.id, relationTypeId: relationType.id, value: row.value });
    }
    return valid;
}

function validateSymptomTags(
    rows: ConditionSymptomTagRowDto[],
    symptomMap: Map<string, { id: number }>,
    errors: RowError[],
): SymptomTagCandidate[] {
    const valid: SymptomTagCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.symptom);
        if (!row.symptom) {
            errors.push({ row: row.row, input, message: 'Missing required field: symptom' });
            continue;
        }
        const symptom = symptomMap.get(row.symptom.toLowerCase());
        if (!symptom) {
            errors.push({ row: row.row, input, message: `'${row.symptom}' is not a recognised symptom` });
            continue;
        }
        valid.push({ symptomId: symptom.id });
    }
    return valid;
}

function validateGrantedItems(
    rows: ConditionGrantedItemRowDto[],
    itemMap: Map<string, { id: number }>,
    errors: RowError[],
): GrantedItemCandidate[] {
    const valid: GrantedItemCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.itemCodeName);
        if (!row.itemCodeName) {
            errors.push({ row: row.row, input, message: 'Missing required field: item_code_name' });
            continue;
        }
        const item = itemMap.get(row.itemCodeName.toLowerCase());
        if (!item) {
            errors.push({ row: row.row, input, message: `'${row.itemCodeName}' is not a valid item codeName` });
            continue;
        }
        valid.push({
            itemId:             item.id,
            grantedToSource:    row.grantedToSource    ?? false,
            usesPerApplication: row.usesPerApplication ?? null,
            minProgression:     row.minProgression     ?? null,
            maxProgression:     row.maxProgression     ?? null,
        });
    }
    return valid;
}

function validateLinks(
    rows: ConditionLinkRowDto[],
    conditionRelTypeMap: Map<string, { id: number }>,
    errors: RowError[],
): LinkCandidate[] {
    // Child condition ID resolution happens after all conditions are saved (two-phase).
    // Here we only validate that the relation type is valid.
    const valid: LinkCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.parentConditionCode, row.childConditionCode, row.relationType);
        if (!row.childConditionCode || !row.relationType) {
            const missing = ([
                !row.childConditionCode && 'child_condition_code',
                !row.relationType       && 'relation_type',
            ] as (string | false)[]).filter(Boolean).join(', ');
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
            continue;
        }
        const relationType = conditionRelTypeMap.get(row.relationType.toLowerCase());
        if (!relationType) {
            errors.push({ row: row.row, input, message: `'${row.relationType}' is not a valid condition relation_type` });
            continue;
        }
        valid.push({
            childConditionCode: row.childConditionCode,
            relationTypeId:     relationType.id,
            weight:             row.weight ?? 1.0,
            row:                row.row,
        });
    }
    return valid;
}

function validateBehaviorEffects(
    rows: ConditionBehaviorEffectRowDto[],
    itemActionTypeMap: Map<string, { id: number }>,
    behaviorTypeMap: Map<string, { id: number }>,
    redirectTargetMap: Map<string, { id: number }>,
    errors: RowError[],
): BehaviorEffectCandidate[] {
    const valid: BehaviorEffectCandidate[] = [];
    for (const row of rows) {
        const input = rowInput(row.conditionCodeName, row.behaviorType, row.perspective);
        if (!row.perspective || !row.behaviorType) {
            const missing = ([
                !row.perspective  && 'perspective',
                !row.behaviorType && 'behavior_type',
            ] as (string | false)[]).filter(Boolean).join(', ');
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
            continue;
        }
        if (row.perspective !== 'outgoing' && row.perspective !== 'incoming') {
            errors.push({ row: row.row, input, message: `perspective must be 'outgoing' or 'incoming' (got '${row.perspective}')` });
            continue;
        }
        const behaviorType = behaviorTypeMap.get(row.behaviorType.toLowerCase());
        if (!behaviorType) {
            errors.push({ row: row.row, input, message: `'${row.behaviorType}' is not a valid behavior_type` });
            continue;
        }

        let actionTypeId: number | null = null;
        if (row.actionType) {
            const at = itemActionTypeMap.get(row.actionType.toLowerCase());
            if (!at) {
                errors.push({ row: row.row, input, message: `'${row.actionType}' is not a valid action_type` });
                continue;
            }
            actionTypeId = at.id;
        }

        let redirectTargetId: number | null = null;
        if (row.redirectTarget) {
            const rt = redirectTargetMap.get(row.redirectTarget.toLowerCase());
            if (!rt) {
                errors.push({ row: row.row, input, message: `'${row.redirectTarget}' is not a valid redirect_target` });
                continue;
            }
            redirectTargetId = rt.id;
        }

        let restrictActionTypeId: number | null = null;
        if (row.restrictActionType) {
            const rat = itemActionTypeMap.get(row.restrictActionType.toLowerCase());
            if (!rat) {
                errors.push({ row: row.row, input, message: `'${row.restrictActionType}' is not a valid restrict_action_type` });
                continue;
            }
            restrictActionTypeId = rat.id;
        }

        valid.push({
            actionTypeId,
            perspective:          row.perspective,
            behaviorTypeId:       behaviorType.id,
            triggerChance:        row.triggerChance    ?? 1.0,
            redirectTargetId,
            biasWeight:           row.biasWeight       ?? null,
            restrictActionTypeId,
            restrictIsBlock:      row.restrictIsBlock  ?? false,
        });
    }
    return valid;
}
