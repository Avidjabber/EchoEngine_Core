import { Injectable } from '@nestjs/common';
import { PlayCombatRepository } from './play-combat.repository';

@Injectable()
export class PlayCombatService {
    constructor(private readonly repo: PlayCombatRepository) {}

    getInviteTargets(guildId: string, initiatorEntityId: number, mode: 'spar' | 'fight') {
        return this.repo.findInviteTargets(guildId, initiatorEntityId, mode);
    }

    getSignupTargets(guildId: string, userId: string, initiatorFactionId: number, mode: 'spar' | 'fight') {
        return this.repo.findSignupTargets(guildId, userId, initiatorFactionId, mode);
    }
}
