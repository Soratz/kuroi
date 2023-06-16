import { APISelectMenuOption, Collection } from 'discord.js';
import fetch from 'node-fetch';
import ytdl from 'ytdl-core';
import { youtubeQueryURL } from '../secret.json';

export async function youtubeSearch(query: string): Promise<Collection<string, YoutubeVideoData>> {
	const videoQueryURL = encodeURI(youtubeQueryURL.replace('${queryString}', query));
	const response = await fetch(videoQueryURL);
	if (response.status != 200 || !response.ok) {
		throw new Error(`Error! status: ${response.status}`);
	}
	const result = await response.json();
	const videoData: Collection<string, YoutubeVideoData> = new Collection();
	for (const item of result.items) {
		if (item.kind == 'youtube#searchResult') {
			const data = createVideoDataFromSearchResult(item);
			videoData.set(data.videoId, data);
		}
	}
	return videoData;
}

function createVideoDataFromSearchResult(searchResultItem: any): YoutubeVideoData {
	const title = searchResultItem.snippet.title.slice(0, 99);
	const channelTitle = 'Kanal: ' + searchResultItem.snippet.channelTitle;
	const videoId = searchResultItem.id.videoId;
	return new YoutubeVideoData(title, channelTitle, videoId);
}

// Todo: might add extra options
export class YoutubeVideoData {
	readonly title: string;
	readonly description: string;
	readonly videoId: string;
	readonly videoURL: string;
	private ytdlInfo?: ytdl.videoInfo;
	constructor(title: string, channelTitleDesc: string, videoId: string) {
		this.title = title;
		this.description = channelTitleDesc;
		this.videoId = videoId;
		this.videoURL = 'https://www.youtube.com/watch?v=' + this.videoId;
	}

	getStringMenuOption(): APISelectMenuOption {
		return {
			label: this.title,
			description: this.description,
			value: this.videoId,
		};
	}

	async getInfo() {
		if (!this.ytdlInfo) this.ytdlInfo = await ytdl.getInfo(this.videoURL);
		return this.ytdlInfo;
	}
}
