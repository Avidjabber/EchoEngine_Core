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

    createDen(guildId: string, channelId: string) {
        return this.db.echoDens.create({
            data: { guildId, channelId },
        });
    }

    findGuildSettings(guildId: string) {
        return this.db.guildSettings.findUnique({
            where: { guildId },
        });
    }

    createGuildSettings(guildId: string, ownerId: string) {
        return this.db.guildSettings.create({
            data: { guildId, ownerId },
        });
    }
}
