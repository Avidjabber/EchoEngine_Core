import { colors } from '../../../../core/colors';

interface ProfInfo {
    codeName:    string;
    name:        string;
    stat:        string;
    description: string | null;
}

export function buildStandaloneInfoComponents(prof: ProfInfo): object[] {
    const desc = prof.description || '*(none)*';
    const content = [
        '## Proficiency Info',
        '',
        `**Name:** ${prof.name}`,
        `**Code Name:** \`${prof.codeName}\``,
        `**Stat:** ${prof.stat}`,
        `**Description:** ${desc}`,
    ].join('\n');

    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content },
            { type: 14, divider: true },
            {
                type:       1,
                components: [{ type: 2, style: 2, custom_id: 'prof_info_done', label: 'Done' }],
            },
        ],
    }];
}
