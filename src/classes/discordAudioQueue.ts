import type { Readable } from 'stream';
import fluentFfmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core';
import type { Filter } from '@distube/ytdl-core';
import { YoutubeVideoData } from './youtubeSearch';
import { Queue } from './queue';
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState,
	getVoiceConnection, joinVoiceChannel, PlayerSubscription, VoiceConnectionStatus } from '@discordjs/voice';
import { ActivityType, Guild, GuildMember, Interaction } from 'discord.js';
import { settings } from '../config.json';
import { DiscordClient } from './discordClient';
import { readFileSync } from 'fs';

// So queue for songs, all songs must be inside this queue.
// Currently playing song must be at the beginning of the queue.
export class DiscordAudioQueue extends Queue<YoutubeVideoData> {
	audioPlayer: AudioPlayer;
	guildId: string;
	interaction: Interaction;
	loopEnabled: boolean;
	constructor(interaction: Interaction, maxLength: number = settings.maxQueueLength) {
		super(maxLength);
		// interaction that created this queue
		this.interaction = interaction;
		// guildId can't be null because this queue should only be called from a guild
		if (!interaction.inGuild()) throw Error('DiscordAudioQueue must be intialized by an in-guild interaction.');
		this.guildId = interaction.guildId as string;
		const currentChannel = (interaction.member as GuildMember).voice.channel;
		if (!currentChannel) throw Error('Interaction owner must be inside an voice channel.');
		// audioplayer object to play audio
		this.audioPlayer = this.initializeAudioPlayer();
		this.loopEnabled = false;
	}

	setLoop(loopEnabled: boolean) {
		this.loopEnabled = loopEnabled;
	}

	// seek is in milliseconds
	play(interaction: Interaction, seek = 0): PlayerSubscription | undefined {
		const voiceConnection = this.createOrGetVoiceConnection(interaction);
		if (voiceConnection) {
			const currentAudioData: YoutubeVideoData | undefined = this.peek();
			if (currentAudioData == undefined) {
				console.log('No audio to seek.');
				// destroy connection here
				voiceConnection.destroy();
				this.audioPlayer.stop();
				(this.interaction.client as DiscordClient).audioQueues.delete(this.guildId);
				return undefined;
			}
			let stream: Readable | any = this.createStream(currentAudioData);
			if (seek > 0) {
				// seeks to current song (i.e. song at the beginning of the queue) to the given time point as ms.
				stream = fluentFfmpeg({ source: stream }).toFormat('mp3').setStartTime(Math.ceil(seek / 1000));
			}
			const audioResource = createAudioResource(stream);
			this.audioPlayer.play(audioResource);
			this.audioPlayer.once('error', error => {
				console.error(`Error ${error.name}: ${error.message} with audioResource.`);
				console.error(`Error cause: ${error.cause}`);
				console.error(`Stack trace: ${error.prepareStackTrace}`);
				this.audioPlayer.stop();
			});
			return voiceConnection.subscribe(this.audioPlayer);
		}
		return undefined;
	}

	stop() {
		// close looping
		this.loopEnabled = false;
		const currentConnection = getVoiceConnection(this.guildId);
		// Destroy the connection if it still exists
		if (currentConnection) currentConnection.destroy();
	}

	// Todo: there can be a logging option for debug purposes.
	private initializeAudioPlayer(): AudioPlayer {
		const audioPlayer = createAudioPlayer();
		audioPlayer.on(AudioPlayerStatus.Playing, () => {
			console.log('The audio player has started playing at %s! Status: %s', this.guildId, audioPlayer.state.status);
			// TODO: This activity thing will be weird when bot is used in more than one server.
			(this.interaction.client as DiscordClient).setActivity(this.peek()?.title, ActivityType.Listening);
		});
		audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			console.log('The audio player is now idle at %s. Status: %s', this.guildId, audioPlayer.state.status);
			// Queue is empty so remove the queue and destroy the connection
			// Go to the next song
			if (!this.loopEnabled) this.dequeue();
			if (this.isEmpty()) {
				this.stop();
				(this.interaction.client as DiscordClient).setActivity('', undefined);
			} else {
				this.play(this.interaction);
			}
		});
		audioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
			// Just empty the queue when its autopaused
			this.empty();
			console.log('The audio player is now autopaused at %s. Status: %s', this.guildId, audioPlayer.state.status);
			const currentConnection = getVoiceConnection(this.guildId);
			// Destroy the connection
			if (currentConnection) currentConnection.destroy();
			(this.interaction.client as DiscordClient).setActivity('', undefined);
		});
		audioPlayer.on(AudioPlayerStatus.Paused, () => {
			// No need to empty the queue when manually paused.
			console.log('The audio player is now paused at %s. Status: %s', this.guildId, audioPlayer.state.status);
		});
		audioPlayer.on(AudioPlayerStatus.Buffering, () => {
			// Buffering
			console.log('The audio player is now buffering at %s. Status: %s', this.guildId, audioPlayer.state.status);
		});
		return audioPlayer;
	}

	// Creates or gets the already existing voice connection.
	// Todo: voice channel might be changed in the guild, there should be a control for that
	private createOrGetVoiceConnection(interaction: Interaction) {
		const prevConnection = getVoiceConnection(this.guildId);
		if (prevConnection) return prevConnection;
		// check if voice channel is joinable
		const guildMember = interaction.member as GuildMember;
		const voiceChannel = guildMember.voice.channel;
		if (voiceChannel && voiceChannel.joinable) {
			const connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: this.guildId,
				adapterCreator: (interaction.guild as Guild).voiceAdapterCreator,
			});
			// TODO: temporary fix for kuroi
			connection.on('stateChange', (oldState, newState) => {
				const oldNetworking = Reflect.get(oldState, 'networking');
				const newNetworking = Reflect.get(newState, 'networking');

				const networkStateChangeHandler = (oldNetworkState: any, newNetworkState: any) => {
					const newUdp = Reflect.get(newNetworkState, 'udp');
					clearInterval(newUdp?.keepAliveInterval);
				};

				oldNetworking?.off('stateChange', networkStateChangeHandler);
				newNetworking?.on('stateChange', networkStateChangeHandler);
			});
			connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
				try {
					await Promise.race([
						entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
						entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
					]);
					// Seems to be reconnecting to a new channel - ignore disconnect
				} catch (error) {
					// Seems to be a real disconnect which SHOULDN'T be recovered from
					console.log('Connection is destroyed due to some problems.');
					if (connection.state.status != VoiceConnectionStatus.Destroyed) {
						connection.destroy();
					}
					// empty the queue if connection got destroyed somehow
					this.empty();
				}
			});
			// Setting the last interaction to the property if a new connection is created
			this.interaction = interaction;
			return connection;
		}
		return undefined;
	}

	private createStream(videoData: YoutubeVideoData) {
		const filter: Filter = 'audioonly';
		const cookies = JSON.parse(readFileSync('src/yt-cookies.json', 'utf8'));
		const agent = ytdl.createAgent(cookies);
		const ytdl_options = {
			filter: filter,
			fmt: 'mp3',
			highWaterMark: 1 << 62,
			liveBuffer: 1 << 62,
			// disabling chunking is recommended in discord bot
			dlChunkSize: 0,
			bitrate: 128,
			agent: agent,
		};
		return ytdl(videoData.videoURL, ytdl_options);
	}
}