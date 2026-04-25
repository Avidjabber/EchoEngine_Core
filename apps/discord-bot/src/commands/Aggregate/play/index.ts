import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { replyError, replyLoading } from '../../../core/reply';
import { fetchMyCharacters } from '../../../services/play/entityService';
import { setCachedCharacters } from './action/characterSelectCache';
import { buildCharacterSelectComponents } from './action/characterSelectComponents';
import type { ActionCategory } from './action/defs';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play with your characters')
    .addSubcommandGroup(group =>
        group
            .setName('action')
            .setDescription('Perform an action with a character')
            .addSubcommand(sub => sub
                .setName('combat')
                .setDescription('Combat actions: spar, fight, training'),
            )
            .addSubcommand(sub => sub
                .setName('scouting')
                .setDescription('Scouting actions: border patrol, hunting, foraging'),
            )
            .addSubcommand(sub => sub
                .setName('healing')
                .setDescription('Healing actions: treat, diagnose'),
            )
            .addSubcommand(sub => sub
                .setName('crafting')
                .setDescription('Crafting actions'),
            )
            .addSubcommand(sub => sub
                .setName('farming')
                .setDescription('Farming actions: crop work, tending, composting, cleaning'),
            ),
    );

async function handleActionCategory(
    interaction: ChatInputCommandInteraction,
    category:    ActionCategory,
): Promise<void> {
    await replyLoading(interaction);

    const result = await fetchMyCharacters(interaction.guildId!, interaction.user.id);

    if (!result.success) {
        await replyError(interaction, 'Failed to load your characters. Please try again.');
        return;
    }

    const chars = result.value!;
    setCachedCharacters(interaction.guildId!, interaction.user.id, chars);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildCharacterSelectComponents(chars, category, 0) as never,
    });
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'action') {
        return handleActionCategory(interaction, sub as ActionCategory);
    }
}
