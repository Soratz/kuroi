import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

const words = ['domates!', 'biber!', 'patlıcan!'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('patates')
		.setDescription('patates\'e yakın (veya uzak) bir cevap verebilirim.'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.reply({ content: words[Math.floor(Math.random() * words.length)], ephemeral: true });
	},
};