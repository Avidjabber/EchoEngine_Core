import { colors } from '../../../../core/colors';
import { GuildSettingsState } from './settingsState';
import { SETTINGS_NUMBER_FIELDS } from './updateComponents';
import { FARMING_FIELDS } from './farmingComponents';
import { FLAG_FIELDS } from './flagsComponents';

function formatNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? 'None' : String(value);
}

export function buildInfoMainComponents(state: GuildSettingsState, guildName: string): object[] {
    const sections = SETTINGS_NUMBER_FIELDS.map(({ key, label, description }) => ({
        type:       9,  // Section (no accessory — read-only)
        components: [
            { type: 10, content: `**${label}** — ${formatNumber(state[key] as number | null)}` },
            { type: 10, content: `-# ${description}` },
        ],
    }));

    return [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `## ${guildName} Settings` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Farming',       style: 2, custom_id: 'gsi_section:farming' },
                { type: 2, label: 'Feature Flags', style: 2, custom_id: 'gsi_section:flags' },
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Done', style: 2, custom_id: 'gsi_done' },
            ],
        },
    ];
}

export function buildInfoFarmingComponents(state: GuildSettingsState, guildName: string): object[] {
    const sections = FARMING_FIELDS.map(({ key, label, description }) => ({
        type:       9,  // Section (no accessory — read-only)
        components: [
            { type: 10, content: `**${label}** — ${state[key]}` },
            { type: 10, content: `-# ${description}` },
        ],
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
                { type: 2, label: 'Main', style: 2, custom_id: 'gsi_section:main' },
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Done', style: 2, custom_id: 'gsi_done' },
            ],
        },
    ];
}

export function buildInfoFlagsComponents(state: GuildSettingsState, guildName: string): object[] {
    const sections = FLAG_FIELDS.map(({ key, label, description }) => ({
        type:       9,  // Section (no accessory — read-only)
        components: [
            { type: 10, content: `**${label}** — ${state[key] ? 'Enabled' : 'Disabled'}` },
            { type: 10, content: `-# ${description}` },
        ],
    }));

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
                { type: 2, label: 'Main', style: 2, custom_id: 'gsi_section:main' },
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Done', style: 2, custom_id: 'gsi_done' },
            ],
        },
    ];
}
