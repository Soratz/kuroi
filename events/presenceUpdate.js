/*
Compare old and new presence to see change in activity
Mainly used for finding if there is newGame or newSong started to play
It's all posted in the Selfr -> #komut -> SpotifyLog & GameLog threads
*/
const { Events, EmbedBuilder } = require('discord.js');
const { spotifyThreadId, gameThreadId, komutChannelId, selfrID } = require('../config.json');
const { isTestBot } = require('../secret.json');

let lastSpotifyUser, lastSpotifyName, lastGameUser, lastGameName;

async function execute(oldPresence, newPresence) {
	// If this is running in test bot (Amadeus or Kuroi) then bypass this function to don't cause duplicates in logs
	if (isTestBot == true) return;
	// Sometimes presence update gets triggered even if there is not one. Couldn't figure out why.
	if (!oldPresence) return;
	// Don't log bot activity
	if (oldPresence.user.bot) return;

	let presenceOwner;
	if (oldPresence.guild) {
		presenceOwner = oldPresence.guild.members.cache.get(oldPresence.userId).user;
	}

	// SPOTIFY PART
	let oldSong;
	if (oldPresence.activities != null) {
		oldSong = oldPresence.activities.find(obj => obj.type === 2) ?? null;
	}
	let newSong;
	if (newPresence.activities != null) {
		newSong = newPresence.activities.find(obj => obj.type === 2) ?? null;
	}

	if ((oldSong != newSong) && newSong) {
		// Make sure its spotify. In case discord adds another 'Listening' (type = 2) activity.
		if (newSong.name === 'Spotify') {
			// Fix of dupped logs
			if ((lastSpotifyUser != presenceOwner.username) || (lastSpotifyName != newSong.details)) {
				lastSpotifyUser = presenceOwner.username;
				lastSpotifyName = newSong.details;

				const spotifyChannel = oldPresence.client.guilds.cache.get(selfrID).channels.cache.get(komutChannelId)
					.threads.cache.get(spotifyThreadId);

				// Search the song using spotify default url build for searches. '%20' instead of blank spots.
				const spofiySearchLink = (newSong.details + '%20' + newSong.state).replace(/\/|\\/g, '').split(' ').join('%20');
				const spotifyEmbed = new EmbedBuilder()
					.setColor(0x17B817)
					.setTitle(newSong.details)
					.setURL(`https://open.spotify.com/search/${spofiySearchLink}`)
					.setAuthor({ name: presenceOwner.username, iconURL: presenceOwner.avatarURL() })
					.setDescription(`*by* ${newSong.state}`)
					.setThumbnail(`https://i.scdn.co/image/${newSong.assets.largeImage.replace('spotify:', '')}`)
					.setTimestamp();

				spotifyChannel.send({ embeds: [spotifyEmbed] });
			}

		}
	}

	// GAME PART
	let oldGame;
	if (oldPresence.activities != null) {
		oldGame = oldPresence.activities.find(obj => obj.type === 0) ?? null;
		if (oldGame != null) oldGame = oldGame.name;
	}
	let newGame;
	if (newPresence.activities != null) {
		newGame = newPresence.activities.find(obj => obj.type === 0) ?? null;
		if (newGame != null) newGame = newGame.name;
	}
	if ((oldGame != newGame) && newGame) {
		// Fix of dupped logs
		if ((lastGameUser != presenceOwner.username) || (lastGameName != newGame.name)) {
			lastGameUser = presenceOwner.username;
			lastGameName = newGame.name;

			const gameChannel = oldPresence.client.guilds.cache.get(selfrID).channels.cache.get(komutChannelId)
				.threads.cache.get(gameThreadId);
			const gameEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(newGame)
			// .setURL('https://discord.js.org/') link for... something in future?
				.setAuthor({ name: presenceOwner.username, iconURL: presenceOwner.avatarURL() })
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
