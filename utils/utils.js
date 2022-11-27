const { VoiceConnectionStatus, entersState, getVoiceConnection, joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const { masterID } = require('../config.json');

// const ADD_QUOTE = 0;
// TODO: this ids belongs to a config file but currently WIP
const privilegedUserIDs = ['115464605676863492'];

function isPriveleged(userID) {
	const priveleged = privilegedUserIDs.some(PID => {
		if (PID === userID) {
			return true;
		}
		return false;
	});

	return priveleged;
}

function isMaster(userID) {
	return userID === masterID;
}

async function connectionSafeDestroyer(oldState, newState) {
	const guild = oldState.guild ?? newState.guild;
	if (!guild) {
		return;
	}
	const connection = getVoiceConnection(guild.id);
	try {
		await Promise.race([
			entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
			entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
		]);
		// Seems to be reconnecting to a new channel - ignore disconnect
	} catch (error) {
		// Seems to be a real disconnect which SHOULDN'T be recovered from
		connection.destroy();
	}
}

// Creates or gets the already existing voice connection.
async function createVoiceConnection(interaction) {
	const previos_conn = getVoiceConnection(interaction.guildId);
	if (previos_conn) {
		return previos_conn;
	}
	const voiceChannel = await isVoiceChannelJoinable(interaction);
	if (voiceChannel && voiceChannel.joinable) {
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: interaction.guildId,
			adapterCreator: interaction.guild.voiceAdapterCreator,
		});
		connection.on(VoiceConnectionStatus.Disconnected, connectionSafeDestroyer);
		return connection;
	}
	return null;
}

async function isVoiceChannelJoinable(interaction) {
	if (!interaction.inGuild()) {
		return null;
	}
	const guildMember = interaction.member;
	const voiceState = guildMember.voice;
	const voiceChannel = voiceState.channel;
	if (voiceChannel && voiceChannel.joinable) {
		return voiceChannel;
	}
	return null;
}

async function playResourceFromConnection(connection, player, audioResource) {
	player.play(audioResource);
	player.on('error', error => {
		console.error(`Error ${error.name}: ${error.message} with audioResource.`);
		console.error(`Error cause: ${error.cause}`);
		console.error(`Stack trace: ${error.prepareStackTrace}`);
		player.stop();
	});

	connection.subscribe(player);
	connection.onSubscriptionRemoved = (subscription) => {
		console.log('An audio player subscription is removed.');
	};
}

async function playResourceFromInteraction(interaction, audioResource, player = undefined) {
	const connection = await createVoiceConnection(interaction);
	if (!connection) {
		return;
	}
	if (!player) {
		player = createAudioPlayer();
	}
	await playResourceFromConnection(connection, player, audioResource);
	return player;
}

module.exports = {
	isMaster,
	isPriveleged,
	connectionSafeDestroyer,
	createVoiceConnection,
	playResourceFromInteraction,
	isVoiceChannelJoinable,
	playResourceFromConnection,
};