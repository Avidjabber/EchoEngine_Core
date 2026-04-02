import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { ClientTokenDto } from './dto/client-token.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { DiscordProfile } from './strategies/discord.strategy';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ── Service client (bot, worker) ──────────────────────────────────────────

    // POST /auth/token
    // Body: { clientId, clientSecret }
    // Returns: { accessToken }
    @Post('token')
    async token(@Body() dto: ClientTokenDto) {
        return this.authService.authenticateServiceClient(dto.clientId, dto.clientSecret);
    }

    // ── Website user — Discord OAuth ──────────────────────────────────────────

    // GET /auth/discord
    // Redirects the user's browser to Discord's OAuth consent screen
    @Get('discord')
    @UseGuards(DiscordAuthGuard)
    discordLogin() {
        // Guard handles the redirect — this body never executes
    }

    // GET /auth/discord/callback
    // Discord redirects here after the user approves; issues JWT + refresh token
    @Get('discord/callback')
    @UseGuards(DiscordAuthGuard)
    async discordCallback(@Req() req: { user: DiscordProfile }, @Res() res: Response) {
        const tokens = await this.authService.authenticateDiscordUser(req.user);

        // TODO: redirect to the website with tokens, or set httpOnly cookie.
        // For now, return JSON so you can test the flow directly.
        return res.json(tokens);
    }

    // ── Refresh token rotation ────────────────────────────────────────────────

    // POST /auth/refresh
    // Body: { refreshToken }
    // Returns: { accessToken, refreshToken } (new pair — old refresh token is revoked)
    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshUserTokens(dto.refreshToken);
    }
}
