const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

async function execute(interaction) {
	const araCommand = interaction.client.commands.get('ara');
	const guildId = interaction.guildId;
	const audioPlayer = araCommand.audioPlayers.get(guildId);
	// If playing anything
	if (audioPlayer && audioPlayer.state.status === AudioPlayerStatus.Playing) {
		const songName = await araCommand.playNextSongIfAvailable();
		if (songName) {
			interaction.reply(`Tamamdır, sıradaki şarkımız: \`\`${songName}\`\``);
			return;
		}
	}
	interaction.reply({ content: 'Eeee, geçecek bir şey yok.', ephemeral: true });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gec')
		.setDescription('Sıradaki şarkıya geçelim!')
		.setDMPermission(false),
	execute: execute,
};