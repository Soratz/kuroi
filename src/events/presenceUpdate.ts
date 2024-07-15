import { Activity, Channel, Guild, GuildBasedChannel, GuildChannel, GuildManager, Presence, TextChannel, User } from "discord.js";
import { Spotify } from "../classes/spotifyPresence";

/*
Compare old and new presence to see change in activity
Mainly used for finding if there is newGame or newSong started to play
It's all posted in the Selfr -> #komut -> SpotifyLog & GameLog threads
*/
const { Events, EmbedBuilder } = require('discord.js');
const { spotifyThreadId, gameThreadId, komutChannelId, selfrID } = require('../config.json');
const { isTestBot } = require('../secret.json');
const { getSpotifyObject} = require('../classes/spotifyPresence');

let lastSpotifyUsername: string, lastSpotifyName: string, lastGameUsername: string, lastGameName: string;

async function execute(oldPresence: any, newPresence: any) {
	// If this is running in test bot (Amadeus or Kuroi) then bypass this function to don't cause duplicates in logs
	if (isTestBot == true) return;
	// Sometimes presence update gets triggered even if there is not one. Couldn't figure out why.
	if (!oldPresence) return;
	// Don't log bot activity
	if (oldPresence.user.bot) return;

	// Set presence owner user into variable. Will be used to get user's username and tag.
	let presenceOwner;
	if (oldPresence.guild) {
		presenceOwner = oldPresence.guild.members.cache.get(oldPresence.userId).user;
	}

	// SPOTIFY PART
	SpotifyLogger(oldPresence, newPresence, presenceOwner);

	// GAME PART
	GameLogger(oldPresence, newPresence, presenceOwner);

}

async function SpotifyLogger(oldPresence: Presence, newPresence: Presence, presenceOwner: User) {
	let oldSong: Spotify = getSpotifyObject(oldPresence);
	let newSong: Spotify = getSpotifyObject(newPresence);

	if ((oldSong != newSong) && newSong.doesExist) {
		// Fix of dupped logs
		if ((lastSpotifyUsername != presenceOwner.username) || (lastSpotifyName != newSong.songName)) {
			lastSpotifyUsername = presenceOwner.username;
			lastSpotifyName = newSong.songName;
			
			let usersGuild: Guild | undefined;
			if(oldPresence.client.guilds.cache.get(selfrID) != undefined)
				usersGuild = oldPresence.client.guilds.cache.get(selfrID) as Guild;

			let spotifyWriteChannel: TextChannel;
			if((usersGuild as Guild).channels.cache.get(komutChannelId) != undefined)
				spotifyWriteChannel = (usersGuild as Guild).channels.cache.get(komutChannelId) as TextChannel;

			let spotifyWriteThread: any;
			if( (spotifyWriteThread as TextChannel).threads.cache.get(spotifyThreadId) != undefined )
				spotifyWriteThread = 



			// Search the song using spotify default url build for searches. '%20' instead of blank spots.
			const spofiySearchLink = (newSong.songName + '%20' + newSong.artistName).replace(/\/|\\/g, '').split(' ').join('%20');
			const spotifyEmbed = new EmbedBuilder()
				.setColor(0x17B817)
				.setTitle(newSong.songName)
				.setURL(`https://open.spotify.com/search/${spofiySearchLink}`)
				.setAuthor({ name: presenceOwner.tag, iconURL: presenceOwner.avatarURL() })
				.setDescription(`*by* ${newSong.artistName}`)
				.setThumbnail(newSong.imageLink)
				.setTimestamp();

			spotifyChannel.send({ embeds: [spotifyEmbed] });
		}
	}
}

async function GameLogger(oldPresence: Presence, newPresence: Presence, presenceOwner: User) {
	let oldGame: Activity | null | string;
	if (oldPresence.activities != null) {
		oldGame = oldPresence.activities.find(obj => obj.type === 0) ?? null;
		if (oldGame != null) oldGame = oldGame.name;
	}
	let newGame: Activity | null | string;;
	if (newPresence.activities != null) {
		newGame = newPresence.activities.find(obj => obj.type === 0) ?? null;
		if (newGame != null) newGame = newGame.name;
	}
	if ((oldGame != newGame) && newGame) {
		// Fix of dupped logs
		if ((lastGameUsername != presenceOwner.username) || (lastGameName != newGame.name)) {
			lastGameUsername = presenceOwner.username;
			lastGameName = newGame.name;

			const gameChannel = oldPresence.client.guilds.cache.get(selfrID).channels.cache.get(komutChannelId)
				.threads.cache.get(gameThreadId);
			const gameEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(newGame)
			// .setURL('https://discord.js.org/') link for... something in future?
				.setAuthor({ name: presenceOwner.tag, iconURL: presenceOwner.avatarURL() })
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
