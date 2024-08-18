import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

// const nameLocalizations = {
// 	'tr': 'zarat',
// };

// const descriptionLocalizations = {
// 	'tr': 'İstediğiniz sayıya sahip zarı atar.',
// };

async function execute(interaction: ChatInputCommandInteraction) {
	const dieNumber = interaction.options.getInteger('sayı');
	const randomNumber = Math.floor(Math.random() * dieNumber!) + 1;
	await interaction.reply({ content: `Rolled **${randomNumber}** (1-${dieNumber})` });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('zarat')
		.setDescription('Hangi zarı tercih edersin?')
		// .setNameLocalizations(nameLocalizations)
		// .setDescriptionLocalizations(descriptionLocalizations)
		.addIntegerOption(option =>
			option.setName('sayı')
				.setDescription('Atacağınız sayıyı giriniz.')
				.setRequired(true)
				.setMinValue(2)
				.setMaxValue(1000000000)),
	execute: execute,
};