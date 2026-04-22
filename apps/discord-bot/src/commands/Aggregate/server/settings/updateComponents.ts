import { colors } from '../../../../core/colors';
import { SettingsNumberKey } from '../../../../services/server/settingsService';
import { GuildSettingsState } from './settingsState';

export interface NumberFieldDef {
    key:         SettingsNumberKey;
    label:       string;
    description: string;
    nullable:    boolean;
}

export const SETTINGS_NUMBER_FIELDS: NumberFieldDef[] = [
    {
        key:         'defaultDailyEnergy',
        label:       'Default Daily Energy',
        description: 'The daily energy that your playable entities get for tasks they can perform.',
        nullable:    false,
    },
    {
        key:         'doubleAgeMaxThreshold',
        label:       'Double Age Max Threshold',
        description: 'Some groups like to have characters under adulthood age at double the rate so they can do more sooner. Set the max age at which double aging stops. 0 is disabled, max is 9999.',
        nullable:    false,
    },
    {
        key:         'maxCombatRounds',
        label:       'Max Combat Rounds',
        description: 'The maximum number of rounds that combat is allowed to go on for.',
        nullable:    false,
    },
    {
        key:         'defaultProficiencyBonus',
        label:       'Default Proficiency Bonus',
        description: 'If a character is proficient in a skill, this is the bonus number added to their rolls.',
        nullable:    false,
    },
    {
        key:         'disciplineLevelCap',
        label:       'Discipline Level Cap',
        description: 'A global fallback for the max level reachable in any discipline. Set to empty to disable.',
        nullable:    true,
    },
    {
        key:         'factionRepDecayRate',
        label:       'Faction Rep Decay Rate',
        description: 'Faction Rep acts as a universal roll bonus for active players, but decays each day by this amount to encourage continued activity.',
        nullable:    false,
    },
];

function formatValue(key: SettingsNumberKey, state: GuildSettingsState): string {
    const value = state[key];
    return value === null || value === undefined ? 'None' : String(value);
}

export function buildGuildSettingsComponents(state: GuildSettingsState, guildName: string): object[] {
    const numberSections = SETTINGS_NUMBER_FIELDS.map(({ key, label, description }) => ({
        type:       9,  // Section
        components: [
            { type: 10, content: `**${label}** — ${formatValue(key, state)}` },
            { type: 10, content: `-# ${description}` },
        ],
        accessory: {
            type:      2,
            label:     'Update',
            style:     2,  // Secondary
            custom_id: `gs_field_btn:${key}`,
        },
    }));

    return [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `## ${guildName} Settings` },
                { type: 14, divider: true },
                ...numberSections,
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Farming',       style: 2, custom_id: 'gs_section:farming' },
                { type: 2, label: 'Feature Flags', style: 2, custom_id: 'gs_section:flags' },
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
