import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

@Injectable()
export class WeatherStatesRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllEnvConditions() {
        return this.db.envCondition.findMany({
            select: { id: true, codeName: true },
        });
    }

    findGuildWeatherStates(guildId: string) {
        return this.db.weatherState.findMany({
            where:   { guildId },
            select:  {
                id:       true,
                codeName: true,
                name:     true,
                isSevere: true,
                envConditions: {
                    select: { envCondition: { select: { id: true, codeName: true } } },
                },
            },
            orderBy: { codeName: 'asc' },
        });
    }

    upsertWeatherState(data: {
        guildId:         string;
        codeName:        string;
        name:            string;
        isSevere:        boolean;
        envConditionIds: number[];
    }) {
        return this.db.$transaction(async (tx) => {
            const state = await tx.weatherState.upsert({
                where:  { guildId_codeName: { guildId: data.guildId, codeName: data.codeName } },
                create: { guildId: data.guildId, codeName: data.codeName, name: data.name, isSevere: data.isSevere },
                update: { name: data.name, isSevere: data.isSevere },
                select: { id: true },
            });

            await tx.weatherState_EnvCondition.deleteMany({ where: { weatherStateId: state.id } });

            if (data.envConditionIds.length > 0) {
                await tx.weatherState_EnvCondition.createMany({
                    data: data.envConditionIds.map(envConditionId => ({ weatherStateId: state.id, envConditionId })),
                });
            }

            return state;
        });
    }

    findGuildWeatherState(guildId: string, codeName: string) {
        return this.db.weatherState.findUnique({
            where:  { guildId_codeName: { guildId, codeName } },
            select: {
                codeName: true,
                name:     true,
                isSevere: true,
                envConditions: {
                    select: { envCondition: { select: { codeName: true } } },
                },
            },
        });
    }

    checkDeleteWeatherState(guildId: string, codeName: string) {
        return this.db.weatherState.findUnique({
            where:  { guildId_codeName: { guildId, codeName } },
            select: {
                name: true,
                _count: {
                    select: {
                        patternSteps:         true,
                        eventWeatherTriggers: true,
                        guildSeasonDefaults:  true,
                    },
                },
            },
        });
    }

    deleteWeatherStateByCodeName(guildId: string, codeName: string) {
        return this.db.weatherState.delete({
            where: { guildId_codeName: { guildId, codeName } },
        });
    }

    deleteWeatherStateById(id: number) {
        return this.db.weatherState.delete({ where: { id } });
    }
}
