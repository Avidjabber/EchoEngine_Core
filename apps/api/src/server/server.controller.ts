import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { CreateDenDto } from './dto/create-den.dto';
import { UpdateDenDto } from './dto/update-den.dto';
import { UpdateGuildSettingsDto } from './dto/update-guild-settings.dto';
import { ResetGuildSettingsDto } from './dto/reset-guild-settings.dto';
import { ServerService } from './server.service';

@Controller('server')
export class ServerController {
    constructor(private readonly serverService: ServerService) {}

    @Get('settings')
    getGuildSettings(@Query('guildId') guildId: string) {
        return this.serverService.getGuildSettings(guildId);
    }

    @Patch('settings')
    updateGuildSettings(@Body() dto: UpdateGuildSettingsDto) {
        return this.serverService.updateGuildSettings(dto);
    }

    @Post('settings/reset')
    @HttpCode(HttpStatus.OK)
    resetGuildSettings(@Body() dto: ResetGuildSettingsDto) {
        return this.serverService.resetGuildSettings(dto);
    }

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

    @Get('dens/single')
    getDen(@Query('guildId') guildId: string, @Query('channelId') channelId: string) {
        return this.serverService.getDen(guildId, channelId);
    }

    @Patch('dens')
    updateDen(@Body() dto: UpdateDenDto) {
        return this.serverService.updateDen(dto);
    }
}
