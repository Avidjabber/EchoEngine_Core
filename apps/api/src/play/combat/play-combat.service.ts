import { Injectable } from '@nestjs/common';
import { PlayCombatRepository, StartCombatTeam } from './play-combat.repository';

@Injectable()
export class PlayCombatService {
    constructor(private readonly repo: PlayCombatRepository) {}

    getInviteTargets(guildId: string, initiatorEntityId: number, mode: 'spar' | 'fight') {
        return this.repo.findInviteTargets(guildId, initiatorEntityId, mode);
    }

    getSignupTargets(guildId: string, userId: string, initiatorFactionId: number, mode: 'spar' | 'fight') {
        return this.repo.findSignupTargets(guildId, userId, initiatorFactionId, mode);
    }

    startCombat(guildId: string, type: 'spar' | 'fight', teams: StartCombatTeam[]) {
        return this.repo.startCombat(guildId, type, teams);
    }
}
