import { Injectable } from '@nestjs/common';

const GUILD_TTL = 2 * 60 * 60 * 1000; // 2 hours — write-through cache, TTL is safety net only

interface GuildEntry<T> {
    data:      T;
    expiresAt: number;
}

// ── Shared types ──────────────────────────────────────────────────────────────

export type CachedStat         = { id: number; name: string };
export type CachedEnvCondition = { id: number; codeName: string };
export type CachedEnvConditionName = { codeName: string; name: string };
export type CachedEffectType   = { id: number; name: string };
export type CachedRelationType = { id: number; name: string };

export type CachedProfDefSlim = { id: number; codeName: string };
export type CachedProfDefFull = {
    id:          number;
    codeName:    string;
    name:        string;
    description: string | null;
    stat:        { id: number; name: string };
};

export type CachedGuildModifiers = {
    worldModifiers: {
        envCondition: { codeName: string };
        effectType:   { name: string };
        relationType: { name: string };
        value:        number | null;
    }[];
    statModifiers: {
        envCondition: { codeName: string };
        stat:         { name: string };
        value:        number;
    }[];
    proficiencyModifiers: {
        envCondition:    { codeName: string };
        proficiency:     { codeName: string };
        value:           number;
        hasDisadvantage: boolean;
        hasAdvantage:    boolean;
    }[];
};

// ── Cache service ─────────────────────────────────────────────────────────────

@Injectable()
export class ApiCacheService {
    // Global lookups — populated on first request, never expire
    private stats:             CachedStat[]             | null = null;
    private envConditions:     CachedEnvCondition[]     | null = null;
    private envConditionNames: CachedEnvConditionName[] | null = null;
    private effectTypes:       CachedEffectType[]       | null = null;
    private relationTypes:     CachedRelationType[]     | null = null;

    // Per-guild — write-through, 2-hour TTL as safety net
    private profDefsSlim = new Map<string, GuildEntry<CachedProfDefSlim[]>>();
    private profDefsFull = new Map<string, GuildEntry<CachedProfDefFull[]>>();
    private modifiers    = new Map<string, GuildEntry<CachedGuildModifiers>>();

    // ── Global getters / setters ──────────────────────────────────────────────

    getStats()                        { return this.stats; }
    setStats(v: CachedStat[])         { this.stats = v; }

    getEnvConditions()                          { return this.envConditions; }
    setEnvConditions(v: CachedEnvCondition[])   { this.envConditions = v; }

    getEnvConditionNames()                              { return this.envConditionNames; }
    setEnvConditionNames(v: CachedEnvConditionName[])   { this.envConditionNames = v; }

    getEffectTypes()                        { return this.effectTypes; }
    setEffectTypes(v: CachedEffectType[])   { this.effectTypes = v; }

    getRelationTypes()                          { return this.relationTypes; }
    setRelationTypes(v: CachedRelationType[])   { this.relationTypes = v; }

    // ── Per-guild proficiency defs ────────────────────────────────────────────

    getProfDefsSlim(guildId: string): CachedProfDefSlim[] | null {
        return this.getGuildEntry(this.profDefsSlim, guildId);
    }

    setProfDefsSlim(guildId: string, data: CachedProfDefSlim[]): void {
        this.profDefsSlim.set(guildId, { data, expiresAt: Date.now() + GUILD_TTL });
    }

    getProfDefsFull(guildId: string): CachedProfDefFull[] | null {
        return this.getGuildEntry(this.profDefsFull, guildId);
    }

    setProfDefsFull(guildId: string, data: CachedProfDefFull[]): void {
        this.profDefsFull.set(guildId, { data, expiresAt: Date.now() + GUILD_TTL });
    }

    invalidateProfDefs(guildId: string): void {
        this.profDefsSlim.delete(guildId);
        this.profDefsFull.delete(guildId);
    }

    // ── Per-guild modifiers ───────────────────────────────────────────────────

    getGuildModifiers(guildId: string): CachedGuildModifiers | null {
        return this.getGuildEntry(this.modifiers, guildId);
    }

    setGuildModifiers(guildId: string, data: CachedGuildModifiers): void {
        this.modifiers.set(guildId, { data, expiresAt: Date.now() + GUILD_TTL });
    }

    invalidateGuildModifiers(guildId: string): void {
        this.modifiers.delete(guildId);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private getGuildEntry<T>(map: Map<string, GuildEntry<T>>, guildId: string): T | null {
        const entry = map.get(guildId);
        if (!entry || Date.now() > entry.expiresAt) {
            map.delete(guildId);
            return null;
        }
        return entry.data;
    }
}
