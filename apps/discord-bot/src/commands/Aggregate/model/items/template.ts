import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchItemTemplateData } from '../../../../services/model/itemPackService';
import { generateItemTemplate } from '../../../../utils/generators/itemTemplate';

function buildGuideComponents(): object[] {
    const guide = [
        `## How to Fill In Your Item Pack Template`,
        ``,
        `**items** — One row per item definition`,
        `-# \`code_name\` — Unique snake_case slug. Permanent identifier — changing it creates a new item`,
        `-# \`name\` — Display name`,
        `-# \`types\` — Comma-separated item type tags (e.g. \`Food, Meat\`). See reference tab`,
        `-# \`measurement_type\` — How quantity is counted. See reference tab`,
        `-# \`average_weight\` — Grams per unit (0 = weightless)`,
        `-# \`rot_cap\` — Days until fully decayed; leave blank if it does not decay`,
        ``,
        `**equipment** — One row per equip mode; multiple rows per item allowed`,
        `-# \`item_code_name\` — Must match a \`code_name\` from the items tab`,
        `-# \`slot_type\` — Which body slot this profile occupies. See reference tab`,
        `-# Combat fields (\`damage_dice_count\`, \`action_category\`, etc.) only needed for weapons`,
        ``,
        `**food** — One row per item; only items that provide nutrition`,
        `-# \`item_code_name\` — Must match a \`code_name\` from the items tab`,
        ``,
        `**actions** — Item use interactions (apply, consume, etc.)`,
        `-# \`interaction\` — The type of use action. See reference tab`,
        ``,
        `**effects** — Symptom effects tied to an item action`,
        `-# \`item_code_name\` + \`interaction\` — Must match a row in the actions tab`,
    ].join('\n');

    const notes = [
        `## Notes`,
        ``,
        `- \`code_name\` is the unique key — uploading a row with an existing \`code_name\` overwrites it`,
        `- All lookup fields are **case-insensitive**`,
        `- Valid rows are saved even if other rows in the same file have errors`,
        `- Sub-tab rows (equipment, food, actions, effects) are replaced entirely on each upload`,
        `- Leave optional fields blank — do not delete their columns`,
        `- Use \`/model items upload\` to submit your completed file`,
    ].join('\n');

    return [
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: guide }] },
        { type: 17, accent_color: colors.info, components: [{ type: 10, content: notes }] },
    ];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchItemTemplateData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    let buffer: Buffer;
    try {
        buffer = await generateItemTemplate(result.value!);
    } catch {
        await replyError(interaction, 'Failed to generate the template file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'items-template.xlsx' });

    await interaction.editReply({
        content: 'Here is your item pack template.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: buildGuideComponents() as never,
    } as never);
}
