import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { SavedRow, OverwrittenRow, RowError } from '../../../../services/model/envConditionPackService';

const TEXT_LIMIT = 3800;

const SHEET_LABELS: Record<string, string> = {
    world_modifiers:       'World Modifiers',
    stat_modifiers:        'Stat Modifiers',
    proficiency_modifiers: 'Proficiency Modifiers',
};

export interface ResultMessage {
    flags:      number;
    components: object[];
}

function formatSavedRow(row: SavedRow): string {
    switch (row.sheet) {
        case 'world_modifiers':
            return row.value !== null
                ? `${row.condition} | ${row.effectType} | ${row.relation} | ${row.value}`
                : `${row.condition} | ${row.effectType} | ${row.relation}`;
        case 'stat_modifiers':
            return `${row.condition} | ${row.stat} | ${row.value}`;
        case 'proficiency_modifiers': {
            const flag = row.hasDisadvantage ? ' | disadvantage' : row.hasAdvantage ? ' | advantage' : '';
            return `${row.condition} | ${row.proficiency} | ${row.value}${flag}`;
        }
    }
}

function formatOverwrittenRow(row: OverwrittenRow): string {
    switch (row.sheet) {
        case 'world_modifiers': {
            const fmtVal = (v: number | null) => v !== null ? String(v) : 'N/A';
            const oldStr = `${row.oldRelation} | ${fmtVal(row.oldValue)}`;
            const newStr = `${row.newRelation} | ${fmtVal(row.newValue)}`;
            return `${row.condition} | ${row.effectType} — ${oldStr} → ${newStr}`;
        }
        case 'stat_modifiers':
            return `${row.condition} | ${row.stat} — ${row.oldValue} → ${row.newValue}`;
        case 'proficiency_modifiers': {
            const fmtProf = (v: number, d: boolean, a: boolean) => d ? `${v} | disadvantage` : a ? `${v} | advantage` : String(v);
            return `${row.condition} | ${row.proficiency} — ${fmtProf(row.oldValue, row.oldHasDisadvantage, row.oldHasAdvantage)} → ${fmtProf(row.newValue, row.newHasDisadvantage, row.newHasAdvantage)}`;
        }
    }
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

function groupBySheet<T extends { sheet: string }>(rows: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    for (const row of rows) {
        if (!grouped.has(row.sheet)) grouped.set(row.sheet, []);
        grouped.get(row.sheet)!.push(row);
    }
    return grouped;
}

export function buildUploadMessages(
    userId:       string,
    formatErrors: RowError[],
    saved:        SavedRow[],
    overwrites:   OverwrittenRow[],
    apiErrors:    RowError[],
): ResultMessage[] {
    const messages: ResultMessage[] = [];

    const overwriteRows = new Set(overwrites.map(o => `${o.sheet}|${o.row}`));
    const newSaved      = saved.filter(r => !overwriteRows.has(`${r.sheet}|${r.row}`));

    const newCount      = newSaved.length;
    const overwriteCount = overwrites.length;
    const formatErrCount = formatErrors.length;
    const apiErrCount    = apiErrors.length;
    const totalErrors    = formatErrCount + apiErrCount;
    const hasSaved       = newCount > 0 || overwriteCount > 0;
    const isEmpty        = !hasSaved && totalErrors === 0;

    // Announcement
    const annoLines = [
        '## Env Condition Pack Upload',
        `Uploaded by <@${userId}>`,
        '',
    ];

    if (isEmpty) {
        annoLines.push('-# No rows were found in the file — nothing was written.');
    } else {
        if (newCount > 0)       annoLines.push(`**${newCount}** row${newCount === 1 ? '' : 's'} added`);
        if (overwriteCount > 0) annoLines.push(`**${overwriteCount}** row${overwriteCount === 1 ? '' : 's'} updated`);
        if (totalErrors > 0)    annoLines.push(`**${totalErrors}** row${totalErrors === 1 ? '' : 's'} failed`);
    }

    const annoColor = isEmpty                    ? colors.info
        : totalErrors > 0 && hasSaved           ? colors.special
        : totalErrors > 0                        ? colors.error
        : overwriteCount > 0                     ? colors.special
        : colors.success;

    messages.push({ flags: MessageFlags.IsComponentsV2, components: [makeContainer(annoLines.join('\n'), annoColor)] });

    // Format/parse errors
    if (formatErrCount > 0) {
        const grouped = groupBySheet(formatErrors);
        const lines = ['## Parse Errors'];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows.map(e => `-# Row ${e.row} (${e.input}): ${e.message}`));
        }
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    // New rows
    if (newSaved.length > 0) {
        const grouped = groupBySheet(newSaved);
        const lines = ['## Added'];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows.map(r => `-# ${formatSavedRow(r)}`));
        }
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.success)) {
            messages.push(msg);
        }
    }

    // Overwrites
    if (overwriteCount > 0) {
        const grouped = groupBySheet(overwrites);
        const lines = ['## Updated'];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows.map(r => `-# ${formatOverwrittenRow(r)}`));
        }
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.special)) {
            messages.push(msg);
        }
    }

    // API errors
    if (apiErrCount > 0) {
        const grouped = groupBySheet(apiErrors);
        const lines = ['## Upload Errors'];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows.map(e => `-# Row ${e.row} (${e.input}): ${e.message}`));
        }
        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    return messages;
}
