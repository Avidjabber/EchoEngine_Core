import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DiscordOAuthStrategy } from './strategies/discord.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            // Default expiry — individual sign() calls can override this
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, DiscordOAuthStrategy],
    // Export JwtAuthGuard-related pieces so other modules can protect their routes
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
