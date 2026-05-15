import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError, replyLoading } from '../../../../core/reply';
import { parseWeatherStatePack, ParsedWeatherStatePack } from '../../../../utils/parsers/weatherStatePack';
import { uploadWeatherStatePack } from '../../../../services/model/weatherStatePackService';
import { buildUploadMessages } from './uploadComponents';

const SHEETS_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

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

    let parsed: ParsedWeatherStatePack;
    try {
        parsed = await parseWeatherStatePack(buffer);
    } catch {
        await replyError(interaction, 'The sheet could not be read. Make sure it follows the weather state pack template.');
        return;
    }

    const result = await uploadWeatherStatePack(interaction.guildId!, parsed.states, parsed.envConditions);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { saved, errors, overwrites } = result.value!;

    for (const msg of buildUploadMessages(interaction.user.id, saved, overwrites, errors)) {
        await interaction.followUp(msg as never);
    }

    await interaction.deleteReply();
}
