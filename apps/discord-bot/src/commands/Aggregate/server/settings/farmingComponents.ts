import { colors } from '../../../../core/colors';
import { GuildSettingsState } from './settingsState';

export type FarmingFieldKey =
    | 'farmingSoilDegradationFilth'
    | 'farmingSoilDegradationToxic'
    | 'farmingCompostIncrement';

export interface FarmingFieldDef {
    key:         FarmingFieldKey;
    label:       string;
    description: string;
}

export const FARMING_FIELDS: FarmingFieldDef[] = [
    {
        key:         'farmingSoilDegradationFilth',
        label:       'Soil Degradation (Filth)',
        description: 'Subtracted from a plot\'s soil quality each tick while the Filth condition is active on that plot\'s location.',
    },
    {
        key:         'farmingSoilDegradationToxic',
        label:       'Soil Degradation (Toxic)',
        description: 'Subtracted from a plot\'s soil quality each tick while the Toxic condition is active on that plot\'s location.',
    },
    {
        key:         'farmingCompostIncrement',
        label:       'Compost Increment',
        description: 'Added to a plot\'s soil quality per compost action, before the plot type\'s soil quality cap is applied.',
    },
];

export function buildFarmingSettingsComponents(state: GuildSettingsState, guildName: string): object[] {
    const sections = FARMING_FIELDS.map(({ key, label, description }) => ({
        type:       9,  // Section
        components: [
            { type: 10, content: `**${label}** — ${state[key]}` },
            { type: 10, content: `-# ${description}` },
        ],
        accessory: {
            type:      2,
            label:     'Update',
            style:     2,  // Secondary
            custom_id: `gs_farm_btn:${key}`,
        },
    }));

    return [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `-# Farming Settings` },
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
