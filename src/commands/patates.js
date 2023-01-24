const { SlashCommandBuilder } = require('@discordjs/builders');

const words = ['domates!', 'biber!', 'patlıcan!'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('patates')
		.setDescription('patates\'e yakın (veya uzak) bir cevap verebilirim.'),
	async execute(interaction) {
		await interaction.reply({ content: words[Math.floor(Math.random() * words.length)], ephemeral: true });
	},
};