const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

async function execute(interaction) {
	if (interaction.inGuild()) {
		const connection = getVoiceConnection(interaction.guildId);
		if (connection) {
			connection.destroy();
		}
		await interaction.reply({ content: 'Tamam :(', ephemeral: true });
	} else {
		await interaction.reply({ content: 'Nereden gideyim, he?', ephemeral: true });
	}
	return;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('git')
		.setDescription(':(')
		.setDMPermission(false),
	execute: execute,
};