import { colors } from '../../../../../core/colors';
import { MAX_ENTITIES_PER_TEAM, MAX_TEAMS } from './setupState';
import type { SetupTeam, CombatSetup } from './setupState';

const LABEL = { spar: 'SPAR', fight: 'FIGHT' } as const;

export function buildTeamComponents(setup: CombatSetup, team: SetupTeam): object[] {
    const label    = LABEL[setup.type];
    const teamNum  = team.teamIndex + 1;
    const isFull   = team.entities.length >= MAX_ENTITIES_PER_TEAM;
    const canAdd   = setup.mode === 'invite'
        ? !isFull
        : !isFull;

    const entitySections = team.entities.map(e => {
        const isInitiator = e.entityId === setup.initiatorEntityId;
        const section: Record<string, unknown> = {
            type:       9,
            components: [{ type: 10, content: `**${e.entityName}**` }],
        };
        if (!isInitiator) {
            section.accessory = {
                type:      2,
                style:     4,
                label:     'Remove',
                custom_id: `pa_combat_remove:${setup.setupId}:${team.teamIndex}:${e.entityId}`,
            };
        }
        return section;
    });

    const addButton = setup.mode === 'invite'
        ? { type: 2, style: 2, label: 'Add Character', custom_id: `pa_combat_add_char:${setup.setupId}:${team.teamIndex}`, disabled: !canAdd }
        : { type: 2, style: 2, label: 'Sign Up',       custom_id: `pa_combat_signup:${setup.setupId}:${team.teamIndex}`,   disabled: !canAdd };

    return [
        {
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: `## ${label} · Team ${teamNum}` },
                { type: 10, content: `-# ${team.entities.length} / ${MAX_ENTITIES_PER_TEAM} participants` },
                ...(team.entities.length > 0 ? [{ type: 14, divider: true }, ...entitySections] : []),
            ],
        },
        { type: 1, components: [addButton] },
    ];
}

export function buildControlComponents(setup: CombatSetup): object[] {
    const canAddTeam   = setup.teams.length < MAX_TEAMS;
    const canStart     = setup.teams.length >= 2 && setup.teams.every(t => t.entities.length > 0);
    const pendingCount = setup.pendingInvites.length;

    const subtitle = pendingCount > 0
        ? `-# ${pendingCount} pending invite${pendingCount !== 1 ? 's' : ''}`
        : `-# ${setup.teams.length} team${setup.teams.length !== 1 ? 's' : ''}`;

    return [
        {
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: `## ${LABEL[setup.type]} · Setup` },
                { type: 10, content: subtitle },
            ],
        },
        {
            type: 1,
            components: [
                { type: 2, style: 4, label: 'Cancel',       custom_id: `pa_combat_cancel:${setup.setupId}`                                 },
                { type: 2, style: 1, label: 'Start',        custom_id: `pa_combat_start:${setup.setupId}`,  disabled: !canStart            },
                { type: 2, style: 2, label: '+ Add Team',   custom_id: `pa_combat_add_team:${setup.setupId}`, disabled: !canAddTeam        },
            ],
        },
    ];
}
