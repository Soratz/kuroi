import { APISelectMenuOption, Collection } from 'discord.js';
import fetch from 'node-fetch';
import ytdl from 'ytdl-core';
import { youtubeApiKey } from '../secret.json';
const youtubeQueryURL = 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&regionCode=GB&type=video,playlist&q=${queryString}&key=${youtubeApiKey}';
const playlistItemsUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=50&key=${youtubeApiKey}';

export enum YoutubeSearchType {
	Video = 'youtube#video',
	Playlist = 'youtube#playlist',
	Channel = 'youtube#channel'
}

export enum TypeEmojis {
	Video = '🎬',
	Playlist = '🎞️',
	Channel = '🎫',
	Unknown = '❓'
}

export class YoutubeSearchData {
	readonly title: string;
	readonly description: string;
	readonly id: string;
	readonly type: string;

	constructor(title: string, description: string, id: string, type: string) {
		this.title = title;
		this.description = description;
		this.id = id;
		this.type = type;
	}

	static getEmojiByType(emoji: string): string {
		switch (emoji) {
		case TypeEmojis.Video:
			return YoutubeSearchType.Video;
		case TypeEmojis.Playlist:
			return YoutubeSearchType.Playlist;
		case TypeEmojis.Channel:
			return YoutubeSearchType.Channel;
		default:
			return 'Unknown';
		}
	}

	static getTypeByEmoji(type: string): string {
		switch (type) {
		case YoutubeSearchType.Video:
			return TypeEmojis.Video;
		case YoutubeSearchType.Playlist:
			return TypeEmojis.Playlist;
		case YoutubeSearchType.Channel:
			return TypeEmojis.Channel;
		default:
			return TypeEmojis.Unknown;
		}
	}

	getStringMenuOption(): APISelectMenuOption {
		return {
			label: this.title,
			description: this.description,
			value: this.id,
			emoji: {
				name: YoutubeSearchData.getTypeByEmoji(this.type),
			},
		};
	}
}

// Todo: might add extra options if necessary
export class YoutubeVideoData extends YoutubeSearchData {
	readonly videoURL: string;
	private ytdlInfo?: ytdl.videoInfo;
	constructor(title: string, channelTitleDesc: string, videoId: string) {
		super(title, channelTitleDesc, videoId, YoutubeSearchType.Video);
		this.videoURL = 'https://www.youtube.com/watch?v=' + this.id;
	}

	async getInfo() {
		if (!this.ytdlInfo) this.ytdlInfo = await ytdl.getInfo(this.videoURL);
		return this.ytdlInfo;
	}
}

export async function getYoutubePlaylistVideos(playlistId: string): Promise<Collection<string, YoutubeVideoData>> {
	const encodedPlaylistItemsUrl = encodeURI(playlistItemsUrl.replace('${playlistId}', playlistId).replace('${youtubeApiKey}', youtubeApiKey));
	const response = await fetch(encodedPlaylistItemsUrl);
	if (response.status != 200 || !response.ok) {
		throw new Error(`Error at playlist items HTTP request! status: ${response.status}`);
	}
	const result = await response.json();
	const videoData: Collection<string, YoutubeVideoData> = new Collection();
	for (const item of result.items) {
		if (item.kind == 'youtube#playlistItem') {
			const data = createVideoDataFromPlaylistItem(item);
			videoData.set(data.id, data);
		}
	}
	return videoData;
}

export async function youtubeSearch(query: string): Promise<Collection<string, YoutubeSearchData>> {
	const encodedVideoQueryUrl = encodeURI(youtubeQueryURL.replace('${queryString}', query).replace('${youtubeApiKey}', youtubeApiKey));
	const response = await fetch(encodedVideoQueryUrl);
	if (response.status != 200 || !response.ok) {
		throw new Error(`Error at search query HTTP reqeust! status: ${response.status}`);
	}
	const result = await response.json();
	const videoData: Collection<string, YoutubeSearchData> = new Collection();
	for (const item of result.items) {
		if (item.kind == 'youtube#searchResult') {
			const data = createVideoDataFromSearchResult(item);
			videoData.set(data.id, data);
		}
	}
	return videoData;
}

function createVideoDataFromPlaylistItem(playlistItem: any): YoutubeVideoData {
	const title = playlistItem.snippet.title.slice(0, 99);
	const channelTitle = 'Kanal: ' + playlistItem.snippet.channelTitle;
	const id = playlistItem.snippet.resourceId.videoId;
	return new YoutubeVideoData(title, channelTitle, id);
}

function createVideoDataFromSearchResult(searchResultItem: any): YoutubeSearchData {
	const title = searchResultItem.snippet.title.slice(0, 99);
	let description = 'Kanal: ' + searchResultItem.snippet.channelTitle;
	const idType = searchResultItem.id.kind;
	let id = null;
	if (idType == YoutubeSearchType.Video) {
		id = searchResultItem.id.videoId;
	} else if (idType == YoutubeSearchType.Playlist) {
		id = searchResultItem.id.playlistId;
		description = 'Oynatma listesi - ' + description;
	} else if (idType == YoutubeSearchType.Channel) {
		id = searchResultItem.id.channelId;
	}
	return new YoutubeSearchData(title, description, id, idType);
}
