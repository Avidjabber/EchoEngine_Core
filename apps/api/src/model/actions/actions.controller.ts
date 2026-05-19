import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActionsService } from './actions.service';

@Controller('model/actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
    constructor(private readonly actionsService: ActionsService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.actionsService.getTemplateData(guildId);
    }

    @Get('download')
    download(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.actionsService.downloadPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    uploadPack(
        @UploadedFile() file: Express.Multer.File,
        @Body('guildId') guildId: string,
    ) {
        if (!guildId) throw new BadRequestException('guildId is required');
        if (!file)    throw new BadRequestException('file is required');
        return this.actionsService.uploadPack(guildId, file.buffer);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.actionsService.resetPack(guildId);
    }
}
