import { Injectable } from '@nestjs/common';
import {
    ProficiencyRowDto,
    UploadProficiencyPackDto,
    UploadProficiencyPackResult,
    ProficiencyTemplateData,
    ResetProficiencyPackResult,
    ProficiencySavedRow,
    ProficiencyOverwrittenRow,
    RowError,
} from './dto/upload-proficiency-pack.dto';
import { ProficienciesRepository } from './proficiencies.repository';

type ExistingDef = Awaited<ReturnType<ProficienciesRepository['findGuildProficiencyDefs']>>[0];

interface Candidate {
    dto:      ProficiencyRowDto;
    statId:   number;
    statName: string;
    existing: ExistingDef | undefined;
}

function rowInput(...parts: (string | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class ProficienciesService {
    constructor(private readonly repo: ProficienciesRepository) {}

    async getTemplateData(guildId: string): Promise<ProficiencyTemplateData> {
        const [stats, defs] = await Promise.all([
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(guildId),
        ]);
        return {
            stats:         stats.map(s => s.name),
            proficiencies: defs.map(d => d.codeName),
        };
    }

    async resetPack(guildId: string): Promise<ResetProficiencyPackResult> {
        const defs = await this.repo.findGuildProficiencyDefs(guildId);

        const deleted: ResetProficiencyPackResult['deleted'] = [];
        const failed:  ResetProficiencyPackResult['failed']  = [];

        const results = await Promise.allSettled(
            defs.map(d => this.repo.deleteProficiencyDefById(d.id)),
        );

        results.forEach((result, i) => {
            const def = defs[i];
            if (result.status === 'fulfilled') {
                deleted.push({ codeName: def.codeName, name: def.name });
            } else {
                failed.push({ codeName: def.codeName, name: def.name, reason: 'Still in use — cannot be removed' });
            }
        });

        return { deleted, failed };
    }

    async uploadPack(dto: UploadProficiencyPackDto): Promise<UploadProficiencyPackResult> {
        const [stats, existingDefs] = await Promise.all([
            this.repo.findAllStats(),
            this.repo.findGuildProficiencyDefs(dto.guildId),
        ]);

        const statMap     = new Map(stats.map(s       => [s.name.toLowerCase(), s]));
        const existingMap = new Map(existingDefs.map(d => [d.codeName.toLowerCase(), d]));

        const errors:     RowError[]   = [];
        const candidates: Candidate[]  = [];
        const seen = new Map<string, number>();

        for (const row of dto.rows) {
            const input = rowInput(row.codeName, row.name, row.stat);

            if (!row.codeName || !row.name || !row.stat) {
                const missing = ([
                    !row.codeName && 'code_name',
                    !row.name     && 'name',
                    !row.stat     && 'stat',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const codeNameLower = row.codeName.toLowerCase();
            if (seen.has(codeNameLower)) {
                errors.push({ row: row.row, input, message: `Duplicate of row ${seen.get(codeNameLower)}` });
                continue;
            }
            seen.set(codeNameLower, row.row);

            const stat = statMap.get(row.stat.toLowerCase());
            if (!stat) {
                errors.push({ row: row.row, input, message: `'${row.stat}' is not a valid stat name` });
                continue;
            }

            candidates.push({ dto: row, statId: stat.id, statName: stat.name, existing: existingMap.get(codeNameLower) });
        }

        const normalizeDesc = (v: string | null | undefined) => v?.trim() || null;

        const toSave = candidates.filter(c => {
            if (!c.existing) return true;
            return (
                c.existing.name          !== c.dto.name ||
                c.existing.stat.id       !== c.statId   ||
                (c.existing.description ?? null) !== normalizeDesc(c.dto.description)
            );
        });

        const results = await Promise.allSettled(
            toSave.map(c => this.repo.upsertProficiencyDef({
                guildId:     dto.guildId,
                codeName:    c.dto.codeName!,
                name:        c.dto.name!,
                description: normalizeDesc(c.dto.description),
                statId:      c.statId,
            })),
        );

        const saved:      ProficiencySavedRow[]       = [];
        const overwrites: ProficiencyOverwrittenRow[] = [];

        results.forEach((result, i) => {
            const c = toSave[i];
            if (result.status === 'fulfilled') {
                saved.push({ row: c.dto.row, codeName: c.dto.codeName!, name: c.dto.name!, stat: c.statName });
                if (c.existing) {
                    overwrites.push({
                        row:      c.dto.row,
                        codeName: c.dto.codeName!,
                        oldName:  c.existing.name,
                        newName:  c.dto.name!,
                        oldStat:  c.existing.stat.name,
                        newStat:  c.statName,
                    });
                }
            } else {
                errors.push({ row: c.dto.row, input: rowInput(c.dto.codeName, c.dto.name, c.dto.stat), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => a.row - b.row);

        return { saved, errors, overwrites };
    }
}
