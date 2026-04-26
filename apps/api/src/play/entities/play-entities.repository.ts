import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

export interface PlayCharacter {
    id:          number;
    name:        string;
    age:         number;
    factionId:   number;
    factionName: string;
}

@Injectable()
export class PlayEntitiesRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    async findMyCharacters(guildId: string, userId: string): Promise<PlayCharacter[]> {
        const rows = await this.db.entity.findMany({
            where: {
                guildId,
                userId,
                isDeceased: false,
                type: { name: 'Main Character' },
            },
            select: {
                id:      true,
                name:    true,
                age:     true,
                faction: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });

        return rows.map(r => ({
            id:          r.id,
            name:        r.name,
            age:         r.age,
            factionId:   r.faction!.id,
            factionName: r.faction!.name,
        }));
    }
}
