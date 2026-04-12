import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateDenDto {
    @IsString()
    @IsNotEmpty()
    declare guildId: string;

    @IsString()
    @IsNotEmpty()
    declare channelId: string;

    @IsBoolean()
    declare allowWorldSim: boolean;

    @IsBoolean()
    declare allowConditions: boolean;

    @IsBoolean()
    declare allowCombat: boolean;

    @IsBoolean()
    declare allowActivities: boolean;

    @IsBoolean()
    declare allowEvents: boolean;

    @IsBoolean()
    declare allowCrafting: boolean;

    @IsBoolean()
    declare allowProgression: boolean;

    @IsBoolean()
    declare allowSocial: boolean;
}
