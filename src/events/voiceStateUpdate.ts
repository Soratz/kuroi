import { VoiceState } from 'discord.js';
import { followCreator } from './voiceStateUpdate/followCreator';


async function execute(oldState: VoiceState, newState: VoiceState) {
	// event function for following the creator in voice channel
	await followCreator(oldState, newState);
}

module.exports = {
	name: 'voiceStateUpdate',
	execute: execute,
};