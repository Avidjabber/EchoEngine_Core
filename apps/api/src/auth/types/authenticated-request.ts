import { Request } from 'express';
import { JwtPayload } from './jwt-payload';

// Express request with a validated JWT payload attached by JwtStrategy
export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}
