import axios from 'axios';
import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { uploadWeatherStatePack, UploadResultRow } from '../../../../services/model/weatherStatePackService';

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
    const attachment = interaction.options.getAttachment('file', true);

    if (!attachment.name.toLowerCase().endsWith('.xlsx')) {
        await replyError(interaction, 'The uploaded file must be an `.xlsx` file.');
        return;
    }

    await replyLoading(interaction);

    let buffer: Buffer;
    try {
        const response = await axios.get<ArrayBuffer>(attachment.url, { responseType: 'arraybuffer', timeout: 15_000 });
        buffer = Buffer.from(response.data);
    } catch {
        await replyError(interaction, 'Failed to download the uploaded file. Please try again.');
        return;
    }

    const result = await uploadWeatherStatePack(interaction.guildId!, buffer);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { added, updated, failed, rows } = result.value!;

    const accentColor = failed > 0 && (added + updated) > 0 ? colors.warning
        : failed > 0                                         ? colors.error
        : colors.success;

    const summary = [
        '## Weather State Upload',
        `**${added}** weather state${added !== 1 ? 's' : ''} added`,
        `**${updated}** weather state${updated !== 1 ? 's' : ''} updated`,
        `**${failed}** weather state${failed !== 1 ? 's' : ''} failed validation`,
    ].join('\n');

    const csv = new AttachmentBuilder(buildCsv(rows), { name: 'weather-states-result.csv' });

    await interaction.editReply({ content: 'Upload complete. See the attached file for a full breakdown.', files: [csv] });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: accentColor, components: [{ type: 10, content: summary }] }],
    } as never);
}
