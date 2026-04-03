import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CreateDenDto } from './dto/create-den.dto';
import { ServerService } from './server.service';

@Controller('server')
export class ServerController {
    constructor(private readonly serverService: ServerService) {}

    @Get('dens')
    getDens(@Query('guildId') guildId: string) {
        return this.serverService.getDens(guildId);
    }

    @Delete('dens')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeDen(@Query('guildId') guildId: string, @Query('channelId') channelId: string) {
        return this.serverService.removeDen(guildId, channelId);
    }

    @Post('dens')
    @HttpCode(HttpStatus.CREATED)
    createDen(@Body() dto: CreateDenDto) {
        return this.serverService.createDen(dto);
    }
}
