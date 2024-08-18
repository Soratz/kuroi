import { SlashCommandBuilder } from 'discord.js';
import { ChatInputCommandInteraction } from 'discord.js';

async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();
	const args = interaction.options.getString('girdi')!.split(',');
	const randomNumber = Math.floor(Math.random() * args.length);
	interaction.editReply(`Bunu seçtim: **${args[randomNumber].trim()}**`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seç')
		.setDescription('Girdilerden birini rastgele seçer.')
		.addStringOption(option =>
			option.setName('girdi')
				.setDescription('Tüm girdileri buraya virgül (,) ile ayırarak yazınız.')
				.setRequired(true),
		),
	execute: execute,
};