import axios from 'axios';
import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { uploadConditionPack, UploadResultRow } from '../../../../services/model/conditionPackService';

const SHEETS_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

function buildCsv(rows: UploadResultRow[]): Buffer {
    const lines = ['row,sheet,identifier,status,reason'];
    for (const r of rows) {
        const identifier = `"${r.input.replace(/"/g, '""')}"`;
        const reason     = r.reason ? `"${r.reason.replace(/"/g, '""')}"` : '';
        lines.push(`${r.row},${r.sheet},${identifier},${r.status},${reason}`);
    }
    return Buffer.from(lines.join('\n'), 'utf-8');
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const link = interaction.options.getString('link', true);

    const match = SHEETS_ID_REGEX.exec(link);
    if (!match) {
        await replyError(interaction, 'That does not look like a valid Google Sheets link. Please share a link in the format `https://docs.google.com/spreadsheets/d/...`');
        return;
    }

    const sheetId   = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    await replyLoading(interaction);

    let buffer: Buffer;
    try {
        const response = await axios.get<ArrayBuffer>(exportUrl, { responseType: 'arraybuffer', timeout: 15_000 });
        buffer = Buffer.from(response.data);
    } catch {
        await replyError(interaction, 'Failed to fetch the Google Sheet. Make sure the sheet is set to **Anyone with the link can view** and try again.');
        return;
    }

    const result = await uploadConditionPack(interaction.guildId!, buffer);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { added, updated, failed, rows } = result.value!;

    const accentColor = failed > 0 && (added + updated) > 0 ? colors.warning
        : failed > 0                                         ? colors.error
        : colors.success;

    const summary = [
        '## Condition Upload',
        `**${added}** condition${added !== 1 ? 's' : ''} added`,
        `**${updated}** condition${updated !== 1 ? 's' : ''} updated`,
        `**${failed}** row${failed !== 1 ? 's' : ''} failed validation`,
    ].join('\n');

    const csv = new AttachmentBuilder(buildCsv(rows), { name: 'conditions-result.csv' });

    await interaction.editReply({ content: 'Upload complete. See the attached file for a full breakdown.', files: [csv] });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: accentColor, components: [{ type: 10, content: summary }] }],
    } as never);
}
