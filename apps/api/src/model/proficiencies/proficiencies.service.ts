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
import { validateName, validateCodeName, validateDescription } from '../../utils/contentFilter';

type ExistingDef = Awaited<ReturnType<ProficienciesRepository['findGuildProficiencyDefs']>>[0];

interface Candidate {
    dto:         ProficiencyRowDto;
    codeName:    string;
    name:        string;
    description: string | null;
    statId:      number;
    statName:    string;
    existing:    ExistingDef | undefined;
}

function rowInput(...parts: (string | null | undefined)[]): string {
    return parts.map(p => p ?? '?').join(' | ');
}

@Injectable()
export class ProficienciesService {
    constructor(private readonly repo: ProficienciesRepository) {}

    async getAll(guildId: string) {
        const defs = await this.repo.findGuildProficiencyDefs(guildId);
        return defs.map(d => ({ codeName: d.codeName, name: d.name, stat: d.stat.name, description: d.description }));
    }

    async checkDelete(guildId: string, codeName: string): Promise<
        | { status: 'not_found' }
        | { status: 'has_dependencies'; name: string }
        | { status: 'ok'; name: string }
    > {
        const def = await this.repo.checkDeleteProficiencyDef(guildId, codeName);
        if (!def) return { status: 'not_found' };
        const total = Object.values(def._count).reduce((sum, c) => sum + c, 0);
        if (total > 0) return { status: 'has_dependencies', name: def.name };
        return { status: 'ok', name: def.name };
    }

    async deleteOne(guildId: string, codeName: string): Promise<{ deleted: boolean }> {
        try {
            await this.repo.deleteProficiencyDefByCodeName(guildId, codeName);
            return { deleted: true };
        } catch {
            return { deleted: false };
        }
    }

    async getOne(guildId: string, codeName: string): Promise<{ codeName: string; name: string; stat: string; description: string | null } | null> {
        const def = await this.repo.findGuildProficiencyDef(guildId, codeName);
        if (!def) return null;
        return { codeName: def.codeName, name: def.name, stat: def.stat.name, description: def.description };
    }

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

            const codeNameCheck = validateCodeName(row.codeName);
            if (!codeNameCheck.valid) {
                errors.push({ row: row.row, input, message: `code_name ${codeNameCheck.reason}` });
                continue;
            }

            const nameCheck = validateName(row.name);
            if (!nameCheck.valid) {
                errors.push({ row: row.row, input, message: `name ${nameCheck.reason}` });
                continue;
            }

            let cleanDescription: string | null = null;
            if (row.description) {
                const descCheck = validateDescription(row.description);
                if (!descCheck.valid) {
                    errors.push({ row: row.row, input, message: `description ${descCheck.reason}` });
                    continue;
                }
                cleanDescription = descCheck.value;
            }

            const cleanCodeName = codeNameCheck.value;

            if (seen.has(cleanCodeName)) {
                errors.push({ row: row.row, input, message: `Duplicate of row ${seen.get(cleanCodeName)}` });
                continue;
            }
            seen.set(cleanCodeName, row.row);

            const stat = statMap.get(row.stat.toLowerCase());
            if (!stat) {
                errors.push({ row: row.row, input, message: `'${row.stat}' is not a valid stat name` });
                continue;
            }

            candidates.push({
                dto:         row,
                codeName:    cleanCodeName,
                name:        nameCheck.value,
                description: cleanDescription,
                statId:      stat.id,
                statName:    stat.name,
                existing:    existingMap.get(cleanCodeName),
            });
        }

        const toSave = candidates.filter(c => {
            if (!c.existing) return true;
            return (
                c.existing.name              !== c.name        ||
                c.existing.stat.id           !== c.statId      ||
                (c.existing.description ?? null) !== c.description
            );
        });

        const results = await Promise.allSettled(
            toSave.map(c => this.repo.upsertProficiencyDef({
                guildId:     dto.guildId,
                codeName:    c.codeName,
                name:        c.name,
                description: c.description,
                statId:      c.statId,
            })),
        );

        const saved:      ProficiencySavedRow[]       = [];
        const overwrites: ProficiencyOverwrittenRow[] = [];

        results.forEach((result, i) => {
            const c = toSave[i];
            if (result.status === 'fulfilled') {
                saved.push({ row: c.dto.row, codeName: c.codeName, name: c.name, stat: c.statName });
                if (c.existing) {
                    overwrites.push({
                        row:      c.dto.row,
                        codeName: c.codeName,
                        oldName:  c.existing.name,
                        newName:  c.name,
                        oldStat:  c.existing.stat.name,
                        newStat:  c.statName,
                    });
                }
            } else {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName, c.name, c.dto.stat), message: 'Failed to save to database' });
            }
        });

        errors.sort((a, b) => a.row - b.row);

        return { saved, errors, overwrites };
    }
}
