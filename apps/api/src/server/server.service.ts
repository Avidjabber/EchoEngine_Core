import { ConflictException, Injectable } from '@nestjs/common';
import { errorCodes } from '@echoengine/shared';
import { CreateDenDto } from './dto/create-den.dto';
import { ServerRepository } from './server.repository';

@Injectable()
export class ServerService {
    constructor(private readonly serverRepo: ServerRepository) {}

    async getDens(guildId: string) {
        return this.serverRepo.findDens(guildId);
    }

    async createDen(dto: CreateDenDto) {
        const existing = await this.serverRepo.findDen(dto.guildId, dto.channelId);

        if (existing) {
            throw new ConflictException({
                code: errorCodes.DEN_ALREADY_EXISTS,
                message: 'This channel is already registered as an Echo Den.',
            });
        }

        const den = await this.serverRepo.createDen(dto.guildId, dto.channelId);

        const existingSettings = await this.serverRepo.findGuildSettings(dto.guildId);
        const firstTimeSetup = !existingSettings;
        if (firstTimeSetup) {
            await this.serverRepo.createGuildSettings(dto.guildId, dto.ownerId);
        }

        return { den, firstTimeSetup };
    }
}
