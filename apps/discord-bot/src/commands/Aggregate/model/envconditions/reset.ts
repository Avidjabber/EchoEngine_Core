import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import {
    fetchEnvConditionInfoData,
    resetEnvConditionPack,
    resetEnvConditionForCondition,
    EnvConditionInfoData,
} from '../../../../services/model/envConditionPackService';
import { invalidateEnvConditionInfoCache } from '../../config/envcondition/infoState';

const TEXT_LIMIT = 3800;

function buildListComponents(data: EnvConditionInfoData): object[] {
    const worldCount  = new Map<string, number>();
    const statCount   = new Map<string, number>();
    const profCount   = new Map<string, number>();

    for (const m of data.worldModifiers)       worldCount.set(m.condition, (worldCount.get(m.condition)  ?? 0) + 1);
    for (const m of data.statModifiers)         statCount.set(m.condition, (statCount.get(m.condition)   ?? 0) + 1);
    for (const m of data.proficiencyModifiers)  profCount.set(m.condition, (profCount.get(m.condition)   ?? 0) + 1);

    const configured = data.conditions.filter(c =>
        worldCount.has(c.codeName) || statCount.has(c.codeName) || profCount.has(c.codeName),
    );

    if (configured.length === 0) {
        return [{
            type:         17,
            accent_color: colors.info,
            components:   [{ type: 10, content: '## Env Condition Modifiers\n\n-# No modifiers are configured for this guild.' }],
        }];
    }

    const lines = ['## Env Condition Modifiers', ''];
    for (const c of configured) {
        const parts: string[] = [];
        const w = worldCount.get(c.codeName);
        const s = statCount.get(c.codeName);
        const p = profCount.get(c.codeName);
        if (w) parts.push(`${w} world`);
        if (s) parts.push(`${s} stat`);
        if (p) parts.push(`${p} proficiency`);
        lines.push(`-# **${c.codeName}** — ${parts.join(' · ')}`);
    }

    lines.push('');
    lines.push(`-# Use \`/model envconditions reset [codeName]\` to reset a specific condition`);
    lines.push(`-# Use \`/model envconditions reset all\` to clear everything`);

    const chunks: string[] = [];
    let current = '';
    for (const line of lines) {
        const next = current ? `${current}\n${line}` : line;
        if (next.length > TEXT_LIMIT && current) { chunks.push(current); current = line; }
        else { current = next; }
    }
    if (current) chunks.push(current);

    return chunks.map(c => ({ type: 17, accent_color: colors.info, components: [{ type: 10, content: c }] }));
}

function buildResetPublicMessage(userId: string, label: string, worldModifiers: number, statModifiers: number, proficiencyModifiers: number): object {
    const total = worldModifiers + statModifiers + proficiencyModifiers;

    const content = total === 0
        ? [
            `## ${label} Reset`,
            `Reset by <@${userId}>`,
            '',
            '-# No modifiers were configured — nothing was cleared.',
          ].join('\n')
        : [
            `## ${label} Reset`,
            `Reset by <@${userId}>`,
            '',
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
          ].join('\n');

    return {
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: total === 0 ? colors.info : colors.success,
            components:   [{ type: 10, content }],
        }],
    };
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const condition = interaction.options.getString('condition');
    const guildId   = interaction.guildId!;
    const userId    = interaction.user.id;

    // No option — show list
    if (!condition) {
        const result = await fetchEnvConditionInfoData(guildId);

        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }

        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildListComponents(result.value!) as never,
        });
        return;
    }

    const isAll         = condition.toLowerCase() === 'all';
    const confirmId     = 'envconditions_reset_confirm';
    const cancelId      = 'envconditions_reset_cancel';
    const confirmText   = isAll
        ? 'This will permanently delete **all** world, stat, and proficiency modifiers for this guild.'
        : `This will permanently delete all modifiers for the \`${condition}\` env condition.`;

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.error,
            components:   [
                { type: 10, content: `## Reset Env Condition Modifiers\n${confirmText}\n-# This action cannot be undone.` },
                { type: 1,  components: [
                    { type: 2, style: 4, label: 'Confirm Reset', custom_id: confirmId },
                    { type: 2, style: 2, label: 'Cancel',        custom_id: cancelId  },
                ]},
            ],
        }],
    } as never);

    const reply = await interaction.fetchReply();

    let confirmation: import('discord.js').MessageComponentInteraction;
    try {
        confirmation = await reply.awaitMessageComponent({
            filter: i => i.user.id === userId,
            time:   30_000,
        });
    } catch {
        await interaction.deleteReply();
        return;
    }

    if (confirmation.customId === cancelId) {
        await interaction.deleteReply();
        return;
    }

    await confirmation.deferUpdate();

    if (isAll) {
        const result = await resetEnvConditionPack(guildId);

        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }

        invalidateEnvConditionInfoCache(guildId);

        const { worldModifiers, statModifiers, proficiencyModifiers } = result.value!;
        await interaction.followUp(buildResetPublicMessage(userId, 'Env Condition Modifiers', worldModifiers, statModifiers, proficiencyModifiers) as never);
    } else {
        const result = await resetEnvConditionForCondition(guildId, condition);

        if (!result.success) {
            await replyError(interaction, `Could not reset — check that \`${condition}\` is a valid env condition codeName.`);
            return;
        }

        invalidateEnvConditionInfoCache(guildId);

        const { worldModifiers, statModifiers, proficiencyModifiers } = result.value!;
        await interaction.followUp(buildResetPublicMessage(userId, `${condition} Modifiers`, worldModifiers, statModifiers, proficiencyModifiers) as never);
    }

    await interaction.deleteReply();
}
