import { DiscordClient } from '../../classes/discordClient';
import { VoiceChannel, VoiceState } from 'discord.js';
import { creatorId } from '../../config.json';
import { getVoiceConnection } from '@discordjs/voice';

function destroyVoiceConnection(client: DiscordClient, guildId: string) {
	const audioPlayer = client.fileAudioPlayers.get(guildId);
	if (audioPlayer) {
		getVoiceConnection(guildId)?.destroy();
		audioPlayer.stop();
	}
}


export async function followCreator(oldState: VoiceState, newState: VoiceState) {
	const client = newState.client as DiscordClient;
	try {
		if (client.follow) {
			if (newState.member && newState.member.id === creatorId) {
				const creatorsNewVoiceChannel = newState.channel;
				const clientUser = newState.guild.members.me;
				if (!clientUser) return;

				if (creatorsNewVoiceChannel) {
					// join the creator's voice channel if there is one
					if (clientUser.voice.channelId !== creatorsNewVoiceChannel.id) {
						if (clientUser.voice.channelId) {
							// destroy previous voice connection
							destroyVoiceConnection(client, newState.guild.id);
						}
						client.playAudioFile(newState.channel as VoiceChannel, 'hai.mp3');
					}

				} else {
					// if the creator is not in a voice channel and the bot is in the previous voice channel, leave the voice channel
					destroyVoiceConnection(client, oldState.guild.id);
					await clientUser.voice.setChannel(null);
					// add a control to check if something is being played in queue or something like that.
				}
			}
		}
	} catch (error) {
		console.error('Error on following the creator:', error);
	}
}
