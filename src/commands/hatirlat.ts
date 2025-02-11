import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { DiscordClient } from '../classes/discordClient.js';
import { Reminder } from '../classes/reminder.js';

export const data = new SlashCommandBuilder()
	.setName('hatırlat')
	.setDescription('Sana istediğin bir şeyi hatırlatabilirim.')
	.addStringOption(option =>
		option.setName('içerik')
			.setRequired(true)
			.setDescription('Neyi hatırlatayım?'))
	.addIntegerOption(option =>
		option.setName('dakika')
			.setRequired(true)
			.setMinValue(0)
			.setMaxValue(1440)
			.setDescription('Kaç dakika sonra hatırlatayım?'))
	.addUserOption(option =>
		option.setName('kime')
			.setRequired(false)
			.setDescription('Kime hatırlatayım?'));

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = interaction.user;
	const client = interaction.client as DiscordClient;
	const message = interaction.options.getString('içerik', true);
	const minutes = interaction.options.getInteger('dakika', true);
	const target_user = interaction.options.getUser('kime');
	const reminder = new Reminder(message, minutes, user, target_user);

	let reply_message = `${minutes} dakika sonra hatırlatacağım. (>ᴗ•)/`;
	if (client.reminderManager.hasReminder(user)) {
		reply_message = 'Zaten bir hatırlatman vardı, onunla değiştirdim. ' + reply_message;
	}

	client.reminderManager.addReminder(reminder);
	await interaction.reply({ content: reply_message, flags: MessageFlags.Ephemeral });
	return;
}