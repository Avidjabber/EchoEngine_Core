import { Controller, Get, Query } from '@nestjs/common';
import { PlayEntitiesService } from './play-entities.service';

@Controller('play/entities')
export class PlayEntitiesController {
    constructor(private readonly service: PlayEntitiesService) {}

    @Get('my-characters')
    getMyCharacters(
        @Query('guildId') guildId: string,
        @Query('userId')  userId:  string,
    ) {
        return this.service.getMyCharacters(guildId, userId);
    }
}
