import { Injectable } from '@nestjs/common';
import { PlayEntitiesRepository } from './play-entities.repository';

@Injectable()
export class PlayEntitiesService {
    constructor(private readonly repo: PlayEntitiesRepository) {}

    getMyCharacters(guildId: string, userId: string) {
        return this.repo.findMyCharacters(guildId, userId);
    }
}
