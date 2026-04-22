import { IsNotEmpty, IsString } from 'class-validator';

export class ResetGuildSettingsDto {
    @IsString()
    @IsNotEmpty()
    declare guildId: string;
}
