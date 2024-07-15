import { Activity, Presence } from 'discord.js';
export { Spotify };

class Spotify {
	doesExist = false;
	songName = '';
	artistName = '';
	imageLink = '';
}

export function getSpotifyObject(userPresence:Presence): Spotify {
	const spotifyObj: Spotify = new Spotify;

	const spotifyActivity: Activity = userPresence.activities.find(obj => obj.type === 2) as Activity ?? null;
	if (spotifyActivity.name !== 'Spotify') {
		return spotifyObj;
	}

	let largeImageLink = '';
	if (spotifyActivity.assets != null) {
		if (spotifyActivity.assets.largeImage != null) {
			largeImageLink = `https://i.scdn.co/image/${spotifyActivity.assets.largeImage.replace('spotify:', '')}`;
		}
	}

	spotifyObj.doesExist = true;
	spotifyObj.songName = spotifyActivity.details as string;
	spotifyObj.artistName = spotifyActivity.state as string;
	spotifyObj.imageLink = largeImageLink;


	return spotifyObj;
}