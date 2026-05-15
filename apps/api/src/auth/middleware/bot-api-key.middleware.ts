import * as crypto from 'crypto';
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BotApiKeyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers['authorization'] ?? '';
        const [scheme, key] = authHeader.split(' ');

        const expected = Buffer.from(process.env.BOT_API_KEY ?? '');
        const provided  = Buffer.from(key ?? '');

        const valid =
            scheme === 'Bearer' &&
            provided.length > 0 &&
            provided.length === expected.length &&
            crypto.timingSafeEqual(provided, expected);

        if (!valid) {
            throw new UnauthorizedException('Invalid API key');
        }

        next();
    }
}
