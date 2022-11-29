async function execute(interaction) {
	const client = interaction.client;
	// handling select menu commands
	if (interaction.isSelectMenu()) {
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