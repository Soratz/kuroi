const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord.js');

async function execute(interaction) {
	await interaction.deferReply();
	const replikCommand = interaction.client.commands.get('replik');
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