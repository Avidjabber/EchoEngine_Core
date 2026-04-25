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

    getParticipants(combatId: number) {
        return this.repo.getParticipants(combatId);
    }

    getAvailableActions(combatId: number, entityId: number, category: 'main' | 'bonus' | 'item') {
        return this.repo.getAvailableActions(combatId, entityId, category);
    }

    advanceTurn(combatId: number, currentEntityId: number) {
        return this.repo.advanceTurn(combatId, currentEntityId);
    }

    processAction(
        combatId:       number,
        actorEntityId:  number,
        profileId:      number,
        storedItemId:   number,
        targetEntityId: number | null,
        roundNumber:    number,
    ) {
        return this.repo.processAction(combatId, actorEntityId, profileId, storedItemId, targetEntityId, roundNumber);
    }

    distributeCombatXp(combatId: number) {
        return this.repo.distributeCombatXp(combatId);
    }

    acceptSecondWind(combatId: number, entityId: number) {
        return this.repo.acceptSecondWind(combatId, entityId);
    }

    declineSecondWind(combatId: number, entityId: number) {
        return this.repo.declineSecondWind(combatId, entityId);
    }

    flee(combatId: number, entityId: number) {
        return this.repo.flee(combatId, entityId);
    }

    processReaction(combatId: number, defenderEntityId: number, profileId: number, storedItemId: number, attackerEntityId: number, roundNumber: number) {
        return this.repo.processReaction(combatId, defenderEntityId, profileId, storedItemId, attackerEntityId, roundNumber);
    }
}
