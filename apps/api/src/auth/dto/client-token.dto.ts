import { IsString, IsNotEmpty } from 'class-validator';

export class ClientTokenDto {
    @IsString()
    @IsNotEmpty()
    declare clientId: string;

    @IsString()
    @IsNotEmpty()
    declare clientSecret: string;
}
