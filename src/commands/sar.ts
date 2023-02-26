import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';


export const data = new SlashCommandBuilder()
	.setName('sar')
	.setDescription('Çaldığım ses parçasını ileriye veya geriye sarabilirsin.')
	.setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
	interaction.reply({ content: 'WIP', ephemeral: true });
	return;
}
