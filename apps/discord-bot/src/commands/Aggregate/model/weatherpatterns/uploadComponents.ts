import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { PatternSavedRow, PatternOverwrittenRow, RowError } from '../../../../services/model/weatherPatternPackService';

const TEXT_LIMIT = 3800;

export interface ResultMessage {
    flags:      number;
    components: object[];
}

function splitIntoChunks(lines: string[]): string[] {
    const chunks: string[] = [];
    let current = '';

    for (const line of lines) {
        const next = current ? `${current}\n${line}` : line;
        if (next.length > TEXT_LIMIT && current) {
            chunks.push(current);
            current = line;
        } else {
            current = next;
        }
    }

    if (current) chunks.push(current);
    return chunks;
}

function makeContainer(content: string, accentColor: number): object {
    return { type: 17, accent_color: accentColor, components: [{ type: 10, content }] };
}

function chunksToMessages(chunks: string[], accentColor: number): ResultMessage[] {
    const messages: ResultMessage[] = [];
    const MAX_PER_MESSAGE = 5;
    let current: object[] = [];

    for (const chunk of chunks) {
        current.push(makeContainer(chunk, accentColor));
        if (current.length >= MAX_PER_MESSAGE) {
            messages.push({ flags: MessageFlags.IsComponentsV2, components: current });
            current = [];
        }
    }
    if (current.length > 0) {
        messages.push({ flags: MessageFlags.IsComponentsV2, components: current });
    }

    return messages;
}

export function buildUploadMessages(
    userId:     string,
    saved:      PatternSavedRow[],
    overwrites: PatternOverwrittenRow[],
    errors:     RowError[],
): ResultMessage[] {
    const messages: ResultMessage[] = [];

    const overwriteRows = new Set(overwrites.map(o => o.row));
    const newSaved      = saved.filter(r => !overwriteRows.has(r.row));

    const newCount       = newSaved.length;
    const overwriteCount = overwrites.length;
    const errorCount     = errors.length;
    const hasSaved       = newCount > 0 || overwriteCount > 0;
    const isEmpty        = !hasSaved && errorCount === 0;

    const annoLines = [
        '## Weather Pattern Pack Upload',
        `Uploaded by <@${userId}>`,
        '',
    ];

    if (isEmpty) {
        annoLines.push('-# No rows were found in the file — nothing was written.');
    } else {
        if (newCount > 0)       annoLines.push(`**${newCount}** weather pattern${newCount === 1 ? '' : 's'} added`);
        if (overwriteCount > 0) annoLines.push(`**${overwriteCount}** weather pattern${overwriteCount === 1 ? '' : 's'} updated`);
        if (errorCount > 0)     annoLines.push(`**${errorCount}** row${errorCount === 1 ? '' : 's'} failed`);
    }

    const annoColor = isEmpty                          ? colors.info
        : errorCount > 0 && hasSaved                  ? colors.special
        : errorCount > 0                               ? colors.error
        : overwriteCount > 0                           ? colors.special
        : colors.success;

    messages.push({ flags: MessageFlags.IsComponentsV2, components: [makeContainer(annoLines.join('\n'), annoColor)] });

    if (newSaved.length > 0) {
        const lines = [
            '## Added',
            ...newSaved.map(r => `-# ${r.codeName} | ${r.name}${r.isSevere ? ' | severe' : ''}${r.cooldownDays > 0 ? ` | ${r.cooldownDays}d cooldown` : ''} | ${r.stepCount} step${r.stepCount === 1 ? '' : 's'}`),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.success)) {
            messages.push(msg);
        }
    }

    if (overwriteCount > 0) {
        const lines = [
            '## Updated',
            ...overwrites.map(r => {
                const nameChanged     = r.oldName         !== r.newName;
                const severeChanged   = r.oldSevere       !== r.newSevere;
                const cooldownChanged = r.oldCooldownDays !== r.newCooldownDays;
                const detail = [
                    nameChanged     ? `name: ${r.oldName} → ${r.newName}`                               : null,
                    severeChanged   ? `severe: ${r.oldSevere} → ${r.newSevere}`                         : null,
                    cooldownChanged ? `cooldown: ${r.oldCooldownDays}d → ${r.newCooldownDays}d`         : null,
                ].filter(Boolean).join(', ') || 'steps or season weights updated';
                return `-# ${r.codeName} — ${detail}`;
            }),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.special)) {
            messages.push(msg);
        }
    }

    if (errorCount > 0) {
        const lines = [
            '## Errors',
            ...errors.map(e => `-# Row ${e.row} (${e.input}): ${e.message}`),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    return messages;
}
