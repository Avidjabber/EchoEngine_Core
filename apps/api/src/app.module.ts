import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ServerModule } from './server/server.module';
import { ModelModule } from './model/model.module';
import { PlayModule } from './play/play.module';
import { WeatherSimModule } from './weather-sim/weather-sim.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 1000 }]),
        DatabaseModule,
        AuthModule,
        ServerModule,
        ModelModule,
        PlayModule,
        WeatherSimModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}
