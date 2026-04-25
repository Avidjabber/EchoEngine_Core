export interface DenConfigState {
    guildId: string;
    channelId: string;
    allowWorldSim: boolean;
    allowConditions: boolean;
    allowCombat: boolean;
    allowActivities: boolean;
    allowEvents: boolean;
    allowCrafting: boolean;
    allowProgression: boolean;
    allowSocial: boolean;
}

export type DenConfigKey =
    | 'allowWorldSim'
    | 'allowConditions'
    | 'allowCombat'
    | 'allowActivities'
    | 'allowEvents'
    | 'allowCrafting'
    | 'allowProgression'
    | 'allowSocial';

const TTL_MS = 20 * 60 * 1000;

interface Entry {
    data:      DenConfigState;
    expiresAt: number;
}

const store = new Map<string, Entry>();

function stateKey(userId: string, channelId: string): string {
    return `${userId}_${channelId}`;
}

export function setState(userId: string, channelId: string, state: DenConfigState): void {
    store.set(stateKey(userId, channelId), { data: state, expiresAt: Date.now() + TTL_MS });
}

export function getState(userId: string, channelId: string): DenConfigState | undefined {
    const entry = store.get(stateKey(userId, channelId));
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        store.delete(stateKey(userId, channelId));
        return undefined;
    }
    return entry.data;
}

export function clearState(userId: string, channelId: string): void {
    store.delete(stateKey(userId, channelId));
}
