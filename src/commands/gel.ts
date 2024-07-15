import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { createAudioPlayer, createAudioResource, NoSubscriberBehavior } from '@discordjs/voice';
import { connectionSafeDestroyer } from '../utils/utils.js';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { join } from 'node:path';

async function execute(interaction: ChatInputCommandInteraction) {
	if (interaction.inGuild()) {
		const guildMember = interaction.member as GuildMember;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
		const guild = guildMember.guild;
		// const clientMember = guild.me;
		if (voiceChannel && voiceChannel.joinable) {
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
				let metaDataTitle = 'No resource';
				if (error.resource.metadata && typeof error.resource.metadata === 'object' && 'title' in error.resource.metadata) {
					metaDataTitle = (error.resource.metadata as any).title;
				}
				console.error(`Error: ${error.message} with resource ${metaDataTitle}`);
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