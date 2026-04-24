import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { parseProficiencyPack, ParsedProficiencyPack, ProficiencyRow } from '../../../../utils/parsers/proficiencyPack';
import { uploadProficiencyPack, RowError } from '../../../../services/model/proficiencyPackService';
import { buildUploadMessages } from './uploadComponents';

interface FormatCheckResult {
    errors: RowError[];
    valid:  ProficiencyRow[];
}

function runFormatChecks(parsed: ParsedProficiencyPack): FormatCheckResult {
    const errors: RowError[] = [];
    const valid:  ProficiencyRow[] = [];

    for (const row of parsed.proficiencies) {
        const input   = [row.codeName, row.name, row.stat].map(v => v ?? '?').join(' | ');
        const missing = ([
            !row.codeName && 'code_name',
            !row.name     && 'name',
            !row.stat     && 'stat',
        ] as (string | false)[]).filter(Boolean) as string[];

        if (missing.length > 0) {
            errors.push({ row: row.row, input, message: `Missing required field(s): ${missing.join(', ')}` });
            continue;
        }
        valid.push(row);
    }

    return { errors, valid };
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

    let parsed: ParsedProficiencyPack;
    try {
        parsed = await parseProficiencyPack(buffer);
    } catch {
        await replyError(interaction, 'The file could not be read. Make sure it is a valid `.xlsx` file.');
        return;
    }

    const { errors: formatErrors, valid } = runFormatChecks(parsed);

    let apiSaved:      import('../../../../services/model/proficiencyPackService').ProficiencySavedRow[]       = [];
    let apiErrors:     RowError[]                                                                               = [];
    let apiOverwrites: import('../../../../services/model/proficiencyPackService').ProficiencyOverwrittenRow[] = [];

    if (valid.length > 0) {
        const result = await uploadProficiencyPack(interaction.guildId!, valid);

        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }

        apiSaved      = result.value!.saved;
        apiErrors     = result.value!.errors;
        apiOverwrites = result.value!.overwrites;
    }

    for (const msg of buildUploadMessages(interaction.user.id, formatErrors, apiSaved, apiOverwrites, apiErrors)) {
        await interaction.followUp(msg as never);
    }

    await interaction.deleteReply();
}
