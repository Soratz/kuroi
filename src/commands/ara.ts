import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { APISelectMenuOption, ChatInputCommandInteraction, GuildMember, ImageURLOptions, InteractionEditReplyOptions, StringSelectMenuInteraction } from 'discord.js';
import { DiscordAudioQueue } from '../classes/discordAudioQueue';
import { DiscordClient } from '../classes/discordClient';
import { getYoutubePlaylistVideos, youtubeSearch, YoutubeSearchType, YoutubeVideoData } from '../classes/youtubeSearch';
import { secondsToString } from '../utils/utils';

// TODO: şu an çalan şarkıyı görebilelim ve queueyu
// Todo: sonraki şarkıya geçebilelim veya önceki şarkıya dönsün
// todo: bu kontrollerin olması için chatta bir şey updatelenebilir veya tekrar command alınabilir
// TODO: kuroi başka channela movelanırsa çalmaya devam ediyor, bir şey yapmak gerekir mi?
// TODO: Şarkı çalarken başka bir yerden çağırınca oraya gitmiyo? gitmesi lazım mı ki?
// - eğer kimse yoksa çaldığı yerde çağırıldığı gidebilir.
// TODO: Bitince şarkı sıradaki şarkıya geçsin veya sırada şarkı yoksa ayrılsın channeldan.

export async function execute(interaction: ChatInputCommandInteraction) {
	const member = interaction.member as GuildMember;
	if (!member) {
		if (interaction.isRepliable()) interaction.reply('Şu an bir şey aramak istemiyorum.');
		return;
	}
	await interaction.deferReply({ ephemeral: true });
	const queryString = interaction.options.getString('içerik', true);
	const videoData = await youtubeSearch(queryString);

	if (videoData.size == 0) {
		await interaction.editReply({ content: 'Arama sonucunda bir şey bulamadım :(' });
		return;
	}

	// creating select menu options from video data
	const videoOptions: APISelectMenuOption[] = [];
	videoData.forEach(item => {
		videoOptions.push(item.getStringMenuOption());
	});

	const selectionRow = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('selectSong')
				.setPlaceholder('Bir video seç')
				.addOptions(videoOptions),
		);

	const avatarURL = member.displayAvatarURL({ format: 'png' } as ImageURLOptions);
	const embed = new EmbedBuilder().setColor(0xFC1C03);
	embed.setTitle('Listeden bir şarkı seç')
		.setAuthor({ name: member.displayName, iconURL: avatarURL })
		.setURL(null)
		.setThumbnail(null);
	embed.setDescription('Aşağıdaki listeden bir şarkı seçebilirsin.');

	await interaction.editReply({ embeds: [embed], components: [selectionRow] } as InteractionEditReplyOptions);
}

export async function selectSong(interaction: StringSelectMenuInteraction) {
	// Todo: If the member who sent this message is no longer in a voice channel, ignore this interaction.
	await interaction.deferReply({ ephemeral: true });
	const selectedValue = interaction.values[0];
	const selectedOption = interaction.component.options.find(option => option.value == selectedValue);
	// to not send a reply
	await interaction.deleteReply();
	if (!selectedOption) {
		await interaction.followUp({ content: 'Bu seçim artık geçerli değil ya. Yeniden arayabilirsin.', embeds: [], components: [], ephemeral: true });
		return;
	}
	// check what type of option is selected
	const optionType = YoutubeVideoData.getEmojiByType(selectedOption.emoji?.name as string);
	// this interaction can't be sent from outside of a guild
	const client = (interaction.client as DiscordClient);
	// get queue if exists or create a queue
	let queue = client.audioQueues.get(interaction.guildId as string);
	if (!queue) {
		queue = new DiscordAudioQueue(interaction);
		client.audioQueues.set(interaction.guildId as string, queue);
	}
	const wasQueueEmpty = queue.isEmpty();
	if (optionType == YoutubeSearchType.Video) {
		const youtubeVideoData = new YoutubeVideoData(selectedOption.label, selectedOption.description as string, selectedValue);
		// add to queue
		queue.enqueue(youtubeVideoData);
	} else if (optionType == YoutubeSearchType.Playlist) {
		// TODO: print added playlist somehow
		const playlistId = selectedOption.value;
		const playlistVideos = await getYoutubePlaylistVideos(playlistId);
		playlistVideos.forEach(videoData => {
			(queue as DiscordAudioQueue).enqueue(videoData);
		});
	} else {
		await interaction.followUp({ content: 'Geçersiz seçenek.', embeds: [], components: [], ephemeral: true });
		return;
	}
	// last enqueued video
	const lastVideo = queue.last() as YoutubeVideoData;
	// if queue was empty before adding a song, play it
	if (wasQueueEmpty) {
		const subscription = queue.play(interaction);
		if (!subscription) {
			await interaction.followUp({ content: 'Şu an bir şeyler dinlemeyelim en iyisi.', embeds: [], components: [], ephemeral: true });
			// remove the last song we added
			queue.dequeue();
		}
		const embed = new EmbedBuilder().setColor(0xFC1C03);
		const member = interaction.member as GuildMember;
		const videoInfo = await lastVideo.getInfo();
		embed.setTitle(lastVideo.title)
			.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL({ format: 'png' } as ImageURLOptions) })
			.setURL(lastVideo.videoURL)
			.setThumbnail(videoInfo.videoDetails.thumbnails.at(-1)?.url ?? '')
			.setFields({ name: 'Video Süresi: ', value: secondsToString(videoInfo.videoDetails.lengthSeconds) });
		await interaction.followUp({ embeds: [embed], ephemeral: false });
	} else {
		// print the message that says it added to the queue
		// TODO: change this print if playlist was added
		const embed = new EmbedBuilder().setColor(0xFC1C03);
		const member = interaction.member as GuildMember;
		const videoInfo = await lastVideo.getInfo();
		embed.setTitle(`Video ${queue.getLength()}. sıraya eklendi.`)
			.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL({ format: 'png' } as ImageURLOptions) })
			.setURL(lastVideo.videoURL)
			.setThumbnail(videoInfo.videoDetails.thumbnails.at(-1)?.url ?? '')
			.setFields(
				{ name: 'Sıraya eklenen video:', value: lastVideo.title, inline: true },
				{ name: 'Video Süresi: ', value: secondsToString(videoInfo.videoDetails.lengthSeconds), inline: true },
			);
		await interaction.followUp({ embeds: [embed], ephemeral: false });
	}
}

export const data = new SlashCommandBuilder()
	.setName('ara')
	.setDescription('YouTube\'da şarkı mı aratacaksın?')
	.setDMPermission(false)
	.addStringOption(option =>
		option.setName('içerik')
			.setRequired(true)
			.setDescription('Yaz bakalım, YouTube\'da arayalım.'));