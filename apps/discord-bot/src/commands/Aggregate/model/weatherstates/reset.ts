import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { resetWeatherStatePack } from '../../../../services/model/weatherStatePackService';

const TEXT_LIMIT = 3800;

function splitIntoChunks(lines: string[]): string[] {
    const chunks: string[] = [];
    let current = '';
    for (const line of lines) {
        const next = current ? `${current}\n${line}` : line;
        if (next.length > TEXT_LIMIT && current) { chunks.push(current); current = line; }
        else { current = next; }
    }
    if (current) chunks.push(current);
    return chunks;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [
            {
                type:         17,
                accent_color: colors.error,
                components:   [
                    {
                        type:    10,
                        content: [
                            '## Reset Weather States',
                            'This will permanently delete **all** weather state definitions for this guild, including their env condition links.',
                            '-# This action cannot be undone.',
                        ].join('\n'),
                    },
                    {
                        type:       1,
                        components: [
                            { type: 2, style: 4, label: 'Confirm Reset', custom_id: 'weatherstates_reset_confirm' },
                            { type: 2, style: 2, label: 'Cancel',        custom_id: 'weatherstates_reset_cancel'  },
                        ],
                    },
                ],
            },
        ],
    } as never);

    const reply = await interaction.fetchReply();

    let confirmation: import('discord.js').MessageComponentInteraction;
    try {
        confirmation = await reply.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time:   30_000,
        });
    } catch {
        await interaction.deleteReply();
        return;
    }

    if (confirmation.customId === 'weatherstates_reset_cancel') {
        await interaction.deleteReply();
        return;
    }

    await confirmation.deferUpdate();

    const guildId = interaction.guildId!;
    const result  = await resetWeatherStatePack(guildId);

    if (!result.success) {
        await replyError(interaction, 'Failed to reset weather states. Please try again.');
        return;
    }

    const { deleted, failed } = result.value!;
    const userId = interaction.user.id;

    const followUps: object[] = [];

    const annoLines = [
        '## Weather States Reset',
        `Reset by <@${userId}>`,
        '',
    ];

    if (deleted.length === 0 && failed.length === 0) {
        annoLines.push('-# No weather states were configured — nothing was cleared.');
    } else {
        if (deleted.length > 0) annoLines.push(`**${deleted.length}** weather state${deleted.length === 1 ? '' : 's'} deleted`);
        if (failed.length > 0)  annoLines.push(`**${failed.length}** weather state${failed.length === 1 ? '' : 's'} could not be removed`);
    }

    const annoColor = failed.length > 0 && deleted.length > 0 ? colors.special
        : failed.length > 0                                    ? colors.error
        : deleted.length === 0                                 ? colors.info
        : colors.success;

    followUps.push({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: annoColor, components: [{ type: 10, content: annoLines.join('\n') }] }],
    });

    if (deleted.length > 0) {
        const chunks = splitIntoChunks([
            '## Removed',
            ...deleted.map(d => `-# ${d.codeName} | ${d.name}`),
        ]);
        for (const chunk of chunks) {
            followUps.push({
                flags:      MessageFlags.IsComponentsV2,
                components: [{ type: 17, accent_color: colors.success, components: [{ type: 10, content: chunk }] }],
            });
        }
    }

    if (failed.length > 0) {
        const chunks = splitIntoChunks([
            '## Could Not Remove',
            ...failed.map(f => `-# ${f.codeName} | ${f.name} — ${f.reason}`),
        ]);
        for (const chunk of chunks) {
            followUps.push({
                flags:      MessageFlags.IsComponentsV2,
                components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: chunk }] }],
            });
        }
    }

    for (const msg of followUps) {
        await interaction.followUp(msg as never);
    }

    await interaction.deleteReply();
}
