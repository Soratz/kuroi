import { ActivityType, Client, ClientOptions, Collection, PresenceData, VoiceChannel } from 'discord.js';
import { DiscordAudioQueue } from './discordAudioQueue';
import { existsSync, readFileSync } from 'fs';
import { Cookie } from '@distube/ytdl-core';
import { decodeHtmlEntities } from '../utils/string_utils';
import { AudioPlayer, AudioResource, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { createAudioPlayer } from '@discordjs/voice';
import * as path from 'path';
import internal from 'stream';
import { ReminderManager } from './reminder';

export { DiscordClient };

// Wrapper class for client
class DiscordClient extends Client {
	// Attaching commands to client to access it from the client instance from other files.
	// TODO: any can be changed to a command class
	commands: Collection<string, any>;
	contextMenuCommands: Collection<string, any>;
	buttonCommands: Collection<string, any>;
	// A collection of discord audio queues for each server.
	audioQueues: Collection<string, DiscordAudioQueue>;
	fileAudioPlayers: Collection<string, AudioPlayer>;
	weakConnections: WeakSet<VoiceConnection>;
	reminderManager: ReminderManager;
	cookies: Cookie[];
	follow: boolean;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
		this.contextMenuCommands = new Collection();
		this.buttonCommands = new Collection();
		this.audioQueues = new Collection();
		this.fileAudioPlayers = new Collection();
		this.weakConnections = new WeakSet<VoiceConnection>();
		this.reminderManager = new ReminderManager();
		this.cookies = this.loadCookies();
		this.follow = true;
		this.setupCleanup();
	}

	private loadCookies(): Cookie[] {
		try {
			const cookies = JSON.parse(readFileSync('src/yt-cookies.json', 'utf8'));
			return cookies;
		} catch (error) {
			console.warn('Failed to load YouTube cookies:', error);
			return [];
		}
	}

	// Creates or gets the already existing voice connection.
	createOrGetVoiceConnection(voiceChannel: VoiceChannel | undefined) {
		if (!voiceChannel) return undefined;
		const prevConnection = getVoiceConnection(voiceChannel.guild.id);
		if (prevConnection && prevConnection.state.status != VoiceConnectionStatus.Destroyed && prevConnection.joinConfig.channelId == voiceChannel.id) {
			console.log('Voice connection already exists for guild:', voiceChannel.guild.id);
			return prevConnection;
		}
		// check if voice channel is joinable
		if (voiceChannel && voiceChannel.joinable) {
			const connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: voiceChannel.guild.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
				selfDeaf: false,
			});
			// if connection is already in the weak set, return it
			// this is to prevent adding multiple listeners on the same connection
			if (this.weakConnections.has(connection)) return connection;
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
					console.log('Connection is destroyed due to some problems. Error:', error);
					if (connection.state.status != VoiceConnectionStatus.Destroyed) {
						connection.destroy();
					}
					// empty the queue if connection got destroyed somehow
					this.audioQueues.get(voiceChannel.guild.id)?.empty();
				}
			});
			this.weakConnections.add(connection);
			return connection;
		}
		return undefined;
	}


	playAudioFile(voiceChannel: VoiceChannel, audioResource: string | internal.Readable) {
		// check if a player is already exists for a server
		let resource: AudioResource<unknown>;
		if (typeof audioResource === 'string') {
			const filePath = path.join(__dirname, '..', '..', 'resources', 'audio', audioResource);
			if (!existsSync(filePath)) {
				throw new Error(`Audio file not found: ${filePath}`);
			}
			resource = createAudioResource(filePath);

		} else {
			resource = createAudioResource(audioResource);
		}
		let player = this.fileAudioPlayers.get(voiceChannel.guild.id);
		if (player) {
			player.play(resource);
		} else {
			player = createAudioPlayer();
			this.fileAudioPlayers.set(voiceChannel.guild.id, player);
			player.play(resource);
		}
		const voiceConnection = this.createOrGetVoiceConnection(voiceChannel);
		if (voiceConnection) {
			voiceConnection.subscribe(player);
			return voiceConnection;
		} else {
			console.log('No voice connection found for voice channel:', voiceChannel.id);
			player.stop(true);
			return undefined;
		}
	}


	setPresence(data: PresenceData) {
		const user = this.user;

		if (user) {
			user.setPresence(data);
		}
	}

	setActivity(name: string | undefined, type: ActivityType.Listening | ActivityType.Playing | ActivityType.Watching | undefined) {
		if (name) {
			name = decodeHtmlEntities(name);
			const user = this.user;
			if (user && name) {
				user.setActivity(name, { type: type });
			}
		}
	}

	setupCleanup() {
		// Handle normal exit
		process.on('exit', async (code) => await this.cleanup());

		// Handle uncaught exceptions
		process.on('uncaughtException', async (error) => {
			console.error('Uncaught Exception:', error);
			await this.cleanup();
		});

		// Handle unhandled promise rejections
		process.on('unhandledRejection', async (error) => {
			console.error('Unhandled Rejection:', error);
			await this.cleanup();
		});
	}

	private async cleanup() {
		console.log('Cleaning up before exit...');
		try {
			// Send all pending reminders
			await this.reminderManager.remindAll();
		} catch (error) {
			console.error('Error sending reminders:', error);
		}
	}
}