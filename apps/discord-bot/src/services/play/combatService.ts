import { apiClient } from '../api';

export interface CombatTargetEntity {
    id:          number;
    name:        string;
    age:         number;
    factionId:   number;
    factionName: string;
    userId:      string;
}

export function fetchInviteTargets(guildId: string, initiatorEntityId: number, mode: 'spar' | 'fight') {
    return apiClient.get<CombatTargetEntity[]>('/play/combat/invite-targets', {
        guildId,
        initiatorEntityId: String(initiatorEntityId),
        mode,
    });
}

export function fetchSignupTargets(guildId: string, userId: string, initiatorFactionId: number, mode: 'spar' | 'fight') {
    return apiClient.get<CombatTargetEntity[]>('/play/combat/signup-targets', {
        guildId,
        userId,
        initiatorFactionId: String(initiatorFactionId),
        mode,
    });
}
