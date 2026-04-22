import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../database/primary.service';

@Injectable()
export class ServerRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findDen(guildId: string, channelId: string) {
        return this.db.echoDens.findUnique({
            where: { guildId_channelId: { guildId, channelId } },
        });
    }

    findDens(guildId: string) {
        return this.db.echoDens.findMany({
            where: { guildId },
        });
    }

    deleteDen(guildId: string, channelId: string) {
        return this.db.echoDens.delete({
            where: { guildId_channelId: { guildId, channelId } },
        });
    }

    createDen(guildId: string, channelId: string) {
        return this.db.echoDens.create({
            data: { guildId, channelId },
        });
    }

    findGuildSettings(guildId: string) {
        return this.db.guildSettings.findUnique({
            where: { guildId },
            include: {
                disciplineLevelCaps: { include: { disciplineDef: true } },
            },
        });
    }

    updateGuildSettings(guildId: string, data: {
        defaultDailyEnergy?:      number;
        doubleAgeMaxThreshold?:   number;
        maxCombatRounds?:         number;
        defaultProficiencyBonus?: number;
        disciplineLevelCap?:      number | null;
        factionRepDecayRate?:     number;
        farmingSoilDegradationFilth?: number;
        farmingSoilDegradationToxic?: number;
        farmingCompostIncrement?:     number;
        worldSimEnabled?:    boolean;
        conditionsEnabled?:  boolean;
        combatEnabled?:      boolean;
        activitiesEnabled?:  boolean;
        eventsEnabled?:      boolean;
        craftingEnabled?:    boolean;
        progressionEnabled?: boolean;
        socialEnabled?:      boolean;
    }) {
        return this.db.guildSettings.update({
            where: { guildId },
            data,
        });
    }

    createGuildSettings(guildId: string) {
        return this.db.guildSettings.create({
            data: { guildId },
        });
    }

    updateDen(guildId: string, channelId: string, data: {
        allowWorldSim: boolean;
        allowConditions: boolean;
        allowCombat: boolean;
        allowActivities: boolean;
        allowEvents: boolean;
        allowCrafting: boolean;
        allowProgression: boolean;
        allowSocial: boolean;
    }) {
        return this.db.echoDens.update({
            where: { guildId_channelId: { guildId, channelId } },
            data,
        });
    }
}
