import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { SavedRow, RowError } from '../../../../services/model/envConditionPackService';

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
        case 'proficiency_modifiers':
            return row.hasDisadvantage
                ? `${row.condition} | ${row.proficiency} | ${row.value} | disadvantage`
                : `${row.condition} | ${row.proficiency} | ${row.value}`;
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

export function buildResultMessages(userId: string, saved: SavedRow[], errors: RowError[]): ResultMessage[] {
    const messages: ResultMessage[] = [];

    const savedCount  = saved.length;
    const errorCount  = errors.length;
    const hasErrors   = errorCount > 0;
    const hasSaved    = savedCount > 0;

    // Announcement message
    const annoLines: string[] = [
        `## Env Condition Pack Upload`,
        `Uploaded by <@${userId}>`,
        ``,
    ];

    if (savedCount === 0 && errorCount === 0) {
        annoLines.push(`-# No rows were found in the file — nothing was written.`);
    } else {
        if (hasSaved)  annoLines.push(`**${savedCount}** row${savedCount === 1 ? '' : 's'} saved`);
        if (hasErrors) annoLines.push(`**${errorCount}** row${errorCount === 1 ? '' : 's'} failed`);
    }

    const annoColor = hasSaved && hasErrors ? colors.special
        : hasErrors                         ? colors.error
        : hasSaved                          ? colors.success
        : colors.info;

    messages.push({
        flags:      MessageFlags.IsComponentsV2,
        components: [makeContainer(annoLines.join('\n'), annoColor)],
    });

    // Success list
    if (hasSaved) {
        const grouped = new Map<string, string[]>();
        for (const row of saved) {
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

    // Failure list
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
