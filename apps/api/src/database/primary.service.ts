import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/primary';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrimaryDatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.PRIMARY_DATABASE_URL!,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('[PrimaryDB] Connected');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('[PrimaryDB] Disconnected');
    }
}
