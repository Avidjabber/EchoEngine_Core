import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// passport-discord does not ship its own type declarations
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DiscordStrategy = require('passport-discord');

export interface DiscordProfile {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
}

@Injectable()
export class DiscordOAuthStrategy extends PassportStrategy(DiscordStrategy, 'discord') {
    constructor() {
        super({
            clientID: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            callbackURL: process.env.DISCORD_CALLBACK_URL!,
            // identify gives us id, username, avatar — sufficient for our needs
            scope: ['identify'],
        });
    }

    // Passport calls this after Discord redirects back with a verified profile.
    // Whatever we return here is attached to request.user.
    validate(
        _accessToken: string,
        _refreshToken: string,
        profile: DiscordProfile,
    ): DiscordProfile {
        return profile;
    }
}
