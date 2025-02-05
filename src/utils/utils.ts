import { VoiceConnectionStatus, entersState, getVoiceConnection, VoiceConnectionState } from '@discordjs/voice';
import { masterIDs } from '../config.json';
import { Guild } from 'discord.js';

// TODO: Either migrate commented functions to typescript or remove them.

// const ADD_QUOTE = 0;
// TODO: this ids belongs to a config file but currently WIP
const privilegedUserIDs = ['115464605676863492'];

export function isPriveleged(userID: string) {
	const priveleged = privilegedUserIDs.some(PID => {
		if (PID === userID) {
			return true;
		}
		return false;
	});

	return priveleged;
}

export function isMaster(userID: string): boolean {
	return masterIDs.includes(userID);
}

export async function connectionSafeDestroyer(oldState: VoiceConnectionState, newState: VoiceConnectionState) {
	let guild: Guild;
	if ('guild' in oldState) {
		guild = oldState.guild as Guild;
	} else if ('guild' in newState) {
		guild = newState.guild as Guild;
	} else {
		return;
	}

	const connection = getVoiceConnection(guild.id);
	if (!connection) {
		return;
	}

	try {
		await Promise.race([
			entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
			entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
		]);
		// Seems to be reconnecting to a new channel - ignore disconnect
	} catch (error) {
		// Seems to be a real disconnect which SHOULDN'T be recovered from
		console.log('Connection is destroyed due to some problems. Error:', error);
		connection.destroy();
	}
}

// -- This function is not migrated to typescript as its not used anywhere.
// Creates or gets the already existing voice connection.
// async function createVoiceConnection(interaction) {
// 	const previos_conn = getVoiceConnection(interaction.guildId);
// 	if (previos_conn) {
// 		return previos_conn;
// 	}
// 	const voiceChannel = await isVoiceChannelJoinable(interaction);
// 	if (voiceChannel && voiceChannel.joinable) {
// 		const connection = joinVoiceChannel({
// 			channelId: voiceChannel.id,
// 			guildId: interaction.guildId,
// 			adapterCreator: interaction.guild.voiceAdapterCreator,
// 		});
// 		connection.on(VoiceConnectionStatus.Disconnected, connectionSafeDestroyer);
// 		return connection;
// 	}
// 	return null;
// }

// async function isVoiceChannelJoinable(interaction) {
// 	if (!interaction.inGuild()) {
// 		return null;
// 	}
// 	const guildMember = interaction.member;
// 	const voiceState = guildMember.voice;
// 	const voiceChannel = voiceState.channel;
// 	if (voiceChannel && voiceChannel.joinable) {
// 		return voiceChannel;
// 	}
// 	return null;
// }

// async function playResourceFromConnection(connection, player, audioResource, queue) {
// 	player.play(audioResource);
// 	player.once('error', error => {
// 		console.error(`Error ${error.name}: ${error.message} with audioResource.`);
// 		console.error(`Error cause: ${error.cause}`);
// 		console.error(`Stack trace: ${error.prepareStackTrace}`);
// 		player.stop();
// 	});

// 	connection.subscribe(player);
// 	connection.onSubscriptionRemoved = (subscription) => {
// 		console.log('An audio player subscription is removed.');
// 		// clean the queue if there is something when a subscription is broken.
// 		if (queue) {
// 			queue.empty();
// 		}
// 	};
// }

// -- This function is not migrated to typescript as its not used anywhere.
// async function playResourceFromInteraction(interaction, audioResource, player = undefined) {
// 	const connection = await createVoiceConnection(interaction);
// 	if (!connection) {
// 		return;
// 	}
// 	if (!player) {
// 		player = createAudioPlayer();
// 	}
// 	await playResourceFromConnection(connection, player, audioResource);
// 	return player;
// }

export function secondsToString(secondsStr: string | number) {
	let secondsNum: number;
	if (typeof secondsStr === 'string') {
		secondsNum = parseInt(secondsStr, 10);
	} else {
		secondsNum = secondsStr;
	}
	const hours = Math.floor(secondsNum / 3600);
	const minutes = Math.floor((secondsNum % 3600) / 60);
	const seconds = secondsNum % 60;
	let timeString = `${seconds} saniye`;
	if (minutes) { timeString = `${minutes} dakika ` + timeString; }
	if (hours) { timeString = `${hours} saat ` + timeString; }
	return timeString;
}

module.exports = {
	isMaster,
	isPriveleged,
	connectionSafeDestroyer,
	// createVoiceConnection,
	// playResourceFromInteraction,
	// isVoiceChannelJoinable,
	// playResourceFromConnection,
	secondsToString,
};