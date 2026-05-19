import { Injectable } from '@nestjs/common';
import {
    UploadResultRow,
    ActionPackUploadResult,
    ActionPackTemplateData,
    ResetActionPackResult,
    ActionDownloadData,
} from './dto/upload-action-pack.dto';
import { ActionsRepository } from './actions.repository';
import { ApiCacheService } from '../../cache/api-cache.service';
import { parseActionPack } from './actions.parser';
import type { BaseConfigRow, DisciplineRewardRow, StepConfigRow, DisciplineRequirementRow } from './actions.parser';

const VALID_RECIPIENT_SCOPES  = new Set(['all', 'leader_only', 'participants_only', 'winners_only', 'losers_only']);
const VALID_REQUIREMENT_SCOPES = new Set(['leader', 'all']);

function rowInput(...parts: (string | number | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

interface InternalError {
    row:     number;
    sheet:   string;
    input:   string;
    message: string;
}

@Injectable()
export class ActionsService {
    constructor(
        private readonly repo:  ActionsRepository,
        private readonly cache: ApiCacheService,
    ) {}

    async getTemplateData(guildId: string): Promise<ActionPackTemplateData> {
        const [actionTypes, steps, disciplines, stats, profDefs] = await Promise.all([
            this.repo.findAllActionTypes(),
            this.repo.findAllActionSteps(),
            this.repo.findAllDisciplines(),
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(guildId),
        ]);

        const actionMap = new Map(actionTypes.map(a => [a.id, a.name]));

        return {
            actionTypes:       actionTypes.map(a => a.name),
            disciplines:       disciplines.map(d => d.codeName),
            proficiencies:     profDefs.map(p => p.codeName),
            stats:             stats.map(s => s.name),
            recipientScopes:   [...VALID_RECIPIENT_SCOPES],
            requirementScopes: [...VALID_REQUIREMENT_SCOPES],
            steps:             steps.map(s => ({ action: actionMap.get(s.actionTypeId) ?? '', step: s.codeName })),
        };
    }

    async resetPack(guildId: string): Promise<ResetActionPackResult> {
        return this.repo.resetGuildConfigs(guildId);
    }

    async downloadPack(guildId: string): Promise<ActionDownloadData> {
        const [rawBase, rawRewards, rawSteps, rawReqs, templateData] = await Promise.all([
            this.repo.findGuildBaseConfigsFull(guildId),
            this.repo.findGuildDisciplineRewardsFull(guildId),
            this.repo.findGuildStepConfigsFull(guildId),
            this.repo.findGuildDisciplineRequirementsFull(guildId),
            this.getTemplateData(guildId),
        ]);

        return {
            baseConfigs: rawBase.map(r => ({
                action:            r.actionType.name,
                energyCost:        r.energyCost,
                dailyLimit:        r.dailyLimit,
                minEntities:       r.minEntities,
                maxEntities:       r.maxEntities,
                durationMinutes:   r.durationMinutes,
                baseFactionReward: r.baseFactionReward,
            })),
            disciplineRewards: rawRewards.map(r => ({
                action:         r.actionType.name,
                discipline:     r.discipline.codeName,
                xpAmount:       r.xpAmount,
                recipientScope: r.recipientScope,
            })),
            stepConfigs: rawSteps.map(r => ({
                action:      r.step.actionType.name,
                step:        r.step.codeName,
                proficiency: r.proficiencyDef?.codeName ?? null,
                stat:        r.stat?.name ?? null,
            })),
            disciplineRequirements: rawReqs.map(r => ({
                action:     r.actionType.name,
                discipline: r.discipline.codeName,
                minLevel:   r.minLevel,
                scope:      r.scope,
            })),
            templateData,
        };
    }

    async uploadPack(guildId: string, buffer: Buffer): Promise<ActionPackUploadResult> {
        const parsed = await parseActionPack(buffer);

        const [actionTypes, allSteps, disciplines, stats, profDefs, existingBaseConfigs, existingRewards, existingStepConfigs, existingRequirements] = await Promise.all([
            this.repo.findAllActionTypes(),
            this.repo.findAllActionSteps(),
            this.repo.findAllDisciplines(),
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(guildId),
            this.repo.findGuildBaseConfigs(guildId),
            this.repo.findGuildDisciplineRewards(guildId),
            this.repo.findGuildStepConfigs(guildId),
            this.repo.findGuildDisciplineRequirements(guildId),
        ]);

        const actionMap = new Map(actionTypes.map(a => [a.name.toLowerCase(), a]));
        const discMap   = new Map(disciplines.map(d => [d.codeName.toLowerCase(), d]));
        const statMap   = new Map(stats.map(s => [s.name.toLowerCase(), s]));
        const profMap   = new Map(profDefs.map(p => [p.codeName.toLowerCase(), p]));
        const stepMap   = new Map(allSteps.map(s => [`${s.actionTypeId}:${s.codeName.toLowerCase()}`, s]));

        const existingConfigSet = new Set(existingBaseConfigs.map(c => c.actionTypeId));
        const existingRewardMap = new Map(existingRewards.map(r => [`${r.actionTypeId}:${r.disciplineId}:${r.recipientScope}`, r]));
        const existingStepSet   = new Set(existingStepConfigs.map(s => s.stepId));
        const existingReqMap    = new Map(existingRequirements.map(r => [`${r.actionTypeId}:${r.disciplineId}`, r]));

        const errors: InternalError[] = [];
        const rows:   UploadResultRow[] = [];

        // ── base_configs ──────────────────────────────────────────────────────
        for (const c of this._validateBaseConfigs(parsed.baseConfigs, actionMap, errors)) {
            try {
                await this.repo.upsertBaseConfig({
                    guildId,
                    actionTypeId:      c.actionTypeId,
                    energyCost:        c.energyCost,
                    dailyLimit:        c.dailyLimit,
                    minEntities:       c.minEntities,
                    maxEntities:       c.maxEntities,
                    durationMinutes:   c.durationMinutes,
                    baseFactionReward: c.baseFactionReward,
                });
                const isUpdate = existingConfigSet.has(c.actionTypeId);
                rows.push({ row: c.row, sheet: 'base_configs', input: rowInput(c.action), status: isUpdate ? 'updated' : 'added' });
            } catch {
                errors.push({ row: c.row, sheet: 'base_configs', input: rowInput(c.action), message: 'Failed to save to database' });
            }
        }

        // ── discipline_rewards ────────────────────────────────────────────────
        for (const c of this._validateDisciplineRewards(parsed.disciplineRewards, actionMap, discMap, errors)) {
            try {
                await this.repo.upsertDisciplineReward({
                    guildId,
                    actionTypeId:   c.actionTypeId,
                    disciplineId:   c.disciplineId,
                    xpAmount:       c.xpAmount,
                    recipientScope: c.recipientScope,
                });
                const key = `${c.actionTypeId}:${c.disciplineId}:${c.recipientScope}`;
                const isUpdate = existingRewardMap.has(key);
                rows.push({ row: c.row, sheet: 'discipline_rewards', input: rowInput(c.action, c.discipline, c.recipientScope), status: isUpdate ? 'updated' : 'added' });
            } catch {
                errors.push({ row: c.row, sheet: 'discipline_rewards', input: rowInput(c.action, c.discipline, c.recipientScope), message: 'Failed to save to database' });
            }
        }

        // ── step_configs ──────────────────────────────────────────────────────
        for (const c of this._validateStepConfigs(parsed.stepConfigs, actionMap, stepMap, profMap, statMap, errors)) {
            try {
                await this.repo.upsertStepConfig({
                    guildId,
                    stepId:           c.stepId,
                    proficiencyDefId: c.proficiencyDefId,
                    statId:           c.statId,
                });
                const isUpdate = existingStepSet.has(c.stepId);
                rows.push({ row: c.row, sheet: 'step_configs', input: rowInput(c.action, c.step), status: isUpdate ? 'updated' : 'added' });
            } catch {
                errors.push({ row: c.row, sheet: 'step_configs', input: rowInput(c.action, c.step), message: 'Failed to save to database' });
            }
        }

        // ── discipline_requirements ───────────────────────────────────────────
        for (const c of this._validateDisciplineRequirements(parsed.disciplineRequirements, actionMap, discMap, errors)) {
            try {
                await this.repo.upsertDisciplineRequirement({
                    guildId,
                    actionTypeId: c.actionTypeId,
                    disciplineId: c.disciplineId,
                    minLevel:     c.minLevel,
                    scope:        c.scope,
                });
                const key = `${c.actionTypeId}:${c.disciplineId}`;
                const isUpdate = existingReqMap.has(key);
                rows.push({ row: c.row, sheet: 'discipline_requirements', input: rowInput(c.action, c.discipline, c.scope), status: isUpdate ? 'updated' : 'added' });
            } catch {
                errors.push({ row: c.row, sheet: 'discipline_requirements', input: rowInput(c.action, c.discipline, c.scope), message: 'Failed to save to database' });
            }
        }

        for (const e of errors) {
            rows.push({ row: e.row, sheet: e.sheet, input: e.input, status: 'failed', reason: e.message });
        }

        const sheetOrder: Record<string, number> = { base_configs: 0, discipline_rewards: 1, step_configs: 2, discipline_requirements: 3 };
        rows.sort((a, b) => {
            const sd = (sheetOrder[a.sheet] ?? 99) - (sheetOrder[b.sheet] ?? 99);
            return sd !== 0 ? sd : a.row - b.row;
        });

        const added   = rows.filter(r => r.status === 'added').length;
        const updated = rows.filter(r => r.status === 'updated').length;
        const failed  = rows.filter(r => r.status === 'failed').length;

        return { added, updated, failed, rows };
    }

    // ── private validators ────────────────────────────────────────────────────

    private _validateBaseConfigs(
        rows:      BaseConfigRow[],
        actionMap: Map<string, { id: number; name: string }>,
        errors:    InternalError[],
    ): Array<{ row: number; action: string; actionTypeId: number; energyCost: number; dailyLimit: number | null; minEntities: number; maxEntities: number | null; durationMinutes: number | null; baseFactionReward: number }> {
        const candidates = [];
        const seen = new Map<number, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.energyCost, row.minEntities);

            if (!row.action) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: 'Missing required field: action' });
                continue;
            }

            const actionEntry = actionMap.get(row.action.toLowerCase());
            if (!actionEntry) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: `'${row.action}' is not a valid action type` });
                continue;
            }

            if (row.energyCost == null || row.energyCost < 0) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: 'energy_cost must be a non-negative integer' });
                continue;
            }

            const minEntities = row.minEntities ?? 1;
            if (minEntities < 1) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: 'min_entities must be >= 1' });
                continue;
            }

            if (row.maxEntities != null && row.maxEntities < minEntities) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: 'max_entities must be >= min_entities' });
                continue;
            }

            if (seen.has(actionEntry.id)) {
                errors.push({ sheet: 'base_configs', row: row.row, input, message: `Duplicate of row ${seen.get(actionEntry.id)}` });
                continue;
            }
            seen.set(actionEntry.id, row.row);

            candidates.push({
                row:               row.row,
                action:            actionEntry.name,
                actionTypeId:      actionEntry.id,
                energyCost:        Math.round(row.energyCost),
                dailyLimit:        row.dailyLimit != null ? Math.round(row.dailyLimit) : null,
                minEntities:       Math.round(minEntities),
                maxEntities:       row.maxEntities != null ? Math.round(row.maxEntities) : null,
                durationMinutes:   row.durationMinutes != null ? Math.round(row.durationMinutes) : null,
                baseFactionReward: row.baseFactionReward != null ? Math.round(row.baseFactionReward) : 0,
            });
        }
        return candidates;
    }

    private _validateDisciplineRewards(
        rows:      DisciplineRewardRow[],
        actionMap: Map<string, { id: number; name: string }>,
        discMap:   Map<string, { id: number; codeName: string }>,
        errors:    InternalError[],
    ): Array<{ row: number; action: string; discipline: string; actionTypeId: number; disciplineId: number; xpAmount: number; recipientScope: string }> {
        const candidates = [];
        const seen = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.discipline, row.xpAmount, row.recipientScope);

            if (!row.action || !row.discipline || row.xpAmount == null || !row.recipientScope) {
                const missing = ([
                    !row.action          && 'action',
                    !row.discipline      && 'discipline',
                    row.xpAmount == null && 'xp_amount',
                    !row.recipientScope  && 'recipient_scope',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const actionEntry = actionMap.get(row.action.toLowerCase());
            if (!actionEntry) {
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `'${row.action}' is not a valid action type` });
                continue;
            }

            const discEntry = discMap.get(row.discipline.toLowerCase());
            if (!discEntry) {
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `'${row.discipline}' is not a valid discipline` });
                continue;
            }

            if (row.xpAmount < 0) {
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: 'xp_amount must be >= 0' });
                continue;
            }

            const scope = row.recipientScope.toLowerCase();
            if (!VALID_RECIPIENT_SCOPES.has(scope)) {
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `'${row.recipientScope}' is not a valid recipient_scope. Valid: ${[...VALID_RECIPIENT_SCOPES].join(', ')}` });
                continue;
            }

            const key = `${actionEntry.id}:${discEntry.id}:${scope}`;
            if (seen.has(key)) {
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `Duplicate of row ${seen.get(key)}` });
                continue;
            }
            seen.set(key, row.row);

            candidates.push({
                row:            row.row,
                action:         actionEntry.name,
                discipline:     discEntry.codeName,
                actionTypeId:   actionEntry.id,
                disciplineId:   discEntry.id,
                xpAmount:       Math.round(row.xpAmount),
                recipientScope: scope,
            });
        }
        return candidates;
    }

    private _validateStepConfigs(
        rows:      StepConfigRow[],
        actionMap: Map<string, { id: number; name: string }>,
        stepMap:   Map<string, { id: number; codeName: string; actionTypeId: number }>,
        profMap:   Map<string, { id: number; codeName: string }>,
        statMap:   Map<string, { id: number; name: string }>,
        errors:    InternalError[],
    ): Array<{ row: number; action: string; step: string; stepId: number; proficiencyDefId: number | null; statId: number | null }> {
        const candidates = [];
        const seen = new Map<number, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.step, row.proficiency, row.stat);

            if (!row.action || !row.step) {
                const missing = ([!row.action && 'action', !row.step && 'step'] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const actionEntry = actionMap.get(row.action.toLowerCase());
            if (!actionEntry) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.action}' is not a valid action type` });
                continue;
            }

            const stepEntry = stepMap.get(`${actionEntry.id}:${row.step.toLowerCase()}`);
            if (!stepEntry) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.step}' is not a valid step for action '${row.action}'` });
                continue;
            }

            if (row.proficiency && row.stat) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: 'Cannot set both proficiency and stat — choose one' });
                continue;
            }

            let proficiencyDefId: number | null = null;
            if (row.proficiency) {
                const prof = profMap.get(row.proficiency.toLowerCase());
                if (!prof) {
                    errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.proficiency}' is not a valid proficiency for this guild` });
                    continue;
                }
                proficiencyDefId = prof.id;
            }

            let statId: number | null = null;
            if (row.stat) {
                const stat = statMap.get(row.stat.toLowerCase());
                if (!stat) {
                    errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.stat}' is not a valid stat` });
                    continue;
                }
                statId = stat.id;
            }

            if (seen.has(stepEntry.id)) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `Duplicate of row ${seen.get(stepEntry.id)}` });
                continue;
            }
            seen.set(stepEntry.id, row.row);

            candidates.push({ row: row.row, action: actionEntry.name, step: stepEntry.codeName, stepId: stepEntry.id, proficiencyDefId, statId });
        }
        return candidates;
    }

    private _validateDisciplineRequirements(
        rows:      DisciplineRequirementRow[],
        actionMap: Map<string, { id: number; name: string }>,
        discMap:   Map<string, { id: number; codeName: string }>,
        errors:    InternalError[],
    ): Array<{ row: number; action: string; discipline: string; actionTypeId: number; disciplineId: number; minLevel: number; scope: string }> {
        const candidates = [];
        const seen = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.discipline, row.minLevel, row.scope);

            if (!row.action || !row.discipline || row.minLevel == null || !row.scope) {
                const missing = ([
                    !row.action          && 'action',
                    !row.discipline      && 'discipline',
                    row.minLevel == null && 'min_level',
                    !row.scope           && 'scope',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const actionEntry = actionMap.get(row.action.toLowerCase());
            if (!actionEntry) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `'${row.action}' is not a valid action type` });
                continue;
            }

            const discEntry = discMap.get(row.discipline.toLowerCase());
            if (!discEntry) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `'${row.discipline}' is not a valid discipline` });
                continue;
            }

            if (row.minLevel < 1) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: 'min_level must be >= 1' });
                continue;
            }

            const scope = row.scope.toLowerCase();
            if (!VALID_REQUIREMENT_SCOPES.has(scope)) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `'${row.scope}' is not a valid scope. Valid: ${[...VALID_REQUIREMENT_SCOPES].join(', ')}` });
                continue;
            }

            const key = `${actionEntry.id}:${discEntry.id}`;
            if (seen.has(key)) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `Duplicate of row ${seen.get(key)}` });
                continue;
            }
            seen.set(key, row.row);

            candidates.push({ row: row.row, action: actionEntry.name, discipline: discEntry.codeName, actionTypeId: actionEntry.id, disciplineId: discEntry.id, minLevel: Math.round(row.minLevel), scope });
        }
        return candidates;
    }
}
