import { Global, Module } from '@nestjs/common';
import { PrimaryDatabaseService } from './primary.service';

// Add future database services here as new schemas are introduced:
//   LoggingDatabaseService, MappingDatabaseService, etc.

@Global()
@Module({
    providers: [PrimaryDatabaseService],
    exports: [PrimaryDatabaseService],
})
export class DatabaseModule {}
