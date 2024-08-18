import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { ApplicationCommandType, UserContextMenuCommandInteraction } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

async function execute(interaction: UserContextMenuCommandInteraction) {
	await interaction.deferReply();
	const replikCommand = (interaction.client as DiscordClient).commands.get('replik');
	const query = replikCommand.generateQuery(null, interaction.targetUser);
	await replikCommand.replyWithQuoteByQuery(interaction, query);
	// interaction.reply({ content: 'Hey... sanırsam bu özellik şu an çalışmıyor.', ephemeral: true });
}

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Replik')
		.setDMPermission(false)
		.setType(ApplicationCommandType.User),
	execute: execute,
};