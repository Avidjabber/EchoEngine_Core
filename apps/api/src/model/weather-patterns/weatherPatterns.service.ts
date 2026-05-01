import { Injectable } from '@nestjs/common';
import {
    PatternRowDto,
    PatternStepRowDto,
    PatternSeasonWeightRowDto,
    UploadWeatherPatternPackDto,
    UploadWeatherPatternPackResult,
    WeatherPatternTemplateData,
    ResetWeatherPatternPackResult,
    PatternSavedRow,
    PatternOverwrittenRow,
    RowError,
} from './dto/upload-weather-pattern-pack.dto';
import { WeatherPatternsRepository } from './weatherPatterns.repository';
import { validateName, validateCodeName } from '../../utils/contentFilter';
import { ApiCacheService, CachedWeatherPatternFull } from '../../cache/api-cache.service';

interface PatternCandidate {
    dto:          PatternRowDto;
    codeName:     string;
    name:         string;
    isSevere:     boolean;
    cooldownDays: number;
    steps:         { stepOrder: number; weatherStateId: number | null; durationHours: number }[];
    seasonWeights: { seasonId: number; weight: number }[];
    existing:      CachedWeatherPatternFull | undefined;
}

function rowInput(...parts: (string | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class WeatherPatternsService {
    constructor(
        private readonly repo:  WeatherPatternsRepository,
        private readonly cache: ApiCacheService,
    ) {}

    async getAll(guildId: string) {
        let patterns = this.cache.getWeatherPatterns(guildId);
        if (!patterns) {
            const raw = await this.repo.findGuildWeatherPatterns(guildId);
            this.cache.setWeatherPatterns(guildId, raw);
            patterns = raw;
        }
        return patterns.map(p => ({
            codeName:     p.codeName,
            name:         p.name,
            isSevere:     p.isSevere,
            cooldownDays: p.cooldownDays,
            steps: p.steps.map(s => ({
                stepOrder:    s.stepOrder,
                durationHours: s.durationHours,
                weatherState: s.weatherState?.codeName ?? null,
            })),
            seasonWeights: p.seasonWeights.map(sw => ({
                season: sw.season.name,
                weight: sw.weight,
            })),
        }));
    }

    async getTemplateData(guildId: string): Promise<WeatherPatternTemplateData> {
        const [seasonsRaw, weatherStatesRaw] = await Promise.all([
            (async () => {
                let seasons = this.cache.getSeasons();
                if (!seasons) {
                    const raw = await this.repo.findAllSeasons();
                    this.cache.setSeasons(raw);
                    seasons = raw;
                }
                return seasons;
            })(),
            this.repo.findGuildWeatherStateCodes(guildId),
        ]);

        return {
            weatherStates: weatherStatesRaw.map(s => s.codeName),
            seasons:       seasonsRaw.map(s => s.name),
        };
    }

    async resetPack(guildId: string): Promise<ResetWeatherPatternPackResult> {
        let patterns = this.cache.getWeatherPatterns(guildId);
        if (!patterns) {
            patterns = await this.repo.findGuildWeatherPatterns(guildId);
        }

        const deleted: ResetWeatherPatternPackResult['deleted'] = [];
        const failed:  ResetWeatherPatternPackResult['failed']  = [];

        const results = await Promise.allSettled(
            patterns.map(p => this.repo.deleteWeatherPatternById(p.id)),
        );

        results.forEach((result, i) => {
            const p = patterns![i];
            if (result.status === 'fulfilled') {
                deleted.push({ codeName: p.codeName, name: p.name });
            } else {
                failed.push({ codeName: p.codeName, name: p.name, reason: 'Still in use — cannot be removed' });
            }
        });

        this.cache.invalidateWeatherPatterns(guildId);
        return { deleted, failed };
    }

    async uploadPack(dto: UploadWeatherPatternPackDto): Promise<UploadWeatherPatternPackResult> {
        let seasons:      Awaited<ReturnType<typeof this.repo.findAllSeasons>>              | null = this.cache.getSeasons();
        let weatherSlim:  Awaited<ReturnType<typeof this.repo.findGuildWeatherStateCodes>> | null = null;
        let existing:     Awaited<ReturnType<typeof this.repo.findGuildWeatherPatterns>>   | null = this.cache.getWeatherPatterns(dto.guildId);

        // Prime cache hits for weather states (rich type) into the slim array if available
        const cachedWs = this.cache.getWeatherStates(dto.guildId);
        if (cachedWs) {
            weatherSlim = cachedWs.map(s => ({ id: s.id, codeName: s.codeName }));
        }

        const toFetch: Promise<void>[] = [];
        if (!seasons) toFetch.push(
            this.repo.findAllSeasons().then(r => { seasons = r; this.cache.setSeasons(r); }),
        );
        if (!weatherSlim) toFetch.push(
            this.repo.findGuildWeatherStateCodes(dto.guildId).then(r => { weatherSlim = r; }),
        );
        if (!existing) toFetch.push(
            this.repo.findGuildWeatherPatterns(dto.guildId).then(r => { existing = r; this.cache.setWeatherPatterns(dto.guildId, r); }),
        );
        if (toFetch.length) await Promise.all(toFetch);

        const seasonMap       = new Map((seasons     ?? []).map(s => [s.name.toLowerCase(), s]));
        const weatherStateMap = new Map((weatherSlim ?? []).map(s => [s.codeName.toLowerCase(), s]));
        const existingMap     = new Map((existing    ?? []).map(p => [p.codeName.toLowerCase(), p]));

        // ── Group steps by pattern ────────────────────────────────────────────
        const stepsByPattern = new Map<string, { rows: PatternStepRowDto[]; errors: RowError[] }>();

        for (const row of dto.steps) {
            const input   = rowInput(row.pattern, String(row.stepOrder ?? '?'), row.weatherState, String(row.durationHours ?? '?'));
            const patKey  = (row.pattern ?? '').toLowerCase();

            if (!row.pattern) {
                if (!stepsByPattern.has(patKey)) stepsByPattern.set(patKey, { rows: [], errors: [] });
                stepsByPattern.get(patKey)!.errors.push({ row: row.row, input, message: 'Missing required field: pattern' });
                continue;
            }

            if (!stepsByPattern.has(patKey)) stepsByPattern.set(patKey, { rows: [], errors: [] });
            stepsByPattern.get(patKey)!.rows.push(row);
        }

        // ── Group season weights by pattern ───────────────────────────────────
        const weightsByPattern = new Map<string, { rows: PatternSeasonWeightRowDto[]; errors: RowError[] }>();

        for (const row of dto.seasonWeights) {
            const input  = rowInput(row.pattern, row.season, String(row.weight ?? '?'));
            const patKey = (row.pattern ?? '').toLowerCase();

            if (!row.pattern) {
                if (!weightsByPattern.has(patKey)) weightsByPattern.set(patKey, { rows: [], errors: [] });
                weightsByPattern.get(patKey)!.errors.push({ row: row.row, input, message: 'Missing required field: pattern' });
                continue;
            }

            if (!weightsByPattern.has(patKey)) weightsByPattern.set(patKey, { rows: [], errors: [] });
            weightsByPattern.get(patKey)!.rows.push(row);
        }

        // ── Validate pattern rows ─────────────────────────────────────────────
        const errors:     RowError[]          = [];
        const candidates: PatternCandidate[]  = [];
        const seen = new Map<string, number>();

        for (const row of dto.patterns) {
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

            const cooldownDays = row.cooldownDays ?? 0;
            if (!Number.isInteger(cooldownDays) || cooldownDays < 0) {
                errors.push({ row: row.row, input, message: 'cooldown_days must be a non-negative integer' });
                continue;
            }

            // ── Validate steps for this pattern ───────────────────────────────
            const stepEntry  = stepsByPattern.get(cleanCodeName) ?? { rows: [], errors: [] };
            const stepErrors = [...stepEntry.errors];
            const validSteps: { stepOrder: number; weatherStateId: number | null; durationHours: number }[] = [];
            const stepOrdersSeen = new Set<number>();

            for (const sr of stepEntry.rows) {
                const si = rowInput(sr.pattern, String(sr.stepOrder ?? '?'), sr.weatherState ?? '(default)', String(sr.durationHours ?? '?'));

                if (sr.stepOrder === null || sr.stepOrder === undefined) {
                    stepErrors.push({ row: sr.row, input: si, message: 'Missing required field: step_order' });
                    continue;
                }
                if (!Number.isInteger(sr.stepOrder) || sr.stepOrder < 1) {
                    stepErrors.push({ row: sr.row, input: si, message: 'step_order must be a positive integer' });
                    continue;
                }
                if (stepOrdersSeen.has(sr.stepOrder)) {
                    stepErrors.push({ row: sr.row, input: si, message: `Duplicate step_order ${sr.stepOrder} for this pattern` });
                    continue;
                }
                if (sr.durationHours === null || sr.durationHours === undefined) {
                    stepErrors.push({ row: sr.row, input: si, message: 'Missing required field: duration_hours' });
                    continue;
                }
                if (!Number.isInteger(sr.durationHours) || sr.durationHours < 1) {
                    stepErrors.push({ row: sr.row, input: si, message: 'duration_hours must be a positive integer' });
                    continue;
                }

                let weatherStateId: number | null = null;
                if (sr.weatherState) {
                    const wsMatch = weatherStateMap.get(sr.weatherState.toLowerCase());
                    if (!wsMatch) {
                        stepErrors.push({ row: sr.row, input: si, message: `'${sr.weatherState}' is not a recognised weather state code_name for this guild` });
                        continue;
                    }
                    weatherStateId = wsMatch.id;
                }

                stepOrdersSeen.add(sr.stepOrder);
                validSteps.push({ stepOrder: sr.stepOrder, weatherStateId, durationHours: sr.durationHours });
            }

            // ── Validate season weights for this pattern ──────────────────────
            const weightEntry  = weightsByPattern.get(cleanCodeName) ?? { rows: [], errors: [] };
            const weightErrors = [...weightEntry.errors];
            const validWeights: { seasonId: number; weight: number }[] = [];
            const seasonsSeen = new Set<number>();

            for (const wr of weightEntry.rows) {
                const wi = rowInput(wr.pattern, wr.season, String(wr.weight ?? '?'));

                if (!wr.season) {
                    weightErrors.push({ row: wr.row, input: wi, message: 'Missing required field: season' });
                    continue;
                }
                if (wr.weight === null || wr.weight === undefined) {
                    weightErrors.push({ row: wr.row, input: wi, message: 'Missing required field: weight' });
                    continue;
                }
                if (typeof wr.weight !== 'number' || wr.weight <= 0) {
                    weightErrors.push({ row: wr.row, input: wi, message: 'weight must be a positive number' });
                    continue;
                }

                const seasonMatch = seasonMap.get(wr.season.toLowerCase());
                if (!seasonMatch) {
                    weightErrors.push({ row: wr.row, input: wi, message: `'${wr.season}' is not a recognised season name` });
                    continue;
                }
                if (seasonsSeen.has(seasonMatch.id)) {
                    weightErrors.push({ row: wr.row, input: wi, message: `Duplicate season '${wr.season}' for this pattern` });
                    continue;
                }

                seasonsSeen.add(seasonMatch.id);
                validWeights.push({ seasonId: seasonMatch.id, weight: wr.weight });
            }

            errors.push(...stepErrors, ...weightErrors);

            candidates.push({
                dto:          row,
                codeName:     cleanCodeName,
                name:         nameCheck.value,
                isSevere:     row.isSevere ?? false,
                cooldownDays,
                steps:         validSteps,
                seasonWeights: validWeights,
                existing:      existingMap.get(cleanCodeName),
            });
        }

        // Catch orphaned step/weight rows whose pattern isn't in the patterns sheet
        for (const [key, entry] of stepsByPattern) {
            if (!seen.has(key)) {
                errors.push(...entry.errors);
                if (entry.rows.length > 0) {
                    errors.push({ row: 0, input: key, message: `steps sheet references pattern '${key}' which is not in the patterns sheet` });
                }
            }
        }
        for (const [key, entry] of weightsByPattern) {
            if (!seen.has(key)) {
                errors.push(...entry.errors);
                if (entry.rows.length > 0) {
                    errors.push({ row: 0, input: key, message: `season_weights sheet references pattern '${key}' which is not in the patterns sheet` });
                }
            }
        }

        // ── Upsert all candidates ─────────────────────────────────────────────
        const results = await Promise.allSettled(
            candidates.map(c => this.repo.upsertWeatherPattern({
                guildId:      dto.guildId,
                codeName:     c.codeName,
                name:         c.name,
                isSevere:     c.isSevere,
                cooldownDays: c.cooldownDays,
                steps:         c.steps,
                seasonWeights: c.seasonWeights,
            })),
        );

        const saved:      PatternSavedRow[]       = [];
        const overwrites: PatternOverwrittenRow[]  = [];

        results.forEach((result, i) => {
            const c = candidates[i];
            if (result.status === 'fulfilled') {
                saved.push({ row: c.dto.row, codeName: c.codeName, name: c.name, isSevere: c.isSevere, cooldownDays: c.cooldownDays, stepCount: c.steps.length });
                if (c.existing) {
                    overwrites.push({
                        row:             c.dto.row,
                        codeName:        c.codeName,
                        oldName:         c.existing.name,
                        newName:         c.name,
                        oldSevere:       c.existing.isSevere,
                        newSevere:       c.isSevere,
                        oldCooldownDays: c.existing.cooldownDays,
                        newCooldownDays: c.cooldownDays,
                    });
                }
            } else {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName, c.name), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => a.row - b.row);

        this.cache.invalidateWeatherPatterns(dto.guildId);
        return { saved, errors, overwrites };
    }
}
