/*
Compare old and new presence to see change in activity
Mainly used for finding if there is newGame or newSong started to play
It's all posted in the Selfr -> #komut -> SpotifyLog & GameLog threads
*/
import { Activity, BaseGuildTextChannel, Guild, Presence, TextChannel, User } from 'discord.js';
import { Spotify } from '../classes/spotifyPresence';
import { Events, EmbedBuilder } from 'discord.js';
import { spotifyThreadId, gameThreadId, komutChannelId, selfrID } from '../config.json';
import { isTestBot } from '../secret.json';
import { getSpotifyObject } from '../classes/spotifyPresence';

let lastSpotifyUsername: string, lastSpotifyName: string, lastGameUsername: string, lastGameName: string;

async function execute(oldPresence: Presence, newPresence: Presence) {
	// If this is running in test bot (Amadeus or Kuroi) then bypass this function to don't cause duplicates in logs
	if (isTestBot == true) return;
	// Sometimes presence update gets triggered without oldpresence. Don't track these.
	if (!oldPresence) return;
	// For now don't do anything if presence doesn't have user field
	if (oldPresence.user == null) return;
	// For now don't do anything if presence doesn't have guild field
	if (newPresence.guild == undefined) return;
	// Don't log bot activity
	if (oldPresence.user.bot) return;

	// Set presence owner user into variable. Will be used to get user's username and tag.
	let presenceOwner;
	if (oldPresence.guild) {
		presenceOwner = oldPresence.guild.members.cache.get(oldPresence.userId)?.user;
		if (presenceOwner) {
			// SPOTIFY PART
			SpotifyLogger(oldPresence, newPresence, presenceOwner);
			// GAME PART
			GameLogger(oldPresence, newPresence, presenceOwner);
		}
	}


}

async function SpotifyLogger(oldPresence: Presence, newPresence: Presence, presenceOwner: User) {
	const oldSong: Spotify = getSpotifyObject(oldPresence);
	const newSong: Spotify = getSpotifyObject(newPresence);

	if ((oldSong != newSong) && newSong.doesExist) {
		// Fix of dupped logs
		if ((lastSpotifyUsername != presenceOwner.username) || (lastSpotifyName != newSong.songName)) {
			lastSpotifyUsername = presenceOwner.username;
			lastSpotifyName = newSong.songName;

			let usersGuild: Guild | undefined;
			if (oldPresence.client.guilds.cache.get(selfrID) != undefined) {
				usersGuild = oldPresence.client.guilds.cache.get(selfrID) as Guild;
			}

			let spotifyWriteChannel: TextChannel;
			if ((usersGuild as Guild).channels.cache.get(komutChannelId) != undefined) {
				spotifyWriteChannel = (usersGuild as Guild).channels.cache.get(komutChannelId) as TextChannel;
			}

			let spotifyWriteThread: any;
			if ((spotifyWriteThread as TextChannel).threads.cache.get(spotifyThreadId) != undefined) {
				spotifyWriteThread = (spotifyWriteThread as TextChannel).threads.cache.get(spotifyThreadId);
			}


			// Search the song using spotify default url build for searches. '%20' instead of blank spots.
			const spofiySearchLink = (newSong.songName + '%20' + newSong.artistName).replace(/\/|\\/g, '').split(' ').join('%20');
			const spotifyEmbed = new EmbedBuilder()
				.setColor(0x17B817)
				.setTitle(newSong.songName)
				.setURL(`https://open.spotify.com/search/${spofiySearchLink}`)
				.setAuthor({ name: presenceOwner.tag, iconURL: presenceOwner.avatarURL() ?? undefined })
				.setDescription(`*by* ${newSong.artistName}`)
				.setThumbnail(newSong.imageLink)
				.setTimestamp();

			spotifyWriteThread.send({ embeds: [spotifyEmbed] });
		}
	}
}

async function GameLogger(oldPresence: Presence, newPresence: Presence, presenceOwner: User) {
	let oldGame: Activity | null | string = null;
	if (oldPresence.activities != null) {
		oldGame = oldPresence.activities.find(obj => obj.type === 0) ?? null;
		if (oldGame != null) oldGame = oldGame.name;
	}

	let newGame: Activity | null | string = null;
	if (newPresence.activities != null) {
		newGame = newPresence.activities.find(obj => obj.type === 0) ?? null;
		if (newGame != null) newGame = newGame.name;
	}
	if ((oldGame != newGame) && newGame) {
		// Fix of dupped logs
		if ((lastGameUsername != presenceOwner.username) || (lastGameName != newGame)) {
			lastGameUsername = presenceOwner.username;
			lastGameName = newGame;

			const gameChannel = oldPresence.client.guilds.cache.get(selfrID)?.channels.cache.get(komutChannelId) as BaseGuildTextChannel;
			if (gameChannel == undefined) {
				console.log('Can\'t find game channel to send game state change.');
				return;
			}
			const gameThread = gameChannel.threads.cache.get(gameThreadId);
			if (gameThread == undefined) {
				console.log('Can\'t find game thread to send game state change.');
				return;
			}
			const gameEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(newGame)
			// .setURL('https://discord.js.org/') link for... something in future?
				.setAuthor({ name: presenceOwner.tag, iconURL: presenceOwner.avatarURL() ?? undefined })
			// .setDescription('Started playing.')
			// .setThumbnail(newGame.assets.largeImage) couldn't pull game image from activity
				.setTimestamp();

			gameChannel.send({ embeds: [gameEmbed] });
		}

	}
}

module.exports = {
	name: Events.PresenceUpdate,
	execute: execute,
};
