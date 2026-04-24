import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo } from './envcondition/infoState';
import { fetchEnvConditionInfoData } from '../../../services/model/envConditionPackService';
import { execute as envconditionUpdate } from './envcondition/update';
import { execute as envconditionReset }  from './envcondition/reset';
import { execute as envconditionInfo }   from './envcondition/info';
import { execute as envconditionList }   from './envcondition/list';

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
                            .setDescription('Env condition — omit to choose from a list')
                            .setAutocomplete(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Remove all modifiers for a specific env condition in this guild')
                    .addStringOption(opt =>
                        opt
                            .setName('condition')
                            .setDescription('Env condition — omit to choose from a list')
                            .setAutocomplete(true),
                    )
                    .addBooleanOption(opt =>
                        opt
                            .setName('all')
                            .setDescription('Reset every modifier for every condition in this guild'),
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
    );

export const publicSubcommands = new Set(['info']);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'envcondition' && sub === 'update') return envconditionUpdate(interaction);
    if (group === 'envcondition' && sub === 'reset')  return envconditionReset(interaction);
    if (group === 'envcondition' && sub === 'info')   return envconditionInfo(interaction);
    if (group === 'envcondition' && sub === 'list')   return envconditionList(interaction);
}

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focused  = interaction.options.getFocused().toLowerCase();
    const guildId  = interaction.guildId!;

    let infoData = getCachedEnvConditionInfo(guildId);
    if (!infoData) {
        const result = await fetchEnvConditionInfoData(guildId);
        if (!result.success) { await interaction.respond([]); return; }
        infoData = result.value!;
        setCachedEnvConditionInfo(guildId, infoData);
    }

    const choices = infoData.conditions
        .filter(c => !focused || c.name.toLowerCase().includes(focused) || c.codeName.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(c => ({ name: c.name, value: c.codeName }));

    await interaction.respond(choices);
}
