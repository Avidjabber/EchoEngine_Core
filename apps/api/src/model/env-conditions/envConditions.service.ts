import { Injectable } from '@nestjs/common';
import {
    UploadEnvConditionPackDto,
    UploadEnvConditionPackResult,
    EnvConditionTemplateData,
    EnvConditionModifiersData,
    EnvConditionDownloadData,
    EnvConditionListItem,
    EnvConditionResetResult,
    SavedRow,
    OverwrittenRow,
    RowError,
    WorldModifierDto,
    StatModifierDto,
    ProficiencyModifierDto,
} from './dto/upload-env-condition-pack.dto';
import { EnvConditionsRepository } from './envConditions.repository';
import { ApiCacheService, CachedGuildModifiers } from '../../cache/api-cache.service';

const VALID_WORLD_MODIFIER_RELATIONS = new Set(['increase', 'decrease', 'block']);

type WorldDbRow    = { guildId: string; envConditionId: number; effectTypeId: number; relationTypeId: number; value: number | null };
type StatDbRow     = { guildId: string; envConditionId: number; statId: number; value: number };
type ProfDbRow     = { guildId: string; envConditionId: number; proficiencyDefId: number; value: number; hasDisadvantage: boolean; hasAdvantage: boolean };

interface ValidatedWorldRow { dto: WorldModifierDto; db: WorldDbRow; savedShape: Extract<SavedRow, { sheet: 'world_modifiers' }> }
interface ValidatedStatRow  { dto: StatModifierDto;  db: StatDbRow;  savedShape: Extract<SavedRow, { sheet: 'stat_modifiers' }> }
interface ValidatedProfRow  { dto: ProficiencyModifierDto; db: ProfDbRow; savedShape: Extract<SavedRow,  { sheet: 'proficiency_modifiers' }> }

function rowInput(...parts: (string | number | boolean | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class EnvConditionsService {
    constructor(
        private readonly repo:  EnvConditionsRepository,
        private readonly cache: ApiCacheService,
    ) {}

    async getConditionList(): Promise<EnvConditionListItem[]> {
        let data = this.cache.getEnvConditionNames();
        if (!data) {
            data = await this.repo.findAllEnvConditionsWithNames();
            this.cache.setEnvConditionNames(data);
        }
        return data;
    }

    async getTemplateData(guildId: string): Promise<EnvConditionTemplateData> {
        let envConditions  = this.cache.getEnvConditions();
        let effectTypes    = this.cache.getEffectTypes();
        let relationTypes  = this.cache.getRelationTypes();
        let stats          = this.cache.getStats();
        let proficiencyDefs = this.cache.getProfDefsSlim(guildId);

        const fetches: Promise<void>[] = [];

        if (!envConditions)   fetches.push(this.repo.findAllEnvConditions()           .then(v => { envConditions   = v; this.cache.setEnvConditions(v); }));
        if (!effectTypes)     fetches.push(this.repo.findEnvModifierEffectTypes()      .then(v => { effectTypes     = v; this.cache.setEffectTypes(v); }));
        if (!relationTypes)   fetches.push(this.repo.findEnvConditionRelationTypes()   .then(v => { relationTypes   = v; this.cache.setRelationTypes(v); }));
        if (!stats)           fetches.push(this.repo.findAllStats()                    .then(v => { stats           = v; this.cache.setStats(v); }));
        if (!proficiencyDefs) fetches.push(this.repo.findProficiencyDefs(guildId)      .then(v => { proficiencyDefs = v; this.cache.setProfDefsSlim(guildId, v); }));

        if (fetches.length) await Promise.all(fetches);

        return {
            envConditions:   envConditions!.map(e  => e.codeName),
            effectTypes:     effectTypes!.map(e    => e.name),
            relations:       relationTypes!
                .filter(r => VALID_WORLD_MODIFIER_RELATIONS.has(r.name.toLowerCase()))
                .map(r => r.name),
            stats:           stats!.map(s          => s.name),
            proficiencyDefs: proficiencyDefs!.map(p => p.codeName),
        };
    }

    async getModifiers(guildId: string): Promise<EnvConditionModifiersData> {
        const raw = await this.getRawModifiers(guildId);
        return this.mapModifiers(raw);
    }

    async downloadPack(guildId: string): Promise<EnvConditionDownloadData> {
        const [templateData, raw] = await Promise.all([
            this.getTemplateData(guildId),
            this.getRawModifiers(guildId),
        ]);

        return {
            templateData,
            ...this.mapModifiers(raw),
        };
    }

    async resetPack(guildId: string): Promise<EnvConditionResetResult> {
        const result = await this.repo.deleteAllGuildModifiers(guildId);
        this.cache.invalidateGuildModifiers(guildId);
        return result;
    }

    async resetCondition(guildId: string, conditionCodeName: string): Promise<EnvConditionResetResult | null> {
        const condition = await this.repo.findEnvConditionIdByCodeName(conditionCodeName);
        if (!condition) return null;
        const result = await this.repo.deleteConditionModifiers(guildId, condition.id);
        this.cache.invalidateGuildModifiers(guildId);
        return result;
    }

    async removeModifier(guildId: string, conditionCodeName: string, modifierType: 'world' | 'stat' | 'proficiency', key: string): Promise<boolean> {
        const condition = await this.repo.findEnvConditionIdByCodeName(conditionCodeName);
        if (!condition) return false;

        let removed = false;

        if (modifierType === 'world') {
            let effectTypes = this.cache.getEffectTypes();
            if (!effectTypes) {
                effectTypes = await this.repo.findEnvModifierEffectTypes();
                this.cache.setEffectTypes(effectTypes);
            }
            const et = effectTypes.find(e => e.name.toLowerCase() === key.toLowerCase());
            if (!et) return false;
            const result = await this.repo.deleteWorldModifier(guildId, condition.id, et.id);
            removed = result.count > 0;
        } else if (modifierType === 'stat') {
            let stats = this.cache.getStats();
            if (!stats) {
                stats = await this.repo.findAllStats();
                this.cache.setStats(stats);
            }
            const stat = stats.find(s => s.name.toLowerCase() === key.toLowerCase());
            if (!stat) return false;
            const result = await this.repo.deleteStatModifier(guildId, condition.id, stat.id);
            removed = result.count > 0;
        } else if (modifierType === 'proficiency') {
            let proficiencyDefs = this.cache.getProfDefsSlim(guildId);
            if (!proficiencyDefs) {
                proficiencyDefs = await this.repo.findProficiencyDefs(guildId);
                this.cache.setProfDefsSlim(guildId, proficiencyDefs);
            }
            const prof = proficiencyDefs.find(p => p.codeName.toLowerCase() === key.toLowerCase());
            if (!prof) return false;
            const result = await this.repo.deleteProfModifier(guildId, condition.id, prof.id);
            removed = result.count > 0;
        }

        if (removed) this.cache.invalidateGuildModifiers(guildId);
        return removed;
    }

    async uploadPack(dto: UploadEnvConditionPackDto): Promise<UploadEnvConditionPackResult> {
        let envConditions  = this.cache.getEnvConditions();
        let effectTypes    = this.cache.getEffectTypes();
        let relationTypes  = this.cache.getRelationTypes();
        let stats          = this.cache.getStats();
        let proficiencyDefs = this.cache.getProfDefsSlim(dto.guildId);

        const lookupFetches: Promise<void>[] = [];
        if (!envConditions)   lookupFetches.push(this.repo.findAllEnvConditions()         .then(v => { envConditions   = v; this.cache.setEnvConditions(v); }));
        if (!effectTypes)     lookupFetches.push(this.repo.findEnvModifierEffectTypes()    .then(v => { effectTypes     = v; this.cache.setEffectTypes(v); }));
        if (!relationTypes)   lookupFetches.push(this.repo.findEnvConditionRelationTypes() .then(v => { relationTypes   = v; this.cache.setRelationTypes(v); }));
        if (!stats)           lookupFetches.push(this.repo.findAllStats()                  .then(v => { stats           = v; this.cache.setStats(v); }));
        if (!proficiencyDefs) lookupFetches.push(this.repo.findProficiencyDefs(dto.guildId).then(v => { proficiencyDefs = v; this.cache.setProfDefsSlim(dto.guildId, v); }));

        const [existing] = await Promise.all([
            this.repo.getGuildModifiers(dto.guildId),
            ...lookupFetches,
        ]);

        const envConditionMap   = new Map(envConditions!.map(e  => [e.codeName.toLowerCase(),  e.id]));
        const effectTypeMap     = new Map(effectTypes!.map(e    => [e.name.toLowerCase(),      e.id]));
        const relationTypeMap   = new Map(relationTypes!.map(r  => [r.name.toLowerCase(),      r.id]));
        const statMap           = new Map(stats!.map(s          => [s.name.toLowerCase(),      s.id]));
        const proficiencyDefMap = new Map(proficiencyDefs!.map(p => [p.codeName.toLowerCase(), p.id]));

        const existingWorld = new Map(existing.worldModifiers.map(m => [
            `${m.envCondition.codeName.toLowerCase()}|${m.effectType.name.toLowerCase()}`,
            { relation: m.relationType.name, value: m.value ?? null },
        ]));
        const existingStat = new Map(existing.statModifiers.map(m => [
            `${m.envCondition.codeName.toLowerCase()}|${m.stat.name.toLowerCase()}`,
            { value: m.value },
        ]));
        const existingProf = new Map(existing.proficiencyModifiers.map(m => [
            `${m.envCondition.codeName.toLowerCase()}|${m.proficiency.codeName.toLowerCase()}`,
            { value: m.value, hasDisadvantage: m.hasDisadvantage, hasAdvantage: m.hasAdvantage },
        ]));

        const errors: RowError[] = [];

        const worldToSave = this.validateWorldModifiers(dto.worldModifiers, dto.guildId, envConditionMap, effectTypeMap, relationTypeMap, errors);
        const statToSave  = this.validateStatModifiers(dto.statModifiers,   dto.guildId, envConditionMap, statMap, errors);
        const profToSave  = this.validateProficiencyModifiers(dto.proficiencyModifiers, dto.guildId, envConditionMap, proficiencyDefMap, errors);

        type WorldCandidate = { item: ValidatedWorldRow; old?: { relation: string; value: number | null } };
        type StatCandidate  = { item: ValidatedStatRow;  old?: { value: number } };
        type ProfCandidate  = { item: ValidatedProfRow;  old?: { value: number; hasDisadvantage: boolean; hasAdvantage: boolean } };

        const worldCandidates: WorldCandidate[] = [];
        for (const item of worldToSave) {
            const key = `${item.dto.condition!.toLowerCase()}|${item.dto.effectType!.toLowerCase()}`;
            const old = existingWorld.get(key);
            if (!old) {
                worldCandidates.push({ item });
            } else if (old.relation.toLowerCase() !== item.savedShape.relation || old.value !== item.savedShape.value) {
                worldCandidates.push({ item, old });
            }
        }

        const statCandidates: StatCandidate[] = [];
        for (const item of statToSave) {
            const key = `${item.dto.condition!.toLowerCase()}|${item.dto.stat!.toLowerCase()}`;
            const old = existingStat.get(key);
            if (!old) {
                statCandidates.push({ item });
            } else if (old.value !== item.savedShape.value) {
                statCandidates.push({ item, old });
            }
        }

        const profCandidates: ProfCandidate[] = [];
        for (const item of profToSave) {
            const key = `${item.dto.condition!.toLowerCase()}|${item.dto.proficiency!.toLowerCase()}`;
            const old = existingProf.get(key);
            if (!old) {
                profCandidates.push({ item });
            } else if (old.value !== item.savedShape.value || old.hasDisadvantage !== item.savedShape.hasDisadvantage || old.hasAdvantage !== item.savedShape.hasAdvantage) {
                profCandidates.push({ item, old });
            }
        }

        const [worldResults, statResults, profResults] = await Promise.all([
            Promise.allSettled(worldCandidates.map(c => this.repo.upsertEnvConditionModifier(c.item.db))),
            Promise.allSettled(statCandidates.map(c  => this.repo.upsertStatModifier(c.item.db))),
            Promise.allSettled(profCandidates.map(c  => this.repo.upsertProficiencyModifier(c.item.db))),
        ]);

        const saved:      SavedRow[]       = [];
        const overwrites: OverwrittenRow[] = [];

        worldResults.forEach((result, i) => {
            const { item, old } = worldCandidates[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
                if (old) {
                    overwrites.push({
                        sheet:       'world_modifiers',
                        row:         item.dto.row,
                        condition:   item.savedShape.condition,
                        effectType:  item.savedShape.effectType,
                        oldRelation: old.relation,
                        oldValue:    old.value,
                        newRelation: item.savedShape.relation,
                        newValue:    item.savedShape.value,
                    });
                }
            } else {
                errors.push({ sheet: 'world_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.effectType, item.dto.relation, item.dto.value), message: 'Failed to save to database' });
            }
        });

        statResults.forEach((result, i) => {
            const { item, old } = statCandidates[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
                if (old) {
                    overwrites.push({
                        sheet:     'stat_modifiers',
                        row:       item.dto.row,
                        condition: item.savedShape.condition,
                        stat:      item.savedShape.stat,
                        oldValue:  old.value,
                        newValue:  item.savedShape.value,
                    });
                }
            } else {
                errors.push({ sheet: 'stat_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.stat, item.dto.value), message: 'Failed to save to database' });
            }
        });

        profResults.forEach((result, i) => {
            const { item, old } = profCandidates[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
                if (old) {
                    overwrites.push({
                        sheet:              'proficiency_modifiers',
                        row:                item.dto.row,
                        condition:          item.savedShape.condition,
                        proficiency:        item.savedShape.proficiency,
                        oldValue:           old.value,
                        oldHasDisadvantage: old.hasDisadvantage,
                        oldHasAdvantage:    old.hasAdvantage,
                        newValue:           item.savedShape.value,
                        newHasDisadvantage: item.savedShape.hasDisadvantage,
                        newHasAdvantage:    item.savedShape.hasAdvantage,
                    });
                }
            } else {
                errors.push({ sheet: 'proficiency_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.proficiency, item.dto.value, item.dto.hasDisadvantage), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => {
            const sheetOrder = ['world_modifiers', 'stat_modifiers', 'proficiency_modifiers'];
            const si = sheetOrder.indexOf(a.sheet) - sheetOrder.indexOf(b.sheet);
            return si !== 0 ? si : a.row - b.row;
        });

        this.cache.invalidateGuildModifiers(dto.guildId);

        return { saved, errors, overwrites };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async getRawModifiers(guildId: string): Promise<CachedGuildModifiers> {
        let cached = this.cache.getGuildModifiers(guildId);
        if (!cached) {
            cached = await this.repo.getGuildModifiers(guildId);
            this.cache.setGuildModifiers(guildId, cached);
        }
        return cached;
    }

    private mapModifiers(raw: CachedGuildModifiers): EnvConditionModifiersData {
        return {
            worldModifiers:       raw.worldModifiers.map(m => ({
                condition:  m.envCondition.codeName,
                effectType: m.effectType.name,
                relation:   m.relationType.name,
                value:      m.value ?? null,
            })),
            statModifiers:        raw.statModifiers.map(m => ({
                condition: m.envCondition.codeName,
                stat:      m.stat.name,
                value:     m.value,
            })),
            proficiencyModifiers: raw.proficiencyModifiers.map(m => ({
                condition:       m.envCondition.codeName,
                proficiency:     m.proficiency.codeName,
                value:           m.value,
                hasDisadvantage: m.hasDisadvantage,
                hasAdvantage:    m.hasAdvantage,
            })),
        };
    }

    private validateWorldModifiers(
        rows:            WorldModifierDto[],
        guildId:         string,
        envConditionMap: Map<string, number>,
        effectTypeMap:   Map<string, number>,
        relationTypeMap: Map<string, number>,
        errors:          RowError[],
    ): ValidatedWorldRow[] {
        const valid: ValidatedWorldRow[] = [];
        const seen  = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.condition, row.effectType, row.relation, row.value);

            if (!row.condition || !row.effectType || !row.relation) {
                const missing = [!row.condition && 'condition', !row.effectType && 'effect_type', !row.relation && 'relation'].filter(Boolean).join(', ');
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const condLower   = row.condition.toLowerCase();
            const etLower     = row.effectType.toLowerCase();
            const relLower    = row.relation.toLowerCase();
            const dupKey      = `${condLower}|${etLower}`;

            if (seen.has(dupKey)) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `Duplicate of row ${seen.get(dupKey)}` });
                continue;
            }
            seen.set(dupKey, row.row);

            const envConditionId = envConditionMap.get(condLower);
            if (envConditionId === undefined) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `'${row.condition}' is not a valid condition codeName` });
                continue;
            }

            const effectTypeId = effectTypeMap.get(etLower);
            if (effectTypeId === undefined) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `'${row.effectType}' is not a valid env modifier effect type` });
                continue;
            }

            if (!VALID_WORLD_MODIFIER_RELATIONS.has(relLower)) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `'${row.relation}' is not valid — use increase, decrease, or block` });
                continue;
            }

            const relationTypeId = relationTypeMap.get(relLower);
            if (relationTypeId === undefined) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `'${row.relation}' is not a recognised relation type` });
                continue;
            }

            const isBlock = relLower === 'block';
            if (!isBlock && row.value === null) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `value is required when relation is '${row.relation}'` });
                continue;
            }

            if (!isBlock && (row.value! < 0 || row.value! > 5)) {
                errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `value must be between 0.0 and 5.0 for relation '${row.relation}' (enter positive magnitude — relation determines direction)` });
                continue;
            }

            const dbValue = isBlock ? null : row.value;
            valid.push({
                dto: row,
                db:  { guildId, envConditionId, effectTypeId, relationTypeId, value: dbValue },
                savedShape: { sheet: 'world_modifiers', row: row.row, condition: row.condition, effectType: row.effectType, relation: relLower, value: dbValue },
            });
        }

        return valid;
    }

    private validateStatModifiers(
        rows:            StatModifierDto[],
        guildId:         string,
        envConditionMap: Map<string, number>,
        statMap:         Map<string, number>,
        errors:          RowError[],
    ): ValidatedStatRow[] {
        const valid: ValidatedStatRow[] = [];
        const seen  = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.condition, row.stat, row.value);

            if (!row.condition || !row.stat) {
                const missing = [!row.condition && 'condition', !row.stat && 'stat'].filter(Boolean).join(', ');
                errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }
            if (row.value === null) {
                errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: 'Missing required field: value' });
                continue;
            }

            const condLower = row.condition.toLowerCase();
            const statLower = row.stat.toLowerCase();
            const dupKey    = `${condLower}|${statLower}`;

            if (seen.has(dupKey)) {
                errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: `Duplicate of row ${seen.get(dupKey)}` });
                continue;
            }
            seen.set(dupKey, row.row);

            const envConditionId = envConditionMap.get(condLower);
            if (envConditionId === undefined) {
                errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: `'${row.condition}' is not a valid condition codeName` });
                continue;
            }

            const statId = statMap.get(statLower);
            if (statId === undefined) {
                errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: `'${row.stat}' is not a valid stat name` });
                continue;
            }

            valid.push({
                dto: row,
                db:  { guildId, envConditionId, statId, value: row.value },
                savedShape: { sheet: 'stat_modifiers', row: row.row, condition: row.condition, stat: row.stat, value: row.value },
            });
        }

        return valid;
    }

    private validateProficiencyModifiers(
        rows:             ProficiencyModifierDto[],
        guildId:          string,
        envConditionMap:  Map<string, number>,
        proficiencyDefMap: Map<string, number>,
        errors:           RowError[],
    ): ValidatedProfRow[] {
        const valid: ValidatedProfRow[] = [];
        const seen  = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.condition, row.proficiency, row.value, row.hasDisadvantage);

            if (!row.condition || !row.proficiency) {
                const missing = [!row.condition && 'condition', !row.proficiency && 'proficiency'].filter(Boolean).join(', ');
                errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const condLower  = row.condition.toLowerCase();
            const profLower  = row.proficiency.toLowerCase();
            const dupKey     = `${condLower}|${profLower}`;

            if (seen.has(dupKey)) {
                errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: `Duplicate of row ${seen.get(dupKey)}` });
                continue;
            }
            seen.set(dupKey, row.row);

            const envConditionId = envConditionMap.get(condLower);
            if (envConditionId === undefined) {
                errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: `'${row.condition}' is not a valid condition codeName` });
                continue;
            }

            const proficiencyDefId = proficiencyDefMap.get(profLower);
            if (proficiencyDefId === undefined) {
                errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: `'${row.proficiency}' is not a valid proficiency codeName for this guild` });
                continue;
            }

            const value           = row.value          ?? 0;
            const hasDisadvantage = row.hasDisadvantage ?? false;
            const hasAdvantage    = row.hasAdvantage    ?? false;

            const activeCount = (value !== 0 ? 1 : 0) + (hasDisadvantage ? 1 : 0) + (hasAdvantage ? 1 : 0);
            if (activeCount > 1) {
                errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: 'Only one of value, has_disadvantage, or has_advantage may be set — choose one' });
                continue;
            }

            valid.push({
                dto: row,
                db:  { guildId, envConditionId, proficiencyDefId, value, hasDisadvantage, hasAdvantage },
                savedShape: { sheet: 'proficiency_modifiers', row: row.row, condition: row.condition, proficiency: row.proficiency, value, hasDisadvantage, hasAdvantage },
            });
        }

        return valid;
    }
}
