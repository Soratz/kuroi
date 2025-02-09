import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, GuildMember, MessageFlags, VoiceChannel } from 'discord.js';

import { DiscordClient } from '../classes/discordClient.js';
import { textToSpeech } from '../classes/textToSpeech.js';

export const data = new SlashCommandBuilder()
	.setName('konuş')
	.setDescription('Ne söylememi istersin?')
	.addStringOption(option =>
		option.setName('içerik')
			.setRequired(true)
			.setDescription('Ne söylemeli?'));


export async function execute(interaction: ChatInputCommandInteraction) {
	if (interaction.inGuild()) {
		const client = interaction.client as DiscordClient;
		const guildMember = interaction.member as GuildMember;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
		if (voiceChannel && voiceChannel.joinable) {
			// get mesaj
			const mesaj = interaction.options.getString('içerik');
			if (!mesaj) {
				await interaction.reply({ content: 'Mesaj belirtmedin.', flags: MessageFlags.Ephemeral });
				return;
			}
			console.log('TTS request: ', mesaj);
			const audioFile = await textToSpeech(mesaj);
			if (!audioFile) {
				await interaction.reply({ content: 'Bir şeyler ters gitti.', flags: MessageFlags.Ephemeral });
				return;
			}
			client.playAudioFile(voiceChannel as VoiceChannel, audioFile);
			await interaction.reply({ content: 'Geldim!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'Senin olduğun yere pek gelesim yok', flags: MessageFlags.Ephemeral });
		}

	} else {
		await interaction.reply({ content: 'Sunucuda değilsen söylemem :/', flags: MessageFlags.Ephemeral });
	}
	return;
}