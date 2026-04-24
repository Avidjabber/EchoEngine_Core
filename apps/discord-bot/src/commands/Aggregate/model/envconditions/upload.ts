import axios from 'axios';
import { ChatInputCommandInteraction } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import {
    parseEnvConditionPack,
    ParsedEnvConditionPack,
    WorldModifierRow,
    StatModifierRow,
    ProficiencyModifierRow,
} from '../../../../utils/parsers/envConditionPack';
import { uploadEnvConditionPack, RowError } from '../../../../services/model/envConditionPackService';
import { invalidateEnvConditionInfoCache } from '../../config/envcondition/infoState';
import { buildUploadMessages } from './uploadComponents';

interface FormatCheckResult {
    errors:     RowError[];
    validWorld: WorldModifierRow[];
    validStat:  StatModifierRow[];
    validProf:  ProficiencyModifierRow[];
}

function runFormatChecks(parsed: ParsedEnvConditionPack): FormatCheckResult {
    const errors:     RowError[]             = [];
    const validWorld: WorldModifierRow[]     = [];
    const validStat:  StatModifierRow[]      = [];
    const validProf:  ProficiencyModifierRow[] = [];

    for (const row of parsed.worldModifiers) {
        const input   = [row.condition, row.effectType, row.relation, row.value].map(v => v ?? '?').join(' | ');
        const missing = ([
            !row.condition  && 'condition',
            !row.effectType && 'effect_type',
            !row.relation   && 'relation',
        ] as (string | false)[]).filter(Boolean) as string[];

        if (missing.length > 0) {
            errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `Missing required field(s): ${missing.join(', ')}` });
            continue;
        }
        if (row.relation!.toLowerCase() !== 'block' && row.value === null) {
            errors.push({ sheet: 'world_modifiers', row: row.row, input, message: `value is required when relation is not 'block'` });
            continue;
        }
        validWorld.push(row);
    }

    for (const row of parsed.statModifiers) {
        const input   = [row.condition, row.stat, row.value].map(v => v ?? '?').join(' | ');
        const missing = ([
            !row.condition && 'condition',
            !row.stat      && 'stat',
        ] as (string | false)[]).filter(Boolean) as string[];

        if (missing.length > 0) {
            errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: `Missing required field(s): ${missing.join(', ')}` });
            continue;
        }
        if (row.value === null) {
            errors.push({ sheet: 'stat_modifiers', row: row.row, input, message: 'Missing required field: value' });
            continue;
        }
        validStat.push(row);
    }

    for (const row of parsed.proficiencyModifiers) {
        const input   = [row.condition, row.proficiency, row.value, row.hasDisadvantage].map(v => v ?? '?').join(' | ');
        const missing = ([
            !row.condition   && 'condition',
            !row.proficiency && 'proficiency',
        ] as (string | false)[]).filter(Boolean) as string[];

        if (missing.length > 0) {
            errors.push({ sheet: 'proficiency_modifiers', row: row.row, input, message: `Missing required field(s): ${missing.join(', ')}` });
            continue;
        }
        validProf.push(row);
    }

    return { errors, validWorld, validStat, validProf };
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

    let parsed: ParsedEnvConditionPack;
    try {
        parsed = await parseEnvConditionPack(buffer);
    } catch {
        await replyError(interaction, 'The file could not be read. Make sure it is a valid `.xlsx` file.');
        return;
    }

    const { errors: formatErrors, validWorld, validStat, validProf } = runFormatChecks(parsed);
    const validCount = validWorld.length + validStat.length + validProf.length;

    let apiSaved:      import('../../../../services/model/envConditionPackService').SavedRow[]       = [];
    let apiErrors:     RowError[]                                                                    = [];
    let apiOverwrites: import('../../../../services/model/envConditionPackService').OverwrittenRow[] = [];

    if (validCount > 0) {
        const result = await uploadEnvConditionPack(interaction.guildId!, validWorld, validStat, validProf);

        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }

        invalidateEnvConditionInfoCache(interaction.guildId!);
        apiSaved      = result.value!.saved;
        apiErrors     = result.value!.errors;
        apiOverwrites = result.value!.overwrites;
    }

    for (const msg of buildUploadMessages(interaction.user.id, formatErrors, apiSaved, apiOverwrites, apiErrors)) {
        await interaction.followUp(msg as never);
    }

    await interaction.deleteReply();
}
