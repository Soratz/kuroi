import { BaseInteraction, ChannelType } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

async function execute(interaction: BaseInteraction) {
	const client = interaction.client as DiscordClient;

	// Handling button commands, no idea how this was working -Sravdar
	// Should be only working with buttons in interaction reply of slashcommand
	if (interaction.isButton() && interaction.message.interaction) {
		const command = client.buttonCommands.get(interaction.message.interaction.commandName);
		if (!command) {
			console.error(`No button command matching ${interaction.message.interaction.commandName} was found.`);
			return;
		}
		try {
			await command.buttonExecute(interaction);
			console.log(`${interaction.user.tag} triggered an select button interaction.`);
		} catch (error) {
			console.error(`Error executing ${interaction.message.interaction.commandName}`);
			console.error(error);
		}
	}

	// handling select menu commands
	if (interaction.isStringSelectMenu()) {
		console.log(`${interaction.user.tag} triggered an select menu interaction.`);
		if (interaction.customId === 'selectSong') {
			const searchCommand = client.commands.get('ara');
			try {
				await searchCommand.selectSong(interaction);
			} catch (error) {
				console.error(error);
				await interaction.update({ content: 'Bir hata oluştu!', embeds: [], components: [] });
			}
		}
	}
	// return if it isn't a normal command.
	if (!interaction.isCommand()) return;
	// down below is normal command options
	let interactionChannelName = 'Unknown Channel';
	if (interaction.channel?.type == ChannelType.DM) {
		interactionChannelName = `${interaction.channel.recipient?.username} DM Channel`;
	} else if (interaction.channel) {
		interactionChannelName = interaction.channel.name;
	} else {
		interactionChannelName = 'Unknown Channel';
	}


	if (interaction.isUserContextMenuCommand()) {
		console.log(`${interaction.user.tag} in #${interactionChannelName} triggered an user context menu interaction.`);
	} else if (interaction.inGuild()) {
		console.log(`${interaction.user.tag} in #${interactionChannelName} triggered an interaction.`);
	} else {
		console.log(`${interaction.user.tag} in direct message channel triggered an interaction.`);
	}
	// Retrieving command from the commands Collection by using its key that is its name.
	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		console.log(`${interaction.user.tag} triggered an a normal command interaction.`);
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
	}
}

module.exports = {
	name: 'interactionCreate',
	execute: execute,
};