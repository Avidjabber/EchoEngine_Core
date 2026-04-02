import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET!,
        });
    }

    // Passport calls this after signature + expiry are verified.
    // Whatever we return here is attached to request.user.
    validate(payload: JwtPayload): JwtPayload {
        if (!payload.sub || !payload.type) {
            throw new UnauthorizedException('Malformed token');
        }
        return payload;
    }
}
