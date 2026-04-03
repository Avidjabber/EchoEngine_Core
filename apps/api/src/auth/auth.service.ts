import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrimaryDatabaseService } from '../database/primary.service';
import { JwtPayload } from './types/jwt-payload';
import { DiscordProfile } from './strategies/discord.strategy';

// Access tokens are short-lived; services re-authenticate, users use refresh tokens
const ACCESS_TOKEN_TTL  = '15m';
const SERVICE_TOKEN_TTL = '24h';
// Refresh tokens are long-lived but rotated on every use
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
    constructor(
        private readonly db: PrimaryDatabaseService,
        private readonly jwt: JwtService,
    ) {}

    // ── Service client (bot, worker) ──────────────────────────────────────────

    async authenticateServiceClient(
        clientId: string,
        clientSecret: string,
    ): Promise<{ accessToken: string }> {
        const client = await this.db.serviceClient.findUnique({ where: { clientId } });

        if (!client || !client.isActive) {
            throw new UnauthorizedException('Invalid client credentials');
        }

        const secretMatches = await bcrypt.compare(clientSecret, client.secretHash);
        if (!secretMatches) {
            throw new UnauthorizedException('Invalid client credentials');
        }

        const payload: JwtPayload = { sub: client.clientId, type: 'service' };
        return { accessToken: this.jwt.sign(payload, { expiresIn: SERVICE_TOKEN_TTL }) };
    }

    // ── Website user (Discord OAuth) ──────────────────────────────────────────

    async authenticateDiscordUser(
        profile: DiscordProfile,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // Upsert the user — first login creates the record, subsequent logins update it
        const user = await this.db.user.upsert({
            where:  { discordId: profile.id },
            update: { username: profile.username, avatar: profile.avatar },
            create: { discordId: profile.id, username: profile.username, avatar: profile.avatar },
        });

        return this.issueTokenPair(user.id, profile.id);
    }

    async refreshUserTokens(
        rawRefreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // Find all non-revoked, non-expired tokens and check each hash
        // (We search by userId via brute-force hash comparison in practice you'd
        //  store a lookup-safe prefix or use a different scheme for large userbases)
        const candidates = await this.db.refreshToken.findMany({
            where: {
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        const match = await this.findMatchingToken(candidates, rawRefreshToken);

        if (!match) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Rotate — revoke the old token immediately
        await this.db.refreshToken.update({
            where: { id: match.id },
            data:  { revokedAt: new Date() },
        });

        return this.issueTokenPair(match.userId, match.user.discordId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async issueTokenPair(
        userId: string,
        discordId: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const payload: JwtPayload = { sub: discordId, type: 'user' };
        const accessToken = this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

        // Generate a cryptographically random refresh token
        const rawRefreshToken = crypto.randomBytes(64).toString('hex');
        const tokenHash = await bcrypt.hash(rawRefreshToken, 10);

        await this.db.refreshToken.create({
            data: {
                tokenHash,
                userId,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
            },
        });

        return { accessToken, refreshToken: rawRefreshToken };
    }

    private async findMatchingToken(
        candidates: Awaited<ReturnType<typeof this.db.refreshToken.findMany>> & { user: { discordId: string } }[],
        rawToken: string,
    ) {
        for (const candidate of candidates) {
            const matches = await bcrypt.compare(rawToken, candidate.tokenHash);
            if (matches) return candidate;
        }
        return null;
    }
}
