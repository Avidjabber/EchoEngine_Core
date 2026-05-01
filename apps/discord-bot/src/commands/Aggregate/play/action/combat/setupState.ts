import { randomUUID } from 'crypto';

export const MAX_TEAMS           = 3;
export const MAX_ENTITIES_PER_TEAM = 5;

export interface SetupEntity {
    entityId:   number;
    entityName: string;
    userId:     string;
}

export interface SetupTeam {
    teamIndex: number;
    messageId: string;
    entities:  SetupEntity[];
}

export interface PendingInvite {
    messageId:    string;
    entityId:     number;
    entityName:   string;
    targetUserId: string;
    teamIndex:    number;
}

export interface CombatSetup {
    setupId:            string;
    guildId:            string;
    channelId:          string;
    type:               'spar' | 'fight';
    mode:               'invite' | 'open';
    initiatorUserId:    string;
    initiatorEntityId:  number;
    initiatorFactionId: number;
    teams:              SetupTeam[];
    pendingInvites:     PendingInvite[];
    controlMessageId:   string;
}

const setups = new Map<string, CombatSetup>();

export function createSetup(data: Omit<CombatSetup, 'setupId' | 'teams' | 'pendingInvites' | 'controlMessageId'>): CombatSetup {
    const setup: CombatSetup = {
        ...data,
        setupId:          randomUUID(),
        teams:            [],
        pendingInvites:   [],
        controlMessageId: '',
    };
    setups.set(setup.setupId, setup);
    return setup;
}

export function getSetup(setupId: string): CombatSetup | undefined {
    return setups.get(setupId);
}

export function deleteSetup(setupId: string): void {
    setups.delete(setupId);
}

export function addTeam(setupId: string, messageId: string): SetupTeam | null {
    const setup = setups.get(setupId);
    if (!setup || setup.teams.length >= MAX_TEAMS) return null;
    const team: SetupTeam = { teamIndex: setup.teams.length, messageId, entities: [] };
    setup.teams.push(team);
    return team;
}

export function addEntityToTeam(setupId: string, teamIndex: number, entity: SetupEntity): boolean {
    const setup = setups.get(setupId);
    if (!setup) return false;
    const team = setup.teams[teamIndex];
    if (!team || team.entities.length >= MAX_ENTITIES_PER_TEAM) return false;
    if (setup.teams.some(t => t.entities.some(e => e.entityId === entity.entityId))) return false;
    team.entities.push(entity);
    return true;
}

export function removeEntityFromTeam(setupId: string, teamIndex: number, entityId: number): boolean {
    const setup = setups.get(setupId);
    if (!setup) return false;
    const team = setup.teams[teamIndex];
    if (!team) return false;
    const idx = team.entities.findIndex(e => e.entityId === entityId);
    if (idx === -1) return false;
    team.entities.splice(idx, 1);
    return true;
}

export function addPendingInvite(setupId: string, invite: PendingInvite): boolean {
    const setup = setups.get(setupId);
    if (!setup) return false;
    setup.pendingInvites.push(invite);
    return true;
}

export function resolvePendingInvite(setupId: string, entityId: number): PendingInvite | null {
    const setup = setups.get(setupId);
    if (!setup) return null;
    const idx = setup.pendingInvites.findIndex(i => i.entityId === entityId);
    if (idx === -1) return null;
    const [invite] = setup.pendingInvites.splice(idx, 1);
    return invite;
}

export function isEntityInAnyTeam(setupId: string, entityId: number): boolean {
    const setup = setups.get(setupId);
    if (!setup) return false;
    return setup.teams.some(t => t.entities.some(e => e.entityId === entityId));
}

export function isUserInAnyTeam(setupId: string, userId: string): boolean {
    const setup = setups.get(setupId);
    if (!setup) return false;
    return setup.teams.some(t => t.entities.some(e => e.userId === userId));
}
