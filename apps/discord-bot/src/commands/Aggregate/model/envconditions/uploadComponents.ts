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
    return {
        type:         17,
        accent_color: accentColor,
        components:   [{ type: 10, content }],
    };
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

export function buildResultMessages(userId: string, saved: SavedRow[], errors: RowError[], overwrites: OverwrittenRow[]): ResultMessage[] {
    const messages: ResultMessage[] = [];

    const savedCount     = saved.length;
    const errorCount     = errors.length;
    const overwriteCount = overwrites.length;
    const hasErrors      = errorCount > 0;
    const hasSaved       = savedCount > 0;
    const hasOverwrites  = overwriteCount > 0;

    // Announcement message
    const annoLines: string[] = [
        `## Env Condition Pack Upload`,
        `Uploaded by <@${userId}>`,
        ``,
    ];

    if (savedCount === 0 && errorCount === 0) {
        annoLines.push(`-# No rows were found in the file — nothing was written.`);
    } else {
        if (hasSaved)       annoLines.push(`**${savedCount}** row${savedCount === 1 ? '' : 's'} saved`);
        if (hasOverwrites)  annoLines.push(`**${overwriteCount}** row${overwriteCount === 1 ? '' : 's'} overwrote existing values`);
        if (hasErrors)      annoLines.push(`**${errorCount}** row${errorCount === 1 ? '' : 's'} failed`);
    }

    const annoColor = hasErrors && hasSaved ? colors.special
        : hasErrors                         ? colors.error
        : hasOverwrites                     ? colors.special
        : hasSaved                          ? colors.success
        : colors.info;

    messages.push({
        flags:      MessageFlags.IsComponentsV2,
        components: [makeContainer(annoLines.join('\n'), annoColor)],
    });

    // New rows
    const newSaved = saved.filter(r => !overwrites.some(o => o.sheet === r.sheet && o.row === r.row));
    if (newSaved.length > 0) {
        const grouped = new Map<string, string[]>();
        for (const row of newSaved) {
            if (!grouped.has(row.sheet)) grouped.set(row.sheet, []);
            grouped.get(row.sheet)!.push(`-# ${formatSavedRow(row)}`);
        }

        const lines: string[] = [`## Saved Rows`];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows);
        }

        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.success)) {
            messages.push(msg);
        }
    }

    // Overwrites
    if (hasOverwrites) {
        const grouped = new Map<string, string[]>();
        for (const row of overwrites) {
            if (!grouped.has(row.sheet)) grouped.set(row.sheet, []);
            grouped.get(row.sheet)!.push(`-# ${formatOverwrittenRow(row)}`);
        }

        const lines: string[] = [`## Overwrote Existing Values`];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows);
        }

        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.special)) {
            messages.push(msg);
        }
    }

    // Failures
    if (hasErrors) {
        const grouped = new Map<string, string[]>();
        for (const err of errors) {
            if (!grouped.has(err.sheet)) grouped.set(err.sheet, []);
            grouped.get(err.sheet)!.push(`-# Row ${err.row} (${err.input}): ${err.message}`);
        }

        const lines: string[] = [`## Failed Rows`];
        for (const [sheet, rows] of grouped) {
            lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
            lines.push(...rows);
        }

        for (const msg of chunksToMessages(splitIntoChunks(lines), colors.error)) {
            messages.push(msg);
        }
    }

    return messages;
}

export function buildFormatErrorMessages(userId: string, errors: RowError[], validRowCount: number): ResultMessage[] {
    if (errors.length === 0) return [];

    const grouped = new Map<string, string[]>();
    for (const err of errors) {
        if (!grouped.has(err.sheet)) grouped.set(err.sheet, []);
        grouped.get(err.sheet)!.push(`-# Row ${err.row} (${err.input}): ${err.message}`);
    }

    const lines: string[] = [
        `## Env Condition Pack Upload`,
        `Uploaded by <@${userId}>`,
        ``,
        `## Parse Errors`,
    ];
    for (const [sheet, rows] of grouped) {
        lines.push(`**${SHEET_LABELS[sheet] ?? sheet}** (${rows.length})`);
        lines.push(...rows);
    }

    if (validRowCount > 0) {
        lines.push('');
        lines.push(`-# ${validRowCount} row${validRowCount === 1 ? '' : 's'} passed format checks and ${validRowCount === 1 ? 'was' : 'were'} sent to the API for processing.`);
    }

    return chunksToMessages(splitIntoChunks(lines), colors.error);
}
