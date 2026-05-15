import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError, replyLoading } from '../../../../core/reply';
import { parseItemPack, ParsedItemPack } from '../../../../utils/parsers/itemPack';
import { uploadItemPack } from '../../../../services/model/itemPackService';
import { buildUploadMessages } from './uploadComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const attachment = interaction.options.getAttachment('file', true);

    if (!attachment.name.endsWith('.xlsx')) {
        await replyError(interaction, 'Please attach a `.xlsx` file.');
        return;
    }

    await replyLoading(interaction);

    let buffer: Buffer;
    try {
        const response = await axios.get<ArrayBuffer>(attachment.url, { responseType: 'arraybuffer', timeout: 15_000 });
        buffer = Buffer.from(response.data);
    } catch {
        await replyError(interaction, 'Failed to download the attached file. Please try again.');
        return;
    }

    let parsed: ParsedItemPack;
    try {
        parsed = await parseItemPack(buffer);
    } catch {
        await replyError(interaction, 'The file could not be read. Make sure it follows the item pack template.');
        return;
    }

    const result = await uploadItemPack(interaction.guildId!, parsed);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { saved, overwrites, errors } = result.value!;

    const [first, ...rest] = buildUploadMessages(interaction.user.id, saved, overwrites, errors);
    await interaction.editReply(first as never);
    for (const msg of rest) {
        await interaction.followUp(msg as never);
    }
}
