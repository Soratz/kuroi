const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const { connectionSafeDestroyer } = require('../utils/utils.js');

const { join } = require('node:path');

async function execute(interaction) {
	if (interaction.inGuild()) {
		const guildMember = interaction.member;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
		const guild = guildMember.guild;
		// const clientMember = guild.me;
		if (voiceChannel.joinable) {
			const connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});
			connection.on(VoiceConnectionStatus.Disconnected, connectionSafeDestroyer);
			const player = createAudioPlayer();
			const resource = createAudioResource(join(__dirname, '../resources/audio/hai.mp3'));

			player.play(resource);
			player.on('error', error => {
				console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
				player.stop();
			});

			connection.subscribe(player);
			await interaction.reply({ content: 'Geldim!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'Senin olduğun yere pek gelesim yok', ephemeral: true });
		}
	} else {
		await interaction.reply({ content: 'Sunucuda değilsen gelmem :/', ephemeral: true });
	}
	return;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gel')
		.setDescription('Beni mi çağırmak istemiştin?')
		.setDMPermission(false),
	execute: execute,
};