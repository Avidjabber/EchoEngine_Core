import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Apply to the /auth/discord route to initiate the Discord OAuth redirect.
// Apply to the /auth/discord/callback route to handle the callback.
// Usage: @UseGuards(DiscordAuthGuard)
@Injectable()
export class DiscordAuthGuard extends AuthGuard('discord') {}
