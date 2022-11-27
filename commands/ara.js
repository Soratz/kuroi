const { ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { SelectMenuBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
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

// TODO: şu an çalan şarkıyı görebilelim ve queueyu
// Todo: sonraki şarkıya geçebilelim veya önceki şarkıya dönsün
// todo: bu kontrollerin olması için chatta bir şey updatelenebilir veya tekrar command alınabilir
// TODO: kuroi başka channela movelanırsa çalmaya devam ediyor, bir şey yapmak gerekir mi?
// TODO: Şarkı çalarken başka bir yerden çağırınca oraya gitmiyo? gitmesi lazım mı ki?
// - eğer kimse yoksa çaldığı yerde çağırıldığı gidebilir.
// TODO: Bitince şarkı sıradaki şarkıya geçsin veya sırada şarkı yoksa ayrılsın channeldan.

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
			item.snippet.videoId = item.id.videoId;
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

	const selectionRow = new ActionRowBuilder()
		.addComponents(
			new SelectMenuBuilder()
				.setCustomId('selectSong')
				.setPlaceholder('Diğer videolar...')
				.addOptions(videoOptions),
		);

	// First check the queue before playing.
	// if there is something playing we should add to the queue
	const audioPlayer = await getOrCreateAudioPlayer(interaction.guildId);
	const playerStatus = audioPlayer.state.status;
	const avatarURL = interaction.member.displayAvatarURL({ format: 'png' });
	embed.setTitle('Listeden bir şarkı seç')
		.setAuthor({ name: interaction.member.displayName, iconURL: avatarURL })
		.setURL(null)
		.setThumbnail(null);

	if (playerStatus === AudioPlayerStatus.Playing || playerStatus === AudioPlayerStatus.Buffering) {
		// print queue add message
		embed.setFields({ name: 'Şu an bir şarkı çalıyor.', value: 'Aşağıdaki listeden bir şarkı seçip sıraya ekleyebilirsin.' });
	} else {
		// using splice to remove the previously set field.
		embed.spliceFields(0, 1);
		embed.setDescription('Aşağıdaki listeden bir şarkı seçebilirsin.');
	}
	await interaction.reply({ embeds: [embed], components: [selectionRow] });
	embed.setDescription(null);
}

async function selectSong(interaction) {
	// first check if we can create a voice channel and join it by creating a connection
	const connection = await createVoiceConnection(interaction);
	if (!connection || interaction.values.length == 0) {
		await interaction.update({ content: 'Şu an bir şeyler dinlemeyelim en iyisi.', embeds: [], component: [] });
		return;
	}
	const videoId = interaction.values[0];
	const audioPlayer = await getOrCreateAudioPlayer(interaction.guildId);
	const playerStatus = audioPlayer.state.status;
	const videoSnippet = videoData.get(videoId);
	if (!videoSnippet) {
		await interaction.update({ content: 'Bu seçim artık geçerli değil ya. Yeniden arayabilirsin.', embeds: [], component: [] });
	}
	const videoURL = 'https://www.youtube.com/watch?v=' + videoId;
	const avatarURL = interaction.member.displayAvatarURL({ format: 'png' });
	// If the player status in playing or buffering, then add to queue.
	console.log('Current player status: ', playerStatus);
	if (playerStatus === AudioPlayerStatus.Buffering || playerStatus === AudioPlayerStatus.Playing) {
		// Create a queue if there isn't any for the guild that interaction came from
		let queue = queues.get(interaction.guildId);
		if (!queue) {
			queue = new Queue();
			queues.set(interaction.guildId, queue);
		}
		// if queue returns 0, then the song couldn't add to the queue
		const que_len = queue.enqueue(videoSnippet);
		if (que_len === 0) {
			await interaction.update({ content: 'Sıra dolu olduğu için şarkınızı sıraya ekleyemedim. :(', embeds: [], components: [] });
			throw 'Can\'t add a song to queue.';
		}
		// else then we added to the queue with no problem
		embed.setTitle(`Şarkınız ${que_len}. sıraya eklendi.`)
			.setAuthor({ name: interaction.member.displayName, iconURL: avatarURL })
			.setURL(videoURL)
			.setThumbnail(videoSnippet.thumbnails.high.url)
			.setFields({ name: 'Sıraya eklenen video:', value: videoSnippet.title });
		await interaction.update({ embeds: [embed], components: [] });
		return;
	}
	const resource = await createResourceFromYoutube(videoId);
	// Sending audio player if its already exists, and overwriting it.
	await playResourceFromConnection(connection, audioPlayer, resource, queues.get(interaction.guildId));
	embed.setTitle(videoSnippet.title)
		.setAuthor({ name: interaction.member.displayName, iconURL: avatarURL })
		.setURL(videoURL)
		.setThumbnail(videoSnippet.thumbnails.high.url)
		.setFields({ name: 'Video Süresi: ', value: 'İnş burada video süresi olacak' });

	interaction.update({ embeds: [embed], components: [] });
}

async function getOrCreateAudioPlayer(guildId) {
	let audioPlayer = audioPlayers.get(guildId);
	if (!audioPlayer) {
		audioPlayer = createAudioPlayer();
		audioPlayers.set(guildId, audioPlayer);
		audioPlayer.on(AudioPlayerStatus.Playing, () => {
			console.log('The audio player has started playing at %s! Status: %s', guildId, audioPlayer.state.status);
		});
		audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			try {
				// Should go to the song in the queue
				console.log('The audio player is now idle at %s. Status: %s', guildId, audioPlayer.state.status);
				const queue = queues.get(guildId);
				const connection = getVoiceConnection(guildId);
				if (!queue || queue.length() == 0) {
					// cleaning the connection and audioplayer resources if there is no need
					audioPlayer.stop();
					if (connection) {
						connection.destroy();
					}
				} else if (connection) {
					const nextVideoSnippet = queue.dequeue();
					if (nextVideoSnippet) {
						const videoId = nextVideoSnippet.videoId;
						const resource = await createResourceFromYoutube(videoId);
						// Sending audio player if its already exists, and overwriting it.
						await playResourceFromConnection(connection, audioPlayer, resource, queue);
					} else {
						// nothing at the queue so just destroy the resources
						audioPlayer.stop();
						connection.destroy();
					}
				}
			} catch (error) {
				// in case of error, just stop the audio player and reset connection to be safe
				console.error(error);
				audioPlayer.stop();
				const connection = getVoiceConnection(guildId);
				if (connection) { connection.destroy(); }
			}
		});
		audioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
			// Just empty the queue when its autopaused
			const queue = queues.get(guildId);
			if (queue) { queue.empty(); }
			console.log('The audio player is now autopaused at %s. Status: %s', guildId, audioPlayer.state.status);
		});
		audioPlayer.on(AudioPlayerStatus.Paused, () => {
			// No need to empty the queue when manually paused.
			console.log('The audio player is now paused at %s. Status: %s', guildId, audioPlayer.state.status);
		});
		audioPlayer.on(AudioPlayerStatus.Buffering, () => {
			// Buffering
			console.log('The audio player is now buffering at %s. Status: %s', guildId, audioPlayer.state.status);
		});
	}
	return audioPlayer;
}

async function createResourceFromYoutube(videoId) {
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
	return createAudioResource(stream, { inputType: StreamType.Arbitrary });
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
	audioPlayers: audioPlayers,
};