import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
export class PlayEntitiesController {
    constructor(private readonly service: PlayEntitiesService) {}

    @Get('my-characters')
    getMyCharacters(@Query() query: GetMyCharactersDto) {
        return this.service.getMyCharacters(query.guildId, query.userId);
    }
}
