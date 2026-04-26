import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ServerModule } from './server/server.module';
import { ModelModule } from './model/model.module';
import { PlayModule } from './play/play.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        AuthModule,
        ServerModule,
        ModelModule,
        PlayModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
