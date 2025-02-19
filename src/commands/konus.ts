import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

import { DiscordClient } from '../classes/discordClient.js';
import { textToSpeech } from '../classes/textToSpeech.js';

export const data = new SlashCommandBuilder()
	.setName('konuş')
	.setDescription('Ne söylememi istersin?')
	.addStringOption(option =>
		option.setName('içerik')
			.setRequired(true)
			.setDescription('Ne söylemeli?'))
	.addBooleanOption(option =>
		option.setName('değiştir')
			.setRequired(false)
			.setDescription('Sesimi değiştireyim mi?'));

export async function execute(interaction: ChatInputCommandInteraction) {
	if (interaction.inGuild()) {
		const client = interaction.client as DiscordClient;
		const guildMember = interaction.member as GuildMember;
		const voiceState = guildMember.voice;
		const voiceChannel = voiceState.channel;
		await interaction.deferReply({ ephemeral: true });
		if (voiceChannel && voiceChannel.joinable) {
			// get mesaj
			const mesaj = interaction.options.getString('içerik');
			const voice_clone = interaction.options.getBoolean('değiştir') ?? false;
			if (!mesaj) {
				await interaction.editReply('Mesaj belirtmedin.');
				return;
			}
			const startTime = Date.now();
			const audioFile = await textToSpeech(mesaj, voice_clone);
			// print time it takes to generate the audio file
			const timeTaken = (Date.now() - startTime) / 1000;
			console.log(`TTS request in ${timeTaken}s : ${mesaj}`);
			if (!audioFile) {
				await interaction.editReply('Bir şeyler ters gitti.');
				return;
			}

			client.playAudioFile(voiceChannel as VoiceChannel, audioFile);
			await interaction.editReply('Konuştum!');
		} else {
			await interaction.editReply('Senin olduğun yere pek gelesim yok');
		}

	} else {
		await interaction.editReply('Sunucuda değilsen söylemem :/');
	}
	return;
}