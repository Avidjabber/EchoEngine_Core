import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-discord-auth';

export interface DiscordProfile {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
}

@Injectable()
export class DiscordOAuthStrategy extends PassportStrategy(Strategy, 'discord') {
    constructor() {
        super({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            callbackUrl: process.env.DISCORD_CALLBACK_URL!,
            scope: ['identify'],
        });
    }

    validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
    ): DiscordProfile {
        return {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar ?? null,
            discriminator: profile.discriminator ?? '',
        };
    }
}
