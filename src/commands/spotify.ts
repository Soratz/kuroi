/**
 * This function will search users spotify then play on yui's channel.
 */

import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';

export async function execute(interaction: ChatInputCommandInteraction) {
	const interactionOwner = interaction.member as GuildMember;
}

export const data = new SlashCommandBuilder()
	.setName('spotify')
	.setDescription('Spotify\'da dinlediğiniz müziği gösterir. Bu müziği youtuba\'a ekleyebilirsiniz.')
	.setDMPermission(false);