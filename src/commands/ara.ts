import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { APISelectMenuOption, ChatInputCommandInteraction, GuildMember, ImageURLOptions, InteractionEditReplyOptions, StringSelectMenuInteraction } from 'discord.js';
import { DiscordAudioQueue } from '../classes/discordAudioQueue';
import { DiscordClient } from '../classes/discordClient';
import { youtubeSearch, YoutubeVideoData } from '../classes/youtubeSearch';
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
	// Todo: If another user clicks this, ignore this interaction.
	// Todo: If the member who sent this message is no longer in a voice channel, ignore this interaction.
	await interaction.update('Seçilen video oynatılmaya hazırlanıyor.');
	const selectedValue = interaction.values[0];
	const selectedOption = interaction.component.options.find(option => option.value == selectedValue);
	if (selectedOption) {
		const youtubeVideoData = new YoutubeVideoData(selectedOption.label, selectedOption.description as string, selectedValue);
		// this interaction can't be sent from outside of a guild
		const client = (interaction.client as DiscordClient);
		// get quueue if exists or create a queue
		let queue = client.audioQueues.get(interaction.guildId as string);
		if (!queue) {
			queue = new DiscordAudioQueue(interaction);
			client.audioQueues.set(interaction.guildId as string, queue);
		}
		// add to queue
		queue.enqueue(youtubeVideoData);
		// if it is the only song in the queue, play it
		if (queue.getLength() == 1) {
			const subscription = queue.play(interaction);
			if (!subscription) {
				await interaction.followUp({ content: 'Şu an bir şeyler dinlemeyelim en iyisi.', embeds: [], components: [], ephemeral: true });
				// remove the last song we added
				queue.dequeue();
			}
			const embed = new EmbedBuilder().setColor(0xFC1C03);
			const member = interaction.member as GuildMember;
			const videoInfo = await youtubeVideoData.getInfo();
			embed.setTitle(youtubeVideoData.title)
				.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL({ format: 'png' } as ImageURLOptions) })
				.setURL(youtubeVideoData.videoURL)
				.setThumbnail(videoInfo.videoDetails.thumbnails.at(-1)?.url ?? '')
				.setFields({ name: 'Video Süresi: ', value: secondsToString(videoInfo.videoDetails.lengthSeconds) });
			await interaction.followUp({ embeds: [embed], ephemeral: false });
		} else {
			// print the message that says it added to the queue
			const embed = new EmbedBuilder().setColor(0xFC1C03);
			const member = interaction.member as GuildMember;
			const videoInfo = await youtubeVideoData.getInfo();
			embed.setTitle(`Video ${queue.getLength()}. sıraya eklendi.`)
				.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL({ format: 'png' } as ImageURLOptions) })
				.setURL(youtubeVideoData.videoURL)
				.setThumbnail(videoInfo.videoDetails.thumbnails.at(-1)?.url ?? '')
				.setFields(
					{ name: 'Sıraya eklenen video:', value: youtubeVideoData.title, inline: true },
					{ name: 'Video Süresi: ', value: secondsToString(videoInfo.videoDetails.lengthSeconds), inline: true },
				);
			await interaction.followUp({ embeds: [embed], ephemeral: false });
		}
	} else {
		await interaction.followUp({ content: 'Bu seçim artık geçerli değil ya. Yeniden arayabilirsin.', embeds: [], components: [], ephemeral: true });
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