export type ActionCategory = 'combat' | 'scouting' | 'healing' | 'crafting' | 'farming';

export interface ActionDef {
    code:        string;
    name:        string;
    description: string;
}

export const ACTION_DEFS: Record<ActionCategory, ActionDef[]> = {
    combat: [
        { code: 'spar_invite',  name: 'Spar — Invite',  description: 'Friendly bout. Invite specific clanmates to your teams. No permanent damage.'     },
        { code: 'spar_open',    name: 'Spar — Open',    description: 'Friendly bout. Anyone in the clan can sign up. No permanent damage.'              },
        { code: 'fight_invite', name: 'Fight — Invite', description: 'Real fight. Invite specific cats to your teams. Death saves active.'              },
        { code: 'fight_open',   name: 'Fight — Open',   description: 'Real fight. Open to any faction. Death saves active.'                             },
        { code: 'training',     name: 'Training',       description: 'Train a clanmate in a chosen discipline. Once per day.'                           },
    ],
    scouting: [
        { code: 'border_patrol', name: 'Border Patrol', description: 'Patrol the borders to detect threats and reinforce territory.' },
        { code: 'hunting',       name: 'Hunting',       description: 'Hunt prey to feed the clan.'                                   },
        { code: 'foraging',      name: 'Foraging',      description: 'Gather herbs and useful items from the territory.'             },
    ],
    healing: [
        { code: 'treat',    name: 'Treat',    description: 'Treat an injured or ill clanmate.'                          },
        { code: 'diagnose', name: 'Diagnose', description: 'Examine a clanmate to identify conditions or injuries.'     },
    ],
    crafting: [
        { code: 'crafting', name: 'Crafting', description: 'Create items, process herbs, or work on a recipe.'          },
    ],
    farming: [
        { code: 'crop_work',  name: 'Crop Work',  description: 'Work the camp\'s crop plots.'                                },
        { code: 'tend_crops', name: 'Tend Crops', description: 'Light maintenance on existing crop plots.'                   },
        { code: 'compost',    name: 'Compost',    description: 'Process organic material into compost for the gardens.'      },
        { code: 'clean',      name: 'Clean',      description: 'Clean the camp. A visible effort that earns clan respect.'   },
    ],
};
