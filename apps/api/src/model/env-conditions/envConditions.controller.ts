import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UploadEnvConditionPackDto } from './dto/upload-env-condition-pack.dto';
import { EnvConditionsService } from './envConditions.service';

@Controller('model/env-conditions')
export class EnvConditionsController {
    constructor(private readonly envConditionsService: EnvConditionsService) {}

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadEnvConditionPackDto) {
        return this.envConditionsService.uploadPack(dto);
    }
}
