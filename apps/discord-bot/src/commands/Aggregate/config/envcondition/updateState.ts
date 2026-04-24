export type UpdateModifierType = 'world' | 'stat' | 'proficiency';
export type UpdateActiveField  = 'effectType' | 'relation' | 'stat' | 'proficiency';

export interface EnvConditionUpdateState {
    guildId:         string;
    codeName:        string;
    conditionName:   string;
    modifierType:    UpdateModifierType | null;
    // form values:
    effectType:      string | null;
    relation:        string | null;
    value:           number | null;
    stat:            string | null;
    proficiency:     string | null;
    hasDisadvantage: boolean;
    hasAdvantage:    boolean;
    // true when the selected key field (effectType/stat/proficiency) matched an existing DB record
    hasExisting:     boolean;
    // which string field (if any) has its dropdown open:
    activeField:     UpdateActiveField | null;
    // available options (from template data):
    effectTypes:     string[];
    relations:       string[];
    stats:           string[];
    proficiencyDefs: string[];
    // navigation — -1 means command was invoked with a direct codeName (no picker)
    pickerPage:      number;
}

const store = new Map<string, EnvConditionUpdateState>();

function key(userId: string, guildId: string): string {
    return `${userId}_${guildId}`;
}

export function getUpdateState(userId: string, guildId: string): EnvConditionUpdateState | undefined {
    return store.get(key(userId, guildId));
}

export function setUpdateState(userId: string, guildId: string, state: EnvConditionUpdateState): void {
    store.set(key(userId, guildId), state);
}

export function clearUpdateState(userId: string, guildId: string): void {
    store.delete(key(userId, guildId));
}
