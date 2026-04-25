import { colors } from '../../../../../core/colors';
import type { CombatSetup } from './setupState';

export function buildInviteComponents(
    setup:      CombatSetup,
    teamIndex:  number,
    targetUserId: string,
    entityId:   number,
    entityName: string,
): object[] {
    const teamNum  = teamIndex + 1;
    const typeStr  = setup.type === 'spar' ? 'spar' : 'fight';

    return [
        {
            type:         17,
            accent_color: colors.special,
            components: [
                { type: 10, content: `<@${targetUserId}>` },
                { type: 10, content: `**${entityName}** has been invited to join a **${typeStr}** on Team ${teamNum}.` },
                { type: 14, divider: true },
                { type: 10, content: `-# Accept to add ${entityName} to the team. Your character must have enough energy at the time combat starts.` },
            ],
        },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: 'Accept', custom_id: `pa_invite_accept:${setup.setupId}:${teamIndex}:${entityId}` },
                { type: 2, style: 4, label: 'Decline', custom_id: `pa_invite_reject:${setup.setupId}:${entityId}` },
            ],
        },
    ];
}
