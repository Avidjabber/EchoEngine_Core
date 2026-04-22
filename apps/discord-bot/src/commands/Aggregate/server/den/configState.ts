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

const store = new Map<string, DenConfigState>();

function stateKey(userId: string, channelId: string): string {
    return `${userId}_${channelId}`;
}

export function setState(userId: string, channelId: string, state: DenConfigState): void {
    store.set(stateKey(userId, channelId), state);
}

export function getState(userId: string, channelId: string): DenConfigState | undefined {
    return store.get(stateKey(userId, channelId));
}

export function clearState(userId: string, channelId: string): void {
    store.delete(stateKey(userId, channelId));
}
