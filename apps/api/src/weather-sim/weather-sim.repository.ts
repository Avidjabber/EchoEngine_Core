import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../database/primary.service';

const weatherStateSelect = {
    codeName:      true,
    name:          true,
    isSevere:      true,
    envConditions: {
        select: { envCondition: { select: { name: true } } },
    },
} as const;

@Injectable()
export class WeatherSimRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findEnabledGuildIds() {
        return this.db.guildSettings.findMany({
            where:  { worldSimEnabled: true },
            select: { guildId: true },
        });
    }

    findGuildTickData(guildId: string) {
        return this.db.guildSettings.findUnique({
            where:  { guildId },
            select: {
                worldSimEnabled:      true,
                timezoneOffset:       true,
                seasonId:             true,
                currentPatternId:     true,
                currentPatternStepId: true,
                currentStepStartedAt: true,
                currentPatternStep: {
                    select: {
                        stepOrder:     true,
                        durationHours: true,
                    },
                },
            },
        });
    }

    findStepFull(stepId: number) {
        return this.db.weatherPatternStep.findUnique({
            where:  { id: stepId },
            select: { weatherState: { select: weatherStateSelect } },
        });
    }

    findNextStep(patternId: number, currentStepOrder: number) {
        return this.db.weatherPatternStep.findFirst({
            where:  { patternId, stepOrder: currentStepOrder + 1 },
            select: { id: true },
        });
    }

    findSeasonDefault(guildId: string, seasonId: number) {
        return this.db.guildSeason_DefaultWeather.findUnique({
            where:  { guildId_seasonId: { guildId, seasonId } },
            select: { weatherState: { select: weatherStateSelect } },
        }).then(row => row?.weatherState ?? null);
    }

    findEligiblePatterns(guildId: string, seasonId: number) {
        return this.db.season_WeatherPattern.findMany({
            where: {
                seasonId,
                pattern: { guildId },
            },
            select: {
                weight:  true,
                pattern: {
                    select: {
                        id:           true,
                        cooldownDays: true,
                        steps: {
                            select:  { id: true },
                            orderBy: { stepOrder: 'asc' },
                            take:    1,
                        },
                        guildCooldowns: {
                            where:  { guildId },
                            select: { lastRunAt: true },
                        },
                    },
                },
            },
        });
    }

    advanceToStep(guildId: string, stepId: number, now: Date) {
        return this.db.guildSettings.update({
            where: { guildId },
            data:  {
                currentPatternStepId: stepId,
                currentStepStartedAt: now,
            },
        });
    }

    startPattern(guildId: string, patternId: number, firstStepId: number, now: Date) {
        return this.db.guildSettings.update({
            where: { guildId },
            data:  {
                currentPatternId:     patternId,
                currentPatternStepId: firstStepId,
                currentStepStartedAt: now,
            },
        });
    }

    clearPattern(guildId: string) {
        return this.db.guildSettings.update({
            where: { guildId },
            data:  {
                currentPatternId:     null,
                currentPatternStepId: null,
                currentStepStartedAt: null,
            },
        });
    }

    upsertCooldown(guildId: string, patternId: number, now: Date) {
        return this.db.guild_WeatherPatternCooldown.upsert({
            where:  { guildId_patternId: { guildId, patternId } },
            create: { guildId, patternId, lastRunAt: now },
            update: { lastRunAt: now },
        });
    }

    findFirstWeatherSimDen(guildId: string) {
        return this.db.echoDens.findFirst({
            where:   { guildId, allowWorldSim: true },
            select:  { channelId: true },
            orderBy: { id: 'asc' },
        });
    }
}
