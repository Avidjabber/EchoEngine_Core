import { IsString, IsNotEmpty } from 'class-validator';

export class ClientTokenDto {
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @IsString()
    @IsNotEmpty()
    clientSecret: string;
}
