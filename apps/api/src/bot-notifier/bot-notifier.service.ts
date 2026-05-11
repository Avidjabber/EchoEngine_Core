import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PostWeatherPayload {
    channelId:           string;
    guildId:             string;
    currentWeatherState: WeatherStatePayload | null;
}

export interface WeatherStatePayload {
    codeName:      string;
    name:          string;
    isSevere:      boolean;
    envConditions: string[];
}

@Injectable()
export class BotNotifierService {
    private readonly logger = new Logger(BotNotifierService.name);
    private readonly botUrl: string;
    private readonly secret: string;

    constructor(private readonly config: ConfigService) {
        this.botUrl = this.config.get<string>('BOT_INTERNAL_URL') ?? 'http://localhost:4000';
        this.secret = this.config.get<string>('BOT_INTERNAL_SECRET') ?? '';
    }

    async postWeather(payload: PostWeatherPayload): Promise<void> {
        try {
            const res = await fetch(`${this.botUrl}/internal/post-weather`, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${this.secret}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                this.logger.error(`Bot returned ${res.status} for weather notification on channel ${payload.channelId}`);
            }
        } catch (err) {
            this.logger.error(`Failed to notify bot of weather update for channel ${payload.channelId}`, err);
        }
    }
}
