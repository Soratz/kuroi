import { BaseInteraction, ChannelType } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

async function execute(interaction: BaseInteraction) {
	const client = interaction.client as DiscordClient;

	let interactionChannelName = 'Unknown Channel';
	if (interaction.channel?.type == ChannelType.DM) {
		interactionChannelName = 'DM Channel';
	} else if (interaction.channel) {
		interactionChannelName = interaction.channel.name!;
	} else {
		interactionChannelName = 'Unknown Channel';
	}

	// Handling button commands, no idea how this was working -Sravdar
	// Should be only working with buttons in interaction reply of slashcommand
	if (interaction.isButton() && interaction.message.interaction) {
		const command = client.buttonCommands.get(interaction.message.interaction.commandName);
		if (!command) {
			console.error(`No button command matching ${interaction.message.interaction.commandName} was found.`);
			return;
		}
		try {
			console.log(`${interaction.user.tag} in #${interactionChannelName} triggered an button "${interaction.message.interaction.commandName}" interaction`);
			await command.buttonExecute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.message.interaction.commandName} requested by ${interaction.user.tag}`);
			console.error(error);
		}
	}

	// handling select menu commands
	// TODO: Make this modular just like its done in button commands
	if (interaction.isStringSelectMenu()) {
		console.log(`${interaction.user.tag} in #${interactionChannelName} triggered an select menu interaction`);
		if (interaction.customId === 'selectSong') {
			const searchCommand = client.commands.get('ara');
			try {
				await searchCommand.selectSong(interaction);
			} catch (error) {
				console.error(error);
			}
		}
	}

	// Handle normal slash commands
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (command) {
			try {
				console.log(`${interaction.user.tag} in #${interactionChannelName} triggered an a slash command "${interaction.commandName}" interaction.`);
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.deferred) {
					await interaction.editReply({ content: 'Bir hata oluştu!', embeds: [], components: [] });
				}
			}
		}
	}
}

module.exports = {
	name: 'interactionCreate',
	execute: execute,
};