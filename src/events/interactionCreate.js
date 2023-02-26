async function execute(interaction) {
	const client = interaction.client;

	// Handling button commands, no idea how this was working -Sravdar
	// Should be only working with buttons in interaction reply of slashcommand
	if (interaction.isButton()) {
		const command = interaction.client.buttonCommands.get(interaction.message.interaction.commandName);
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
	if (interaction.isUserContextMenuCommand()) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an user context menu interaction.`);
	} else if (interaction.inGuild()) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	} else {
		console.log(`${interaction.user.tag} in direct message channel triggered an interaction.`);
	}
	// Retrieving command from the commands Collection by using its key that is its name.
	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
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