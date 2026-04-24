import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { ProficiencySavedRow, ProficiencyOverwrittenRow, RowError } from '../../../../services/model/proficiencyPackService';

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
    userId:       string,
    formatErrors: RowError[],
    saved:        ProficiencySavedRow[],
    overwrites:   ProficiencyOverwrittenRow[],
    apiErrors:    RowError[],
): ResultMessage[] {
    const messages: ResultMessage[] = [];

    const overwriteRows = new Set(overwrites.map(o => o.row));
    const newSaved      = saved.filter(r => !overwriteRows.has(r.row));

    const newCount       = newSaved.length;
    const overwriteCount = overwrites.length;
    const formatErrCount = formatErrors.length;
    const apiErrCount    = apiErrors.length;
    const totalErrors    = formatErrCount + apiErrCount;
    const hasSaved       = newCount > 0 || overwriteCount > 0;
    const isEmpty        = !hasSaved && totalErrors === 0;

    // Announcement
    const annoLines = [
        '## Proficiency Pack Upload',
        `Uploaded by <@${userId}>`,
        '',
    ];

    if (isEmpty) {
        annoLines.push('-# No rows were found in the file — nothing was written.');
    } else {
        if (newCount > 0)       annoLines.push(`**${newCount}** proficiencie${newCount === 1 ? 'y' : 'ies'} added`);
        if (overwriteCount > 0) annoLines.push(`**${overwriteCount}** proficiencie${overwriteCount === 1 ? 'y' : 'ies'} updated`);
        if (totalErrors > 0)    annoLines.push(`**${totalErrors}** row${totalErrors === 1 ? '' : 's'} failed`);
    }

    const annoColor = isEmpty                  ? colors.info
        : totalErrors > 0 && hasSaved         ? colors.special
        : totalErrors > 0                      ? colors.error
        : overwriteCount > 0                   ? colors.special
        : colors.success;

    messages.push({ flags: MessageFlags.IsComponentsV2, components: [makeContainer(annoLines.join('\n'), annoColor)] });

    // Format/parse errors
    if (formatErrCount > 0) {
        const lines = [
            '## Parse Errors',
            ...formatErrors.map(e => `-# Row ${e.row} (${e.input}): ${e.message}`),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    // New rows
    if (newSaved.length > 0) {
        const lines = [
            '## Added',
            ...newSaved.map(r => `-# ${r.codeName} | ${r.name} | ${r.stat}`),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.success)) {
            messages.push(msg);
        }
    }

    // Overwrites
    if (overwriteCount > 0) {
        const lines = [
            '## Updated',
            ...overwrites.map(r => {
                const nameChanged = r.oldName !== r.newName;
                const statChanged = r.oldStat !== r.newStat;
                const detail = [
                    nameChanged ? `name: ${r.oldName} → ${r.newName}` : null,
                    statChanged ? `stat: ${r.oldStat} → ${r.newStat}` : null,
                ].filter(Boolean).join(', ') || 'description updated';
                return `-# ${r.codeName} — ${detail}`;
            }),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.special)) {
            messages.push(msg);
        }
    }

    // API errors
    if (apiErrCount > 0) {
        const lines = [
            '## Upload Errors',
            ...apiErrors.map(e => `-# Row ${e.row} (${e.input}): ${e.message}`),
        ];
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    return messages;
}
