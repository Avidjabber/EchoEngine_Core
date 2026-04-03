import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    health(): object {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
