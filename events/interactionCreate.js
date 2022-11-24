async function execute(interaction) {
	if (interaction.isSelectMenu()) {
		if (interaction.customId === 'selectSong') {
			const searchCommand = interaction.client.commands.get('ara');
			searchCommand.selectSong(interaction);
		}
	}
	// return if it isn't a command.
	if (!interaction.isCommand()) return;
	if (interaction.inGuild()) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	} else {
		console.log(`${interaction.user.tag} in direct message channel triggered an interaction.`);
	}
	// Retrieving command from the commands Collection by using its key that is its name.
	const client = interaction.client;
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