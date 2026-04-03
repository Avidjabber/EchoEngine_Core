import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Applied to all routes in ServerModule (and any future bot-facing modules).
 * Validates the shared secret the Discord bot sends as Authorization: Bearer <API_KEY>.
 */
@Injectable()
export class BotApiKeyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers['authorization'] ?? '';
        const [scheme, key] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !key || key !== process.env.BOT_API_KEY) {
            throw new UnauthorizedException('Invalid API key');
        }

        next();
    }
}
