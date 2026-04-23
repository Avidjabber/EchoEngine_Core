import { Injectable } from '@nestjs/common';
import {
    UploadEnvConditionPackDto,
    UploadEnvConditionPackResult,
    EnvConditionTemplateData,
    EnvConditionDownloadData,
    EnvConditionResetResult,
    SavedRow,
    RowError,
    WorldModifierDto,
    StatModifierDto,
    ProficiencyModifierDto,
} from './dto/upload-env-condition-pack.dto';
import { EnvConditionsRepository } from './envConditions.repository';

const VALID_WORLD_MODIFIER_RELATIONS = new Set(['increase', 'decrease', 'block']);

type WorldDbRow    = { guildId: string; envConditionId: number; effectTypeId: number; relationTypeId: number; value: number | null };
type StatDbRow     = { guildId: string; envConditionId: number; statId: number; value: number };
type ProfDbRow     = { guildId: string; envConditionId: number; proficiencyDefId: number; value: number; hasDisadvantage: boolean };

interface ValidatedWorldRow { dto: WorldModifierDto; db: WorldDbRow; savedShape: Extract<SavedRow, { sheet: 'world_modifiers' }> }
interface ValidatedStatRow  { dto: StatModifierDto;  db: StatDbRow;  savedShape: Extract<SavedRow, { sheet: 'stat_modifiers' }> }
interface ValidatedProfRow  { dto: ProficiencyModifierDto; db: ProfDbRow; savedShape: Extract<SavedRow, { sheet: 'proficiency_modifiers' }> }

function rowInput(...parts: (string | number | boolean | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class EnvConditionsService {
    constructor(private readonly repo: EnvConditionsRepository) {}

    async getTemplateData(guildId: string): Promise<EnvConditionTemplateData> {
        const [envConditions, effectTypes, relationTypes, stats, proficiencyDefs] = await Promise.all([
            this.repo.findAllEnvConditions(),
            this.repo.findEnvModifierEffectTypes(),
            this.repo.findEnvConditionRelationTypes(),
            this.repo.findAllStats(),
            this.repo.findProficiencyDefs(guildId),
        ]);

        return {
            envConditions:   envConditions.map(e  => e.codeName),
            effectTypes:     effectTypes.map(e    => e.name),
            relations:       relationTypes
                .filter(r => VALID_WORLD_MODIFIER_RELATIONS.has(r.name.toLowerCase()))
                .map(r => r.name),
            stats:           stats.map(s          => s.name),
            proficiencyDefs: proficiencyDefs.map(p => p.codeName),
        };
    }

    async downloadPack(guildId: string): Promise<EnvConditionDownloadData> {
        const [templateData, { worldModifiers, statModifiers, proficiencyModifiers }] = await Promise.all([
            this.getTemplateData(guildId),
            this.repo.getGuildModifiers(guildId),
        ]);

        return {
            templateData,
            worldModifiers:       worldModifiers.map(m => ({
                condition:  m.envCondition.codeName,
                effectType: m.effectType.name,
                relation:   m.relationType.name,
                value:      m.value ?? null,
            })),
            statModifiers:        statModifiers.map(m => ({
                condition: m.envCondition.codeName,
                stat:      m.stat.name,
                value:     m.value,
            })),
            proficiencyModifiers: proficiencyModifiers.map(m => ({
                condition:       m.envCondition.codeName,
                proficiency:     m.proficiency.codeName,
                value:           m.value,
                hasDisadvantage: m.hasDisadvantage,
            })),
        };
    }

    async resetPack(guildId: string): Promise<EnvConditionResetResult> {
        return this.repo.deleteAllGuildModifiers(guildId);
    }

    async uploadPack(dto: UploadEnvConditionPackDto): Promise<UploadEnvConditionPackResult> {
        const [envConditions, effectTypes, relationTypes, stats, proficiencyDefs] = await Promise.all([
            this.repo.findAllEnvConditions(),
            this.repo.findEnvModifierEffectTypes(),
            this.repo.findEnvConditionRelationTypes(),
            this.repo.findAllStats(),
            this.repo.findProficiencyDefs(dto.guildId),
        ]);

        const envConditionMap   = new Map(envConditions.map(e  => [e.codeName.toLowerCase(),  e.id]));
        const effectTypeMap     = new Map(effectTypes.map(e    => [e.name.toLowerCase(),      e.id]));
        const relationTypeMap   = new Map(relationTypes.map(r  => [r.name.toLowerCase(),      r.id]));
        const statMap           = new Map(stats.map(s          => [s.name.toLowerCase(),      s.id]));
        const proficiencyDefMap = new Map(proficiencyDefs.map(p => [p.codeName.toLowerCase(), p.id]));

        const errors: RowError[] = [];

        // Phase 1: validate all rows, build save lists
        const worldToSave = this.validateWorldModifiers(dto.worldModifiers, dto.guildId, envConditionMap, effectTypeMap, relationTypeMap, errors);
        const statToSave  = this.validateStatModifiers(dto.statModifiers,   dto.guildId, envConditionMap, statMap, errors);
        const profToSave  = this.validateProficiencyModifiers(dto.proficiencyModifiers, dto.guildId, envConditionMap, proficiencyDefMap, errors);

        // Phase 2: save all valid rows in parallel across sheets, with per-row error capture
        const [worldResults, statResults, profResults] = await Promise.all([
            Promise.allSettled(worldToSave.map(item => this.repo.upsertEnvConditionModifier(item.db))),
            Promise.allSettled(statToSave.map(item  => this.repo.upsertStatModifier(item.db))),
            Promise.allSettled(profToSave.map(item  => this.repo.upsertProficiencyModifier(item.db))),
        ]);

        // Phase 3: collect save results
        const saved: SavedRow[] = [];

        worldResults.forEach((result, i) => {
            const item = worldToSave[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
            } else {
                errors.push({ sheet: 'world_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.effectType, item.dto.relation, item.dto.value), message: 'Failed to save to database' });
            }
        });

        statResults.forEach((result, i) => {
            const item = statToSave[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
            } else {
                errors.push({ sheet: 'stat_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.stat, item.dto.value), message: 'Failed to save to database' });
            }
        });

        profResults.forEach((result, i) => {
            const item = profToSave[i];
            if (result.status === 'fulfilled') {
                saved.push(item.savedShape);
            } else {
                errors.push({ sheet: 'proficiency_modifiers', row: item.dto.row, input: rowInput(item.dto.condition, item.dto.proficiency, item.dto.value, item.dto.hasDisadvantage), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => {
            const sheetOrder = ['world_modifiers', 'stat_modifiers', 'proficiency_modifiers'];
            const si = sheetOrder.indexOf(a.sheet) - sheetOrder.indexOf(b.sheet);
            return si !== 0 ? si : a.row - b.row;
        });

        return { saved, errors };
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

            const value          = row.value          ?? 0;
            const hasDisadvantage = row.hasDisadvantage ?? false;

            valid.push({
                dto: row,
                db:  { guildId, envConditionId, proficiencyDefId, value, hasDisadvantage },
                savedShape: { sheet: 'proficiency_modifiers', row: row.row, condition: row.condition, proficiency: row.proficiency, value, hasDisadvantage },
            });
        }

        return valid;
    }
}
