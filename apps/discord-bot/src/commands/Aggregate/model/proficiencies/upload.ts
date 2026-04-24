import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { parseProficiencyPack, ParsedProficiencyPack } from '../../../../utils/parsers/proficiencyPack';
import { uploadProficiencyPack } from '../../../../services/model/proficiencyPackService';
import { invalidateProficiencyListCache } from '../../config/proficiency/listCache';
import { buildUploadMessages } from './uploadComponents';

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

    let parsed: ParsedProficiencyPack;
    try {
        parsed = await parseProficiencyPack(buffer);
    } catch {
        await replyError(interaction, 'The file could not be read. Make sure it is a valid `.xlsx` file.');
        return;
    }

    const result = await uploadProficiencyPack(interaction.guildId!, parsed.proficiencies);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    invalidateProficiencyListCache(interaction.guildId!);

    const { saved, errors, overwrites } = result.value!;

    for (const msg of buildUploadMessages(interaction.user.id, [], saved, overwrites, errors)) {
        await interaction.followUp(msg as never);
    }

    await interaction.deleteReply();
}
