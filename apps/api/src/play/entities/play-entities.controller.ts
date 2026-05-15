import { Controller, Get, Query } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { PlayEntitiesService } from './play-entities.service';

class GetMyCharactersDto {
    @IsString()
    @IsNotEmpty()
    guildId!: string;

    @IsString()
    @IsNotEmpty()
    userId!: string;
}

@Controller('play/entities')
export class PlayEntitiesController {
    constructor(private readonly service: PlayEntitiesService) {}

    @Get('my-characters')
    getMyCharacters(@Query() query: GetMyCharactersDto) {
        return this.service.getMyCharacters(query.guildId, query.userId);
    }
}
