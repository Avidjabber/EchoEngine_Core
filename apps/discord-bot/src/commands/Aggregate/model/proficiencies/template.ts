import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchProficiencyTemplateData, ProficiencyTemplateData } from '../../../../services/model/proficiencyPackService';
import { generateProficiencyTemplate } from '../../../../utils/generators/proficiencyTemplate';

function buildGuideComponents(data: ProficiencyTemplateData): object[] {
    const statList = data.stats.join(', ') || '(none configured)';

    const guide = [
        `## How to Fill In Your Proficiency Template`,
        ``,
        `**proficiencies** — Define the proficiencies available to entities in this guild`,
        `-# \`code_name\` — Unique snake_case slug (e.g. \`herbalism\`, \`tracking\`). This is the permanent identifier — changing it creates a new proficiency`,
        `-# \`name\` — Display name shown in the UI`,
        `-# \`stat\` — Governing stat for rolls. Valid values: ${statList}`,
        `-# \`description\` — Optional description`,
    ].join('\n');

    const notes = [
        `## Notes`,
        ``,
        `- \`code_name\` is the unique key — uploading a row with an existing \`code_name\` will overwrite its name, stat, and description`,
        `- All stat names are **case-insensitive**`,
        `- Valid rows are saved even if other rows in the same file have errors`,
        `- Use \`/model proficiencies upload\` to submit your completed file`,
    ].join('\n');

    return [
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: guide }] },
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: notes }] },
    ];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchProficiencyTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateProficiencyTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'proficiencies-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your proficiency pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: buildGuideComponents(result.value!) as never,
    } as never);
}
