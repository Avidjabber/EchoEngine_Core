import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

@Injectable()
export class WeatherPatternsRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllSeasons() {
        return this.db.season.findMany({
            select:  { id: true, name: true },
            orderBy: { id: 'asc' },
        });
    }

    findGuildWeatherStateCodes(guildId: string) {
        return this.db.weatherState.findMany({
            where:   { guildId },
            select:  { id: true, codeName: true },
            orderBy: { codeName: 'asc' },
        });
    }

    findGuildWeatherPatterns(guildId: string) {
        return this.db.weatherPattern.findMany({
            where:   { guildId },
            select:  {
                id:           true,
                codeName:     true,
                name:         true,
                isSevere:     true,
                cooldownDays: true,
                steps: {
                    select: {
                        stepOrder:    true,
                        durationHours: true,
                        weatherState: { select: { id: true, codeName: true } },
                    },
                    orderBy: { stepOrder: 'asc' },
                },
                seasonWeights: {
                    select: {
                        season: { select: { id: true, name: true } },
                        weight: true,
                    },
                },
            },
            orderBy: { codeName: 'asc' },
        });
    }

    upsertWeatherPattern(data: {
        guildId:      string;
        codeName:     string;
        name:         string;
        isSevere:     boolean;
        cooldownDays: number;
        steps: { stepOrder: number; weatherStateId: number | null; durationHours: number }[];
        seasonWeights: { seasonId: number; weight: number }[];
    }) {
        return this.db.$transaction(async (tx) => {
            const pattern = await tx.weatherPattern.upsert({
                where:  { guildId_codeName: { guildId: data.guildId, codeName: data.codeName } },
                create: { guildId: data.guildId, codeName: data.codeName, name: data.name, isSevere: data.isSevere, cooldownDays: data.cooldownDays },
                update: { name: data.name, isSevere: data.isSevere, cooldownDays: data.cooldownDays },
                select: { id: true },
            });

            await tx.weatherPatternStep.deleteMany({ where: { patternId: pattern.id } });
            if (data.steps.length > 0) {
                await tx.weatherPatternStep.createMany({
                    data: data.steps.map(s => ({
                        patternId:     pattern.id,
                        stepOrder:     s.stepOrder,
                        weatherStateId: s.weatherStateId,
                        durationHours: s.durationHours,
                    })),
                });
            }

            await tx.season_WeatherPattern.deleteMany({ where: { patternId: pattern.id } });
            if (data.seasonWeights.length > 0) {
                await tx.season_WeatherPattern.createMany({
                    data: data.seasonWeights.map(sw => ({
                        patternId: pattern.id,
                        seasonId:  sw.seasonId,
                        weight:    sw.weight,
                    })),
                });
            }

            return pattern;
        });
    }

    findGuildWeatherPattern(guildId: string, codeName: string) {
        return this.db.weatherPattern.findUnique({
            where:  { guildId_codeName: { guildId, codeName } },
            select: {
                codeName:     true,
                name:         true,
                isSevere:     true,
                cooldownDays: true,
                steps: {
                    select: {
                        stepOrder:    true,
                        durationHours: true,
                        weatherState: { select: { codeName: true } },
                    },
                    orderBy: { stepOrder: 'asc' },
                },
                seasonWeights: {
                    select: {
                        season: { select: { name: true } },
                        weight: true,
                    },
                },
            },
        });
    }

    deleteWeatherPatternById(id: number) {
        return this.db.weatherPattern.delete({ where: { id } });
    }

    deleteWeatherPatternByCodeName(guildId: string, codeName: string) {
        return this.db.weatherPattern.delete({
            where: { guildId_codeName: { guildId, codeName } },
        });
    }
}
