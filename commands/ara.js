const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Events, SelectMenuBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { youtubeQueryURL } = require('../config.json');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const { createVoiceConnection, playResourceFromConnection } = require('../utils/utils.js');
const { Queue } = require('../classes/queue.js');
const { Collection } = require('discord.js');

const embed = new EmbedBuilder().setColor(0xFC1C03);
const videoData = new Collection();
const audioPlayers = new Collection();
const queues = new Collection();

// TODO: Queue eklenecek, şarkılar için
// TODO: Şarkı çalarken başka bir yerden çağırınca oraya gitmiyo? gitmesi lazım mı ki?
// TODO: Bitince şarkı sıradaki şarkıya geçsin veya sırada şarkı yoksa bitsin.

async function execute(interaction) {
	// first check if we can create a voice channel and join it by creating a connection
	const connection = await createVoiceConnection(interaction);
	if (!connection) {
		await interaction.reply({ content: 'Şu an bir şeyler aramayalım.', ephemeral: true });
		return;
	}
	const context = interaction.options.getString('içerik');
	const videoQueryURL = encodeURI(youtubeQueryURL.replace('${queryString}', context));
	const response = await fetch(videoQueryURL);
	if (response.status != 200 || !response.ok) {
		throw new Error(`Error! status: ${response.status}`);
	}
	const result = await response.json();
	const videoOptions = [];
	videoData.clear();
	for (const item of result.items) {
		if (item.kind == 'youtube#searchResult') {
			videoData.set(item.id.videoId, item.snippet);
			videoOptions.push({
				label: item.snippet.title.slice(0, 99),
				description: 'Kanal: ' + item.snippet.channelTitle,
				value: item.id.videoId,
			});
		}
	}

	if (videoData.size == 0) {
		await interaction.reply({ content: 'Arama sonucunda bir şey bulamadım :(' });
		return;
	}

	// Create a queue if there isn't any for the guild that interaction came from
	if (!queues.get(interaction.guildId)) {
		queues.set(interaction.guildId, new Queue());
	}

	const videoURL = 'https://www.youtube.com/watch?v=' + videoData.firstKey();
	const videoSnippet = videoData.first();
	const selectionRow = new ActionRowBuilder()
		.addComponents(
			new SelectMenuBuilder()
				.setCustomId('selectSong')
				.setPlaceholder('Diğer videolar...')
				.addOptions(videoOptions),
		);
	const avatarURL = interaction.member.displayAvatarURL({ format: 'png' });
	embed.setTitle(videoSnippet.title)
		.setAuthor({ name: interaction.member.displayName, iconURL: avatarURL })
		.setURL(videoURL)
		.setThumbnail(videoSnippet.thumbnails.high.url)
		.setFields({ name: 'Video Süresi: ', value: 'İnş burada video süresi olacak' });

	// First check the queue before playing.
	const queue = queues.get(interaction.guildId);
	// if there is something playing we should add to the queue
	const audioPlayer = await getOrCreateAudioPlayer(interaction.guildId);
	const playerStatus = audioPlayer.state.status;
	if (playerStatus != AudioPlayerStatus.Idle) {
		// queue.enqueue({"video"});
	}
	// Let's play our video
	const stream = ytdl(videoURL, {
		filter : 'audioonly',
		fmt: 'mp3',
		// high values to streaming for longer
		highWaterMark: 1 << 62,
		liveBuffer: 1 << 62,
		// disabling chunking is recommended in discord bot
		dlChunkSize: 0,
		bitrate: 128,
		quality: 'lowestaudio',
	});
	const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
	await playResourceFromConnection(connection, audioPlayer, resource);
	await interaction.reply({ embeds: [embed], components: [selectionRow] });
}

async function selectSong(interaction) {
	// first check if we can create a voice channel and join it by creating a connection
	const connection = await createVoiceConnection(interaction);
	if (!connection) {
		await interaction.reply({ content: 'Şu an bir şeyler aramayalım.', ephemeral: true });
		return;
	}
	if (interaction.values.length == 0) {
		// nothing selected
		return;
	}
	const videoId = interaction.values[0];
	const videoURL = 'https://www.youtube.com/watch?v=' + videoId;
	const stream = ytdl(videoURL, {
		filter : 'audioonly',
		fmt: 'mp3',
		highWaterMark: 1 << 62,
		liveBuffer: 1 << 62,
		// disabling chunking is recommended in discord bot
		dlChunkSize: 0,
		bitrate: 128,
		quality: 'lowestaudio',
	});
	const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
	// Sending audio player if its already exists, and overwriting it.
	const audioPlayer = await getOrCreateAudioPlayer(interaction.guildId);
	await playResourceFromConnection(connection, audioPlayer, resource);
	const videoSnippet = videoData.get(videoId);
	if (videoSnippet) {
		const avatarURL = interaction.member.displayAvatarURL({ format: 'png' });
		embed.setTitle(videoSnippet.title)
			.setAuthor({ name: interaction.member.displayName, iconURL: avatarURL })
			.setURL(videoURL)
			.setThumbnail(videoSnippet.thumbnails.high.url)
			.setFields({ name: 'Video Süresi: ', value: 'İnş burada video süresi olacak' });

		interaction.update({ embeds: [embed] });
	}
}

async function getOrCreateAudioPlayer(guildId) {
	let audioPlayer = audioPlayers.get(guildId);
	if (!audioPlayer) {
		audioPlayer = createAudioPlayer();
		audioPlayers.set(guildId, audioPlayer);
		audioPlayer.on(AudioPlayerStatus.Playing, () => {
			console.log('The audio player has started playing! Status: ' + audioPlayer.state.status);
		});
		audioPlayer.on(AudioPlayerStatus.Idle, () => {
			// Should go to the song in the queue
			console.log('The audio player is now idle. Status: ' + audioPlayer.state.status);
		});
	}
	return audioPlayer;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ara')
		.setDescription('YouTube\'da şarkı mı aratacaksın?')
		.setDMPermission(false)
		.addStringOption(option =>
			option.setName('içerik')
				.setRequired(true)
				.setDescription('Yaz bakalım, YouTube\'da arayalım.')),
	execute: execute,
	selectSong: selectSong,
	queues: queues,
};