import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { execute as envconditionUpdate } from './envcondition/update';
import { execute as envconditionDelete } from './envcondition/delete';
import { execute as envconditionInfo }   from './envcondition/info';
import { execute as envconditionList }   from './envcondition/list';
import { execute as proficiencyAdd }    from './proficiency/add';
import { execute as proficiencyUpdate } from './proficiency/update';
import { execute as proficiencyDelete } from './proficiency/delete';
import { execute as proficiencyInfo }   from './proficiency/info';
import { execute as proficiencyList }   from './proficiency/list';

const MODIFIER_TYPES = [
    { name: 'World modifier',       value: 'world'       },
    { name: 'Stat modifier',        value: 'stat'        },
    { name: 'Proficiency modifier', value: 'proficiency' },
] as const;

export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Manage individual guild configuration entries')
    .addSubcommandGroup(group =>
        group
            .setName('envcondition')
            .setDescription('Manage individual env condition modifiers')
            .addSubcommand(sub =>
                sub
                    .setName('update')
                    .setDescription('Add or update an env condition modifier')
                    .addStringOption(opt =>
                        opt
                            .setName('condition')
                            .setDescription('Env condition — omit to choose from a list'),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('delete')
                    .setDescription('Remove all modifiers for a specific env condition in this guild')
                    .addStringOption(opt =>
                        opt
                            .setName('condition')
                            .setDescription('Env condition — omit to choose from a list'),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('info')
                    .setDescription('Browse all env conditions and view their modifiers'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('list')
                    .setDescription('List env condition modifiers, optionally filtered')
                    .addStringOption(opt =>
                        opt
                            .setName('type')
                            .setDescription('Filter by modifier type')
                            .addChoices(...MODIFIER_TYPES),
                    )
                    .addStringOption(opt =>
                        opt
                            .setName('condition')
                            .setDescription('Filter by env condition codeName'),
                    ),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('proficiency')
            .setDescription('Manage individual proficiency definitions')
            .addSubcommand(sub =>
                sub
                    .setName('add')
                    .setDescription('Add or update a proficiency definition'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('update')
                    .setDescription('Edit an existing proficiency definition')
                    .addStringOption(opt =>
                        opt
                            .setName('codename')
                            .setDescription('Proficiency codeName to edit')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('delete')
                    .setDescription('Delete a proficiency definition')
                    .addStringOption(opt =>
                        opt
                            .setName('codename')
                            .setDescription('Proficiency codeName to delete')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('info')
                    .setDescription('View details for a specific proficiency')
                    .addStringOption(opt =>
                        opt
                            .setName('codename')
                            .setDescription('Proficiency codeName to view')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('list')
                    .setDescription('Browse all proficiency definitions'),
            ),
    );

export const publicSubcommands  = new Set(['update', 'delete', 'info', 'list']);
export const modalSubcommands   = new Set(['add']);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'envcondition' && sub === 'update') return envconditionUpdate(interaction);
    if (group === 'envcondition' && sub === 'delete') return envconditionDelete(interaction);
    if (group === 'envcondition' && sub === 'info')   return envconditionInfo(interaction);
    if (group === 'envcondition' && sub === 'list')   return envconditionList(interaction);
    if (group === 'proficiency'  && sub === 'add')    return proficiencyAdd(interaction);
    if (group === 'proficiency'  && sub === 'update') return proficiencyUpdate(interaction);
    if (group === 'proficiency'  && sub === 'delete') return proficiencyDelete(interaction);
    if (group === 'proficiency'  && sub === 'info')   return proficiencyInfo(interaction);
    if (group === 'proficiency'  && sub === 'list')   return proficiencyList(interaction);
}
