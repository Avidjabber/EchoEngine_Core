interface EngineConditionEntry {
    codeName:                      string;
    name:                          string;
    conditionType:                 string;
    conditionContext:              string;
    isDeathSaveFailureConsequence?: boolean;
}

export const ENGINE_CONDITIONS: EngineConditionEntry[] = [
    // Combat-state conditions — applied and removed by the combat engine
    { codeName: 'grappling',       name: 'Grappling',     conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'grappled',        name: 'Grappled',      conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'pinned',          name: 'Pinned',        conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'taunted',         name: 'Taunted',       conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'being_guarded',   name: 'Being Guarded', conditionType: 'Permanent', conditionContext: 'buff'   },
    { codeName: 'fear',            name: 'Fear',          conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'confused',        name: 'Confused',      conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'stunned',         name: 'Stunned',       conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'marked',          name: 'Marked',        conditionType: 'Permanent', conditionContext: 'debuff' },
    { codeName: 'bleeding_combat', name: 'Bleeding',      conditionType: 'Permanent', conditionContext: 'debuff' },
    // Post-combat consequence — applied when a cat fails all 3 death saving throws
    { codeName: 'near_death',      name: 'Near Death',    conditionType: 'Permanent', conditionContext: 'debuff', isDeathSaveFailureConsequence: true },
];
