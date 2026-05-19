import { Injectable } from '@nestjs/common';
import {
    WeatherStateTemplateData,
    ResetWeatherStatePackResult,
    WeatherStateSavedRow,
    WeatherStateOverwrittenRow,
    UploadResultRow,
    UploadWeatherStatePackNewResult,
} from './dto/upload-weather-state-pack.dto';
import { WeatherStatesRepository } from './weatherStates.repository';
import { validateName, validateCodeName } from '../../utils/contentFilter';
import { ApiCacheService, CachedWeatherStateFull } from '../../cache/api-cache.service';
import { parseWeatherStatePack, WeatherStateRow } from './weatherStates.parser';

interface StateCandidate {
    dto:             WeatherStateRow;
    codeName:        string;
    name:            string;
    isSevere:        boolean;
    envConditionIds: number[];
    existing:        CachedWeatherStateFull | undefined;
}

interface InternalError {
    row:     number;
    sheet:   string;
    input:   string;
    message: string;
}

function rowInput(...parts: (string | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class WeatherStatesService {
    constructor(
        private readonly repo:  WeatherStatesRepository,
        private readonly cache: ApiCacheService,
    ) {}

    async getAll(guildId: string) {
        let states = this.cache.getWeatherStates(guildId);
        if (!states) {
            const raw = await this.repo.findGuildWeatherStates(guildId);
            this.cache.setWeatherStates(guildId, raw);
            states = raw;
        }
        return states.map(s => ({
            codeName:      s.codeName,
            name:          s.name,
            isSevere:      s.isSevere,
            envConditions: s.envConditions.map(e => e.envCondition.codeName),
        }));
    }

    async checkDelete(guildId: string, codeName: string): Promise<
        | { status: 'not_found' }
        | { status: 'has_dependencies'; name: string }
        | { status: 'ok'; name: string }
    > {
        const state = await this.repo.checkDeleteWeatherState(guildId, codeName);
        if (!state) return { status: 'not_found' };
        const total = Object.values(state._count).reduce((sum, c) => sum + c, 0);
        if (total > 0) return { status: 'has_dependencies', name: state.name };
        return { status: 'ok', name: state.name };
    }

    async deleteOne(guildId: string, codeName: string): Promise<{ deleted: boolean }> {
        try {
            await this.repo.deleteWeatherStateByCodeName(guildId, codeName);
            this.cache.invalidateWeatherStates(guildId);
            return { deleted: true };
        } catch {
            return { deleted: false };
        }
    }

    async getOne(guildId: string, codeName: string) {
        const state = await this.repo.findGuildWeatherState(guildId, codeName);
        if (!state) return null;
        return {
            codeName:      state.codeName,
            name:          state.name,
            isSevere:      state.isSevere,
            envConditions: state.envConditions.map(e => e.envCondition.codeName),
        };
    }

    async getTemplateData(guildId: string): Promise<WeatherStateTemplateData> {
        let envConditions = this.cache.getEnvConditions();
        if (!envConditions) {
            const raw = await this.repo.findAllEnvConditions();
            this.cache.setEnvConditions(raw);
            envConditions = raw;
        }
        return { envConditions: envConditions.map(e => e.codeName) };
    }

    async resetPack(guildId: string): Promise<ResetWeatherStatePackResult> {
        let states = this.cache.getWeatherStates(guildId);
        if (!states) {
            states = await this.repo.findGuildWeatherStates(guildId);
        }

        const deleted: ResetWeatherStatePackResult['deleted'] = [];
        const failed:  ResetWeatherStatePackResult['failed']  = [];

        const results = await Promise.allSettled(
            states.map(s => this.repo.deleteWeatherStateById(s.id)),
        );

        results.forEach((result, i) => {
            const s = states![i];
            if (result.status === 'fulfilled') {
                deleted.push({ codeName: s.codeName, name: s.name });
            } else {
                failed.push({ codeName: s.codeName, name: s.name, reason: 'Still in use — cannot be removed' });
            }
        });

        this.cache.invalidateWeatherStates(guildId);
        return { deleted, failed };
    }

    async uploadPack(guildId: string, fileBuffer: Buffer): Promise<UploadWeatherStatePackNewResult> {
        const parsed = await parseWeatherStatePack(fileBuffer);

        let envConditions = this.cache.getEnvConditions();
        let existing      = this.cache.getWeatherStates(guildId);

        const toFetch: Promise<void>[] = [];
        if (!envConditions) toFetch.push(
            this.repo.findAllEnvConditions().then(r => { envConditions = r; this.cache.setEnvConditions(r); }),
        );
        if (!existing) toFetch.push(
            this.repo.findGuildWeatherStates(guildId).then(r => { existing = r; this.cache.setWeatherStates(guildId, r); }),
        );
        if (toFetch.length) await Promise.all(toFetch);

        const envConditionMap = new Map(envConditions!.map(e => [e.codeName.toLowerCase(), e]));
        const existingMap     = new Map(existing!.map(s => [s.codeName.toLowerCase(), s]));

        const envConditionsByState = new Map<string, { ids: number[]; errors: InternalError[] }>();
        for (const row of parsed.envConditions) {
            const input = rowInput(row.weatherState, row.envCondition);

            if (!row.weatherState || !row.envCondition) {
                const missing = ([
                    !row.weatherState && 'weather_state',
                    !row.envCondition && 'env_condition',
                ] as (string | false)[]).filter(Boolean).join(', ');
                const key = (row.weatherState ?? '').toLowerCase();
                if (!envConditionsByState.has(key)) envConditionsByState.set(key, { ids: [], errors: [] });
                envConditionsByState.get(key)!.errors.push({ row: row.row, sheet: 'env_conditions', input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const key     = row.weatherState.toLowerCase();
            const ecKey   = row.envCondition.toLowerCase();
            const ecMatch = envConditionMap.get(ecKey);

            if (!envConditionsByState.has(key)) envConditionsByState.set(key, { ids: [], errors: [] });
            const entry = envConditionsByState.get(key)!;

            if (!ecMatch) {
                entry.errors.push({ row: row.row, sheet: 'env_conditions', input, message: `'${row.envCondition}' is not a valid env condition codeName` });
                continue;
            }

            if (entry.ids.includes(ecMatch.id)) {
                entry.errors.push({ row: row.row, sheet: 'env_conditions', input, message: `Duplicate env condition '${row.envCondition}' for this weather state` });
                continue;
            }

            entry.ids.push(ecMatch.id);
        }

        const errors:     InternalError[]   = [];
        const candidates: StateCandidate[]  = [];
        const seen = new Map<string, number>();

        for (const row of parsed.states) {
            const input = rowInput(row.codeName, row.name);

            if (!row.codeName || !row.name) {
                const missing = ([
                    !row.codeName && 'code_name',
                    !row.name     && 'name',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ row: row.row, sheet: 'weather_states', input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const codeNameCheck = validateCodeName(row.codeName);
            if (!codeNameCheck.valid) {
                errors.push({ row: row.row, sheet: 'weather_states', input, message: `code_name ${codeNameCheck.reason}` });
                continue;
            }

            const nameCheck = validateName(row.name);
            if (!nameCheck.valid) {
                errors.push({ row: row.row, sheet: 'weather_states', input, message: `name ${nameCheck.reason}` });
                continue;
            }

            const cleanCodeName = codeNameCheck.value;

            if (seen.has(cleanCodeName)) {
                errors.push({ row: row.row, sheet: 'weather_states', input, message: `Duplicate of row ${seen.get(cleanCodeName)}` });
                continue;
            }
            seen.set(cleanCodeName, row.row);

            const ecEntry         = envConditionsByState.get(cleanCodeName) ?? { ids: [], errors: [] };
            const envConditionIds = ecEntry.ids;
            errors.push(...ecEntry.errors);

            candidates.push({
                dto:             row,
                codeName:        cleanCodeName,
                name:            nameCheck.value,
                isSevere:        row.isSevere ?? false,
                envConditionIds,
                existing:        existingMap.get(cleanCodeName),
            });
        }

        for (const [key, entry] of envConditionsByState) {
            if (!seen.has(key)) {
                errors.push(...entry.errors);
                for (const _id of entry.ids) {
                    errors.push({
                        row:     0,
                        sheet:   'env_conditions',
                        input:   key,
                        message: `env_conditions sheet references weather state '${key}' which is not in the weather_states sheet`,
                    });
                }
            }
        }

        const existingEnvMap = new Map(
            existing!.map(s => [
                s.codeName.toLowerCase(),
                new Set(s.envConditions.map(e => e.envCondition.id)),
            ]),
        );

        const toSave = candidates.filter(c => {
            if (!c.existing) return true;
            const newIds     = new Set(c.envConditionIds);
            const oldIds     = existingEnvMap.get(c.codeName) ?? new Set<number>();
            const envChanged = newIds.size !== oldIds.size || [...newIds].some(id => !oldIds.has(id));
            return (
                c.existing.name     !== c.name     ||
                c.existing.isSevere !== c.isSevere ||
                envChanged
            );
        });

        const saved:      WeatherStateSavedRow[]       = [];
        const overwrites: WeatherStateOverwrittenRow[] = [];

        for (const c of toSave) {
            try {
                await this.repo.upsertWeatherState({
                    guildId,
                    codeName:        c.codeName,
                    name:            c.name,
                    isSevere:        c.isSevere,
                    envConditionIds: c.envConditionIds,
                });
                saved.push({ row: c.dto.row, codeName: c.codeName, name: c.name, isSevere: c.isSevere });
                if (c.existing) {
                    overwrites.push({
                        row:       c.dto.row,
                        codeName:  c.codeName,
                        oldName:   c.existing.name,
                        newName:   c.name,
                        oldSevere: c.existing.isSevere,
                        newSevere: c.isSevere,
                    });
                }
            } catch {
                errors.push({ row: c.dto.row, sheet: 'weather_states', input: rowInput(c.codeName, c.name), message: 'Failed to save to database' });
            }
        }

        this.cache.invalidateWeatherStates(guildId);

        const overwrittenCodes = new Set(overwrites.map(o => o.codeName));
        const rows: UploadResultRow[] = [
            ...saved.map(s => ({
                row:    s.row,
                sheet:  'weather_states',
                input:  `${s.codeName} | ${s.name}`,
                status: overwrittenCodes.has(s.codeName) ? 'updated' as const : 'added' as const,
            })),
            ...errors.map(e => ({
                row:    e.row,
                sheet:  e.sheet,
                input:  e.input,
                status: 'failed' as const,
                reason: e.message,
            })),
        ];
        rows.sort((a, b) => a.row - b.row);

        return {
            added:   saved.length - overwrites.length,
            updated: overwrites.length,
            failed:  errors.length,
            rows,
        };
    }
}
