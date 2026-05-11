import { Injectable } from '@nestjs/common';
import { BotNotifierService } from '../bot-notifier/bot-notifier.service';
import { WeatherSimRepository } from './weather-sim.repository';
import { TickAllResult, WeatherStateInfo, WeatherTickDto, WeatherTickResult } from './dto/weather-tick.dto';

type WeatherStateRow = NonNullable<Awaited<ReturnType<WeatherSimRepository['findSeasonDefault']>>>;

function resolveState(
    weatherState: WeatherStateRow | null | undefined,
    seasonDefault: WeatherStateRow | null,
): WeatherStateInfo | null {
    const ws = weatherState ?? seasonDefault;
    if (!ws) return null;
    return {
        codeName:      ws.codeName,
        name:          ws.name,
        isSevere:      ws.isSevere,
        envConditions: ws.envConditions.map(e => e.envCondition.name),
    };
}

function weightedPick<T extends { weight: number }>(items: T[]): T | null {
    const total = items.reduce((s, x) => s + x.weight, 0);
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (const x of items) {
        r -= x.weight;
        if (r <= 0) return x;
    }
    return items[items.length - 1] ?? null;
}

@Injectable()
export class WeatherSimService {
    constructor(
        private readonly repo:        WeatherSimRepository,
        private readonly botNotifier: BotNotifierService,
    ) {}

    async tickAll(): Promise<TickAllResult> {
        const rows    = await this.repo.findEnabledGuildIds();
        const results: TickAllResult['results'] = [];

        for (const row of rows) {
            const { currentWeatherState: _, ...summary } = await this.tick({ guildId: row.guildId });
            results.push({ guildId: row.guildId, ...summary });
        }

        return { processed: rows.length, results };
    }

    async tick(dto: WeatherTickDto): Promise<WeatherTickResult> {
        const guild = await this.repo.findGuildTickData(dto.guildId);

        if (!guild?.worldSimEnabled) {
            return { skipped: true, reason: 'world_sim_disabled', weatherChanged: false, patternChanged: false, currentWeatherState: null };
        }

        const now = new Date();
        let activePatternId    = guild.currentPatternId;
        let activeStepId       = guild.currentPatternStepId;
        let weatherChanged     = false;
        let patternChanged     = false;
        let noEligiblePatterns = false;

        if (guild.seasonId) {
            // ── Step progression ──────────────────────────────────────────────
            if (activePatternId && activeStepId && guild.currentStepStartedAt && guild.currentPatternStep) {
                const step     = guild.currentPatternStep;
                const expireAt = new Date(guild.currentStepStartedAt.getTime() + step.durationHours * 3_600_000);

                if (now >= expireAt) {
                    const nextStep = await this.repo.findNextStep(activePatternId, step.stepOrder);
                    if (nextStep) {
                        await this.repo.advanceToStep(dto.guildId, nextStep.id, now);
                        activeStepId = nextStep.id;
                    } else {
                        await this.repo.clearPattern(dto.guildId);
                        activePatternId = null;
                        activeStepId    = null;
                    }
                    weatherChanged = true;
                }
            }

            // ── Midnight: pick a new pattern if none is running ───────────────
            const localHour = ((now.getUTCHours() + guild.timezoneOffset) % 24 + 24) % 24;

            if (localHour === 0 && activePatternId === null) {
                const allEntries = await this.repo.findEligiblePatterns(dto.guildId, guild.seasonId);
                const eligible   = allEntries.filter(e => {
                    const cd = e.pattern.guildCooldowns[0];
                    if (!cd || e.pattern.cooldownDays <= 0) return true;
                    return now.getTime() >= cd.lastRunAt.getTime() + e.pattern.cooldownDays * 86_400_000;
                });

                if (eligible.length === 0) {
                    noEligiblePatterns = true;
                } else {
                    const picked = weightedPick(eligible);
                    if (picked?.pattern.steps[0]) {
                        const firstStepId = picked.pattern.steps[0].id;
                        await this.repo.startPattern(dto.guildId, picked.pattern.id, firstStepId, now);
                        await this.repo.upsertCooldown(dto.guildId, picked.pattern.id, now);
                        activePatternId = picked.pattern.id;
                        activeStepId    = firstStepId;
                        patternChanged  = true;
                        weatherChanged  = true;
                    }
                }
            }
        }

        // ── Resolve current weather state ─────────────────────────────────────
        let currentWeatherState: WeatherStateInfo | null = null;

        if (activeStepId && activePatternId && guild.seasonId) {
            const [currentStep, seasonDefault] = await Promise.all([
                this.repo.findStepFull(activeStepId),
                this.repo.findSeasonDefault(dto.guildId, guild.seasonId),
            ]);

            if (currentStep) {
                currentWeatherState = resolveState(currentStep.weatherState, seasonDefault);
            }
        }

        // ── Notify bot (always fires for world-sim-enabled guilds) ────────────
        const den = await this.repo.findFirstWeatherSimDen(dto.guildId);
        if (den) {
            await this.botNotifier.postWeather({
                channelId:           den.channelId,
                guildId:             dto.guildId,
                currentWeatherState: currentWeatherState,
            });
        }

        if (!guild.seasonId) {
            return { skipped: true, reason: 'no_season', weatherChanged: false, patternChanged: false, currentWeatherState: null };
        }

        if (noEligiblePatterns) {
            return { skipped: true, reason: 'no_eligible_patterns', weatherChanged, patternChanged, currentWeatherState: null };
        }

        return { skipped: false, weatherChanged, patternChanged, currentWeatherState };
    }
}
