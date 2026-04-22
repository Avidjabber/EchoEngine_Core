import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDenDto {
    @IsString()
    @IsNotEmpty()
    declare guildId: string;

    @IsString()
    @IsNotEmpty()
    declare channelId: string;

}
