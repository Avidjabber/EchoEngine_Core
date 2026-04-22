import { colors } from '../../../../core/colors';
import { GuildSettingsState } from './settingsState';

export type FlagKey =
    | 'worldSimEnabled'
    | 'conditionsEnabled'
    | 'combatEnabled'
    | 'activitiesEnabled'
    | 'eventsEnabled'
    | 'craftingEnabled'
    | 'progressionEnabled'
    | 'socialEnabled';

export interface FlagFieldDef {
    key:         FlagKey;
    label:       string;
    description: string;
}

export const FLAG_FIELDS: FlagFieldDef[] = [
    {
        key:         'worldSimEnabled',
        label:       'World Simulation',
        description: 'Enables weather, seasons, environmental conditions, and filth.',
    },
    {
        key:         'conditionsEnabled',
        label:       'Conditions',
        description: 'Enables conditions, medicine, herb gathering, and symptoms.',
    },
    {
        key:         'combatEnabled',
        label:       'Combat',
        description: 'Enables sparring, boss fights, and combat steps in events.',
    },
    {
        key:         'activitiesEnabled',
        label:       'Activities',
        description: 'Enables patrols, hunts, and action types.',
    },
    {
        key:         'eventsEnabled',
        label:       'Events',
        description: 'Enables event chains. Requires Activities to be enabled for activity-triggered events.',
    },
    {
        key:         'craftingEnabled',
        label:       'Crafting',
        description: 'Enables items, storage, crafting recipes, ingredient processing, and food and prey.',
    },
    {
        key:         'progressionEnabled',
        label:       'Progression',
        description: 'Enables energy, aging, EXP, skill points, and faction reputation.',
    },
    {
        key:         'socialEnabled',
        label:       'Social',
        description: 'Enables faction standings, entity relationships, and family trees.',
    },
];

export function buildFlagsSettingsComponents(state: GuildSettingsState, guildName: string): object[] {
    const sections = FLAG_FIELDS.map(({ key, label, description }) => {
        const enabled = state[key];
        return {
            type:       9,  // Section
            components: [
                { type: 10, content: `**${label}** — ${enabled ? 'Enabled' : 'Disabled'}` },
                { type: 10, content: `-# ${description}` },
            ],
            accessory: {
                type:      2,
                label:     enabled ? 'Disable' : 'Enable',
                style:     enabled ? 2 : 1,  // Secondary (grey) when disabling, Primary (blue) when enabling
                custom_id: `gs_flag_toggle:${key}`,
            },
        };
    });

    return [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `-# Feature Flags` },
                { type: 10, content: `## ${guildName} Settings` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Main', style: 2, custom_id: 'gs_section:main' },
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Cancel',   style: 4, custom_id: 'gs_cancel' },
                { type: 2, label: 'Finalize', style: 3, custom_id: 'gs_finalize' },
            ],
        },
    ];
}
