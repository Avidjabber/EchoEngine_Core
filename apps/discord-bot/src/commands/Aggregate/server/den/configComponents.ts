import { colors } from '../../../../core/colors';
import { DenConfigState, DenConfigKey } from './configState';

const DEN_FIELDS: Array<{ key: DenConfigKey; label: string }> = [
    { key: 'allowWorldSim',    label: 'World Simulation' },
    { key: 'allowConditions',  label: 'Conditions' },
    { key: 'allowCombat',      label: 'Combat' },
    { key: 'allowActivities',  label: 'Activities' },
    { key: 'allowEvents',      label: 'Events' },
    { key: 'allowCrafting',    label: 'Crafting' },
    { key: 'allowProgression', label: 'Progression' },
    { key: 'allowSocial',      label: 'Social' },
];

/**
 * Builds the raw Discord API JSON component payload for the den config panel.
 * Uses raw JSON instead of discord.js builders because discord.js does not yet
 * support the Section accessory pattern (button to the right of text).
 */
export function buildDenConfigComponents(state: DenConfigState, channelName: string): object[] {
    const sections = DEN_FIELDS.map(({ key, label }) => {
        const enabled = state[key];
        return {
            type: 9,  // Section
            components: [
                { type: 10, content: `${label}: **${enabled ? 'True' : 'False'}**` },
            ],
            accessory: {
                type:      2,
                label:     enabled ? 'Disable' : 'Enable',
                style:     enabled ? 2 : 1,  // Secondary (grey) = disable, Primary (blue) = enable
                custom_id: `den_toggle:${key}:${state.channelId}`,
            },
        };
    });

    return [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `-# Channel ID: ${state.channelId}` },
                { type: 10, content: `## #${channelName}` },
                { type: 14, divider: true },
                {
                    type:    10,
                    content: 'Below are the following categories of messages and commands that can be displayed in this channel.',
                },
                ...sections,
            ],
        },
        {
            type:       1,  // ActionRow
            components: [
                { type: 2, label: 'Reset Defaults', style: 2, custom_id: `den_reset_defaults:${state.channelId}` },
                { type: 2, label: 'Done',            style: 3, custom_id: `den_done:${state.channelId}` },
                { type: 2, label: 'Delete Den',      style: 4, custom_id: `den_delete:${state.channelId}` },
            ],
        },
    ];
}
