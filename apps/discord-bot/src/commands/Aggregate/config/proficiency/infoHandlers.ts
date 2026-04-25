import { ButtonInteraction } from 'discord.js';

// customId: prof_info_done
export async function handleProfInfoDone(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await interaction.deleteReply();
}
