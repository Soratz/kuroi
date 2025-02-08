import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { createAudioPlayer, createAudioResource } from '@discordjs/voice';
import { connectionSafeDestroyer } from '../utils/utils.js';
import { ChatInputCommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

import { join } from 'node:path';
import { DiscordClient } from '../classes/discordClient.js';

async function execute(interaction: ChatInputCommandInteraction) {
	if (interaction.inGuild()) {
		const client = interaction.client as DiscordClient;
		const guildMember = interaction.member as GuildMember;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
		const guild = guildMember.guild;
		// const clientMember = guild.me;
		if (voiceChannel && voiceChannel.joinable) {
			client.playAudioFile(voiceChannel as VoiceChannel, 'hai.mp3');
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