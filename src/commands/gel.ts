import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

import { join } from 'node:path';
import { DiscordClient } from '../classes/discordClient.js';

async function execute(interaction: ChatInputCommandInteraction) {
	if (interaction.inGuild()) {
		const client = interaction.client as DiscordClient;
		const guildMember = interaction.member as GuildMember;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
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