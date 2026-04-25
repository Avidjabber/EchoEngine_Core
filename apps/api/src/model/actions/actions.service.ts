import { Injectable } from '@nestjs/common';
import {
    UploadActionPackDto,
    UploadActionPackResult,
    ActionPackTemplateData,
    BaseConfigRowDto,
    DisciplineRewardRowDto,
    StepConfigRowDto,
    DisciplineRequirementRowDto,
    SavedRow,
    OverwrittenRow,
    RowError,
} from './dto/upload-action-pack.dto';
import { ActionsRepository } from './actions.repository';
import { ApiCacheService } from '../../cache/api-cache.service';

const VALID_RECIPIENT_SCOPES = new Set(['all', 'leader_only', 'participants_only', 'winners_only', 'losers_only']);
const VALID_REQUIREMENT_SCOPES = new Set(['leader', 'all']);

function rowInput(...parts: (string | number | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

interface ExistingBaseConfig {
    actionTypeId:      number;
    energyCost:        number;
    dailyLimit:        number | null;
    minEntities:       number;
    maxEntities:       number | null;
    durationMinutes:   number | null;
    baseFactionReward: number;
}

interface ExistingDisciplineReward {
    actionTypeId:   number;
    disciplineId:   number;
    recipientScope: string;
    xpAmount:       number;
}

interface ExistingStepConfig {
    stepId:           number;
    proficiencyDefId: number | null;
    statId:           number | null;
}

interface ExistingDisciplineRequirement {
    actionTypeId: number;
    disciplineId: number;
    minLevel:     number;
    scope:        string;
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

    async uploadPack(dto: UploadActionPackDto): Promise<UploadActionPackResult> {
        const [actionTypes, allSteps, disciplines, stats, profDefs, existingBaseConfigs, existingRewards, existingStepConfigs, existingRequirements] = await Promise.all([
            this.repo.findAllActionTypes(),
            this.repo.findAllActionSteps(),
            this.repo.findAllDisciplines(),
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(dto.guildId),
            this.repo.findGuildBaseConfigs(dto.guildId),
            this.repo.findGuildDisciplineRewards(dto.guildId),
            this.repo.findGuildStepConfigs(dto.guildId),
            this.repo.findGuildDisciplineRequirements(dto.guildId),
        ]);

        const actionMap   = new Map(actionTypes.map(a => [a.name.toLowerCase(), a]));
        const discMap     = new Map(disciplines.map(d => [d.codeName.toLowerCase(), d]));
        const statMap     = new Map(stats.map(s => [s.name.toLowerCase(), s]));
        const profMap     = new Map(profDefs.map(p => [p.codeName.toLowerCase(), p]));
        // step lookup: composite key "actionTypeId:codeName"
        const stepMap     = new Map(allSteps.map(s => [`${s.actionTypeId}:${s.codeName.toLowerCase()}`, s]));

        const existingConfigMap = new Map<number, ExistingBaseConfig>(
            existingBaseConfigs.map(c => [c.actionTypeId, c]),
        );
        const existingRewardMap = new Map<string, ExistingDisciplineReward>(
            existingRewards.map(r => [`${r.actionTypeId}:${r.disciplineId}:${r.recipientScope}`, r]),
        );
        const existingStepMap = new Map<number, ExistingStepConfig>(
            existingStepConfigs.map(s => [s.stepId, s]),
        );
        const existingReqMap = new Map<string, ExistingDisciplineRequirement>(
            existingRequirements.map(r => [`${r.actionTypeId}:${r.disciplineId}`, r]),
        );

        const errors:     RowError[]     = [];
        const saved:      SavedRow[]     = [];
        const overwrites: OverwrittenRow[] = [];

        // ── base_configs ──────────────────────────────────────────────────────
        const baseResults = await Promise.allSettled(
            this._validateBaseConfigs(dto.baseConfigs, actionMap, errors).map(c =>
                this.repo.upsertBaseConfig({
                    guildId:           dto.guildId,
                    actionTypeId:      c.actionTypeId,
                    energyCost:        c.energyCost,
                    dailyLimit:        c.dailyLimit,
                    minEntities:       c.minEntities,
                    maxEntities:       c.maxEntities,
                    durationMinutes:   c.durationMinutes,
                    baseFactionReward: c.baseFactionReward,
                }).then(() => ({ candidate: c })),
            ),
        );

        for (const result of baseResults) {
            if (result.status === 'rejected') continue;
            const { candidate: c } = result.value;
            const existing = existingConfigMap.get(c.actionTypeId);
            saved.push({ sheet: 'base_configs', row: c.row, action: c.action });
            if (existing) overwrites.push({ sheet: 'base_configs', row: c.row, action: c.action });
        }
        const baseFailedRows = baseResults
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => r.status === 'rejected')
            .map(({ i }) => {
                const c = this._validateBaseConfigs(dto.baseConfigs, actionMap, []).at(i);
                if (c) errors.push({ sheet: 'base_configs', row: c.row, input: rowInput(c.action), message: 'Failed to save to database' });
            });
        void baseFailedRows;

        // ── discipline_rewards ────────────────────────────────────────────────
        const rewardCandidates = this._validateDisciplineRewards(dto.disciplineRewards, actionMap, discMap, errors);
        const rewardResults = await Promise.allSettled(
            rewardCandidates.map(c =>
                this.repo.upsertDisciplineReward({
                    guildId:        dto.guildId,
                    actionTypeId:   c.actionTypeId,
                    disciplineId:   c.disciplineId,
                    xpAmount:       c.xpAmount,
                    recipientScope: c.recipientScope,
                }).then(() => ({ candidate: c })),
            ),
        );

        rewardResults.forEach((result, i) => {
            if (result.status === 'rejected') {
                const c = rewardCandidates[i];
                errors.push({ sheet: 'discipline_rewards', row: c.row, input: rowInput(c.action, c.discipline, c.recipientScope), message: 'Failed to save to database' });
                return;
            }
            const { candidate: c } = result.value;
            const key = `${c.actionTypeId}:${c.disciplineId}:${c.recipientScope}`;
            const existing = existingRewardMap.get(key);
            saved.push({ sheet: 'discipline_rewards', row: c.row, action: c.action, discipline: c.discipline, recipientScope: c.recipientScope, xpAmount: c.xpAmount });
            if (existing && existing.xpAmount !== c.xpAmount) {
                overwrites.push({ sheet: 'discipline_rewards', row: c.row, action: c.action, discipline: c.discipline, recipientScope: c.recipientScope, oldXpAmount: existing.xpAmount, newXpAmount: c.xpAmount });
            }
        });

        // ── step_configs ──────────────────────────────────────────────────────
        const stepCandidates = this._validateStepConfigs(dto.stepConfigs, actionMap, stepMap, profMap, statMap, errors);
        const stepResults = await Promise.allSettled(
            stepCandidates.map(c =>
                this.repo.upsertStepConfig({
                    guildId:          dto.guildId,
                    stepId:           c.stepId,
                    proficiencyDefId: c.proficiencyDefId,
                    statId:           c.statId,
                }).then(() => ({ candidate: c })),
            ),
        );

        stepResults.forEach((result, i) => {
            if (result.status === 'rejected') {
                const c = stepCandidates[i];
                errors.push({ sheet: 'step_configs', row: c.row, input: rowInput(c.action, c.step), message: 'Failed to save to database' });
                return;
            }
            const { candidate: c } = result.value;
            const existing = existingStepMap.get(c.stepId);
            const oldProf = existing ? (profDefs.find(p => p.id === existing.proficiencyDefId)?.codeName ?? null) : null;
            const oldStat = existing ? (stats.find(s => s.id === existing.statId)?.name ?? null) : null;
            saved.push({ sheet: 'step_configs', row: c.row, action: c.action, step: c.step, proficiency: c.proficiencyName, stat: c.statName });
            if (existing && (existing.proficiencyDefId !== c.proficiencyDefId || existing.statId !== c.statId)) {
                overwrites.push({ sheet: 'step_configs', row: c.row, action: c.action, step: c.step, oldProficiency: oldProf, oldStat: oldStat, newProficiency: c.proficiencyName, newStat: c.statName });
            }
        });

        // ── discipline_requirements ───────────────────────────────────────────
        const reqCandidates = this._validateDisciplineRequirements(dto.disciplineRequirements, actionMap, discMap, errors);
        const reqResults = await Promise.allSettled(
            reqCandidates.map(c =>
                this.repo.upsertDisciplineRequirement({
                    guildId:      dto.guildId,
                    actionTypeId: c.actionTypeId,
                    disciplineId: c.disciplineId,
                    minLevel:     c.minLevel,
                    scope:        c.scope,
                }).then(() => ({ candidate: c })),
            ),
        );

        reqResults.forEach((result, i) => {
            if (result.status === 'rejected') {
                const c = reqCandidates[i];
                errors.push({ sheet: 'discipline_requirements', row: c.row, input: rowInput(c.action, c.discipline, c.scope), message: 'Failed to save to database' });
                return;
            }
            const { candidate: c } = result.value;
            const existing = existingReqMap.get(`${c.actionTypeId}:${c.disciplineId}`);
            saved.push({ sheet: 'discipline_requirements', row: c.row, action: c.action, discipline: c.discipline });
            if (existing && existing.minLevel !== c.minLevel) {
                overwrites.push({ sheet: 'discipline_requirements', row: c.row, action: c.action, discipline: c.discipline, oldMinLevel: existing.minLevel, newMinLevel: c.minLevel });
            }
        });

        errors.sort((a, b) => {
            const sheetOrder: Record<string, number> = { base_configs: 0, discipline_rewards: 1, step_configs: 2, discipline_requirements: 3 };
            const sd = (sheetOrder[a.sheet] ?? 99) - (sheetOrder[b.sheet] ?? 99);
            return sd !== 0 ? sd : a.row - b.row;
        });

        return { saved, errors, overwrites };
    }

    // ── private validators ────────────────────────────────────────────────────

    private _validateBaseConfigs(
        rows: BaseConfigRowDto[],
        actionMap: Map<string, { id: number; name: string }>,
        errors: RowError[],
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
        rows: DisciplineRewardRowDto[],
        actionMap: Map<string, { id: number; name: string }>,
        discMap:   Map<string, { id: number; codeName: string }>,
        errors: RowError[],
    ): Array<{ row: number; action: string; discipline: string; actionTypeId: number; disciplineId: number; xpAmount: number; recipientScope: string }> {
        const candidates = [];
        const seen = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.discipline, row.xpAmount, row.recipientScope);

            if (!row.action || !row.discipline || row.xpAmount == null || !row.recipientScope) {
                const missing = [
                    !row.action         && 'action',
                    !row.discipline     && 'discipline',
                    row.xpAmount == null && 'xp_amount',
                    !row.recipientScope && 'recipient_scope',
                ].filter(Boolean).join(', ');
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
                errors.push({ sheet: 'discipline_rewards', row: row.row, input, message: `'${row.recipientScope}' is not a valid recipient_scope. Valid values: ${[...VALID_RECIPIENT_SCOPES].join(', ')}` });
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
        rows:      StepConfigRowDto[],
        actionMap: Map<string, { id: number; name: string }>,
        stepMap:   Map<string, { id: number; codeName: string; actionTypeId: number }>,
        profMap:   Map<string, { id: number; codeName: string }>,
        statMap:   Map<string, { id: number; name: string }>,
        errors: RowError[],
    ): Array<{ row: number; action: string; step: string; stepId: number; proficiencyDefId: number | null; statId: number | null; proficiencyName: string | null; statName: string | null }> {
        const candidates = [];
        const seen = new Map<number, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.step, row.proficiency, row.stat);

            if (!row.action || !row.step) {
                const missing = [!row.action && 'action', !row.step && 'step'].filter(Boolean).join(', ');
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const actionEntry = actionMap.get(row.action.toLowerCase());
            if (!actionEntry) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.action}' is not a valid action type` });
                continue;
            }

            const stepKey = `${actionEntry.id}:${row.step.toLowerCase()}`;
            const stepEntry = stepMap.get(stepKey);
            if (!stepEntry) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.step}' is not a valid step for action '${row.action}'` });
                continue;
            }

            if (row.proficiency && row.stat) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: 'Cannot set both proficiency and stat — choose one' });
                continue;
            }

            let proficiencyDefId: number | null = null;
            let proficiencyName:  string | null = null;
            if (row.proficiency) {
                const prof = profMap.get(row.proficiency.toLowerCase());
                if (!prof) {
                    errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.proficiency}' is not a valid proficiency for this guild` });
                    continue;
                }
                proficiencyDefId = prof.id;
                proficiencyName  = prof.codeName;
            }

            let statId:   number | null = null;
            let statName: string | null = null;
            if (row.stat) {
                const stat = statMap.get(row.stat.toLowerCase());
                if (!stat) {
                    errors.push({ sheet: 'step_configs', row: row.row, input, message: `'${row.stat}' is not a valid stat` });
                    continue;
                }
                statId   = stat.id;
                statName = stat.name;
            }

            if (seen.has(stepEntry.id)) {
                errors.push({ sheet: 'step_configs', row: row.row, input, message: `Duplicate of row ${seen.get(stepEntry.id)}` });
                continue;
            }
            seen.set(stepEntry.id, row.row);

            candidates.push({
                row:              row.row,
                action:           actionEntry.name,
                step:             stepEntry.codeName,
                stepId:           stepEntry.id,
                proficiencyDefId,
                statId,
                proficiencyName,
                statName,
            });
        }
        return candidates;
    }

    private _validateDisciplineRequirements(
        rows:      DisciplineRequirementRowDto[],
        actionMap: Map<string, { id: number; name: string }>,
        discMap:   Map<string, { id: number; codeName: string }>,
        errors: RowError[],
    ): Array<{ row: number; action: string; discipline: string; actionTypeId: number; disciplineId: number; minLevel: number; scope: string }> {
        const candidates = [];
        const seen = new Map<string, number>();

        for (const row of rows) {
            const input = rowInput(row.action, row.discipline, row.minLevel, row.scope);

            if (!row.action || !row.discipline || row.minLevel == null || !row.scope) {
                const missing = [
                    !row.action       && 'action',
                    !row.discipline   && 'discipline',
                    row.minLevel == null && 'min_level',
                    !row.scope        && 'scope',
                ].filter(Boolean).join(', ');
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
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `'${row.scope}' is not a valid scope. Valid values: ${[...VALID_REQUIREMENT_SCOPES].join(', ')}` });
                continue;
            }

            const key = `${actionEntry.id}:${discEntry.id}`;
            if (seen.has(key)) {
                errors.push({ sheet: 'discipline_requirements', row: row.row, input, message: `Duplicate of row ${seen.get(key)}` });
                continue;
            }
            seen.set(key, row.row);

            candidates.push({
                row:          row.row,
                action:       actionEntry.name,
                discipline:   discEntry.codeName,
                actionTypeId: actionEntry.id,
                disciplineId: discEntry.id,
                minLevel:     Math.round(row.minLevel),
                scope,
            });
        }
        return candidates;
    }
}
