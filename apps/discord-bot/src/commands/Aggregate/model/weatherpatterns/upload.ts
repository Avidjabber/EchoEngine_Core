import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError, replyLoading } from '../../../../core/reply';
import { parseWeatherPatternPack, ParsedWeatherPatternPack } from '../../../../utils/parsers/weatherPatternPack';
import { uploadWeatherPatternPack } from '../../../../services/model/weatherPatternPackService';
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

    let parsed: ParsedWeatherPatternPack;
    try {
        parsed = await parseWeatherPatternPack(buffer);
    } catch {
        await replyError(interaction, 'The file could not be read. Make sure it is a valid `.xlsx` file.');
        return;
    }

    const result = await uploadWeatherPatternPack(
        interaction.guildId!,
        parsed.patterns,
        parsed.steps,
        parsed.seasonWeights,
    );

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { saved, errors, overwrites } = result.value!;

    const [first, ...rest] = buildUploadMessages(interaction.user.id, saved, overwrites, errors);
    await interaction.editReply(first as never);
    for (const msg of rest) {
        await interaction.followUp(msg as never);
    }
}
