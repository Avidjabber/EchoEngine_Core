import { Injectable } from '@nestjs/common';
import {
    WeatherStateRowDto,
    WeatherStateEnvConditionRowDto,
    UploadWeatherStatePackDto,
    UploadWeatherStatePackResult,
    WeatherStateTemplateData,
    ResetWeatherStatePackResult,
    WeatherStateSavedRow,
    WeatherStateOverwrittenRow,
    RowError,
} from './dto/upload-weather-state-pack.dto';
import { WeatherStatesRepository } from './weatherStates.repository';
import { validateName, validateCodeName } from '../../utils/contentFilter';
import { ApiCacheService, CachedWeatherStateFull } from '../../cache/api-cache.service';

interface StateCandidate {
    dto:             WeatherStateRowDto;
    codeName:        string;
    name:            string;
    isSevere:        boolean;
    envConditionIds: number[];
    existing:        CachedWeatherStateFull | undefined;
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

    async uploadPack(dto: UploadWeatherStatePackDto): Promise<UploadWeatherStatePackResult> {
        let envConditions = this.cache.getEnvConditions();
        let existing      = this.cache.getWeatherStates(dto.guildId);

        const toFetch: Promise<void>[] = [];
        if (!envConditions) toFetch.push(
            this.repo.findAllEnvConditions().then(r => { envConditions = r; this.cache.setEnvConditions(r); }),
        );
        if (!existing) toFetch.push(
            this.repo.findGuildWeatherStates(dto.guildId).then(r => { existing = r; this.cache.setWeatherStates(dto.guildId, r); }),
        );
        if (toFetch.length) await Promise.all(toFetch);

        const envConditionMap = new Map(envConditions!.map(e => [e.codeName.toLowerCase(), e]));
        const existingMap     = new Map(existing!.map(s => [s.codeName.toLowerCase(), s]));

        // Index env condition rows by weather state codeName
        const envConditionsByState = new Map<string, { ids: number[]; errors: RowError[] }>();
        for (const row of dto.envConditions) {
            const input = rowInput(row.weatherState, row.envCondition);

            if (!row.weatherState || !row.envCondition) {
                const missing = ([
                    !row.weatherState && 'weather_state',
                    !row.envCondition && 'env_condition',
                ] as (string | false)[]).filter(Boolean).join(', ');
                // errors from the env_conditions sheet are collected but handled below
                const key = (row.weatherState ?? '').toLowerCase();
                if (!envConditionsByState.has(key)) envConditionsByState.set(key, { ids: [], errors: [] });
                envConditionsByState.get(key)!.errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const key    = row.weatherState.toLowerCase();
            const ecKey  = row.envCondition.toLowerCase();
            const ecMatch = envConditionMap.get(ecKey);

            if (!envConditionsByState.has(key)) envConditionsByState.set(key, { ids: [], errors: [] });
            const entry = envConditionsByState.get(key)!;

            if (!ecMatch) {
                entry.errors.push({ row: row.row, input, message: `'${row.envCondition}' is not a valid env condition codeName` });
                continue;
            }

            if (entry.ids.includes(ecMatch.id)) {
                entry.errors.push({ row: row.row, input, message: `Duplicate env condition '${row.envCondition}' for this weather state` });
                continue;
            }

            entry.ids.push(ecMatch.id);
        }

        const errors:     RowError[]        = [];
        const candidates: StateCandidate[]  = [];
        const seen = new Map<string, number>();

        for (const row of dto.states) {
            const input = rowInput(row.codeName, row.name);

            if (!row.codeName || !row.name) {
                const missing = ([
                    !row.codeName && 'code_name',
                    !row.name     && 'name',
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

            const cleanCodeName = codeNameCheck.value;

            if (seen.has(cleanCodeName)) {
                errors.push({ row: row.row, input, message: `Duplicate of row ${seen.get(cleanCodeName)}` });
                continue;
            }
            seen.set(cleanCodeName, row.row);

            const ecEntry        = envConditionsByState.get(cleanCodeName) ?? { ids: [], errors: [] };
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

        // Catch env_condition rows that reference a weather_state not present in the states sheet
        for (const [key, entry] of envConditionsByState) {
            if (!seen.has(key)) {
                errors.push(...entry.errors);
                for (const id of entry.ids) {
                    errors.push({
                        row:     0,
                        input:   key,
                        message: `env_conditions sheet references weather state '${key}' which is not in the weather_states sheet`,
                    });
                    void id;
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
            const newIds    = new Set(c.envConditionIds);
            const oldIds    = existingEnvMap.get(c.codeName) ?? new Set<number>();
            const envChanged = newIds.size !== oldIds.size || [...newIds].some(id => !oldIds.has(id));
            return (
                c.existing.name     !== c.name     ||
                c.existing.isSevere !== c.isSevere ||
                envChanged
            );
        });

        const results = await Promise.allSettled(
            toSave.map(c => this.repo.upsertWeatherState({
                guildId:         dto.guildId,
                codeName:        c.codeName,
                name:            c.name,
                isSevere:        c.isSevere,
                envConditionIds: c.envConditionIds,
            })),
        );

        const saved:      WeatherStateSavedRow[]       = [];
        const overwrites: WeatherStateOverwrittenRow[] = [];

        results.forEach((result, i) => {
            const c = toSave[i];
            if (result.status === 'fulfilled') {
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
            } else {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName, c.name), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => a.row - b.row);

        this.cache.invalidateWeatherStates(dto.guildId);
        return { saved, errors, overwrites };
    }
}
