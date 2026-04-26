import { colors } from '../../../../../core/colors';
import type { CombatTargetEntity } from '../../../../../services/play/combatService';

const PAGE_SIZE = 10;

export function buildEntityPickerComponents(
    entities:  CombatTargetEntity[],
    setupId:   string,
    teamIndex: number,
    type:      'invite' | 'signup',
    page:      number,
): object[] {
    const confirmPrefix = type === 'invite' ? 'pa_epick_invite_pick' : 'pa_epick_signup_pick';
    const pagePrefix    = type === 'invite' ? 'pa_epick_invite_page' : 'pa_epick_signup_page';
    const title         = type === 'invite' ? 'Invite a character' : 'Sign up with a character';
    const btnLabel      = type === 'invite' ? 'Invite' : 'Sign Up';

    if (entities.length === 0) {
        return [{
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: `## ${title}` },
                { type: 10, content: '-# No eligible characters available.' },
            ],
        }];
    }

    const totalPages = Math.ceil(entities.length / PAGE_SIZE);
    const slice      = entities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const pageInfo   = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';

    const sections = slice.map(e => ({
        type:       9,
        components: [{ type: 10, content: `**${e.name}**  ·  Age: ${e.age}  ·  ${e.factionName}` }],
        accessory:  {
            type:      2,
            style:     1,
            label:     btnLabel,
            custom_id: `${confirmPrefix}:${setupId}:${teamIndex}:${page}:${e.id}`,
        },
    }));

    const navButtons: object[] = [];
    if (totalPages > 1) {
        navButtons.push(
            { type: 2, style: 2, custom_id: `${pagePrefix}:${setupId}:${teamIndex}:${page - 1}`, label: '← Prev', disabled: page === 0 },
            { type: 2, style: 2, custom_id: 'pa_epick_noop', label: `${page + 1} / ${totalPages}`, disabled: true },
            { type: 2, style: 2, custom_id: `${pagePrefix}:${setupId}:${teamIndex}:${page + 1}`, label: 'Next →', disabled: page >= totalPages - 1 },
        );
    }
    navButtons.push({ type: 2, style: 2, custom_id: 'pa_epick_cancel', label: 'Cancel' });

    return [
        {
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: `## ${title}` },
                { type: 10, content: `-# ${entities.length} eligible${pageInfo}` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        { type: 1, components: navButtons },
    ];
}
