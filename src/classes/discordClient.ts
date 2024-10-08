import { ActivityType, Client, ClientOptions, Collection, PresenceData } from 'discord.js';
import { DiscordAudioQueue } from './discordAudioQueue';

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

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
		this.contextMenuCommands = new Collection();
		this.buttonCommands = new Collection();
		this.audioQueues = new Collection();
	}

	setPresence(data: PresenceData) {
		const user = this.user;
		if (user) {
			user.setPresence(data);
		}
	}

	setActivity(name: string | undefined, type: ActivityType.Listening | ActivityType.Playing | ActivityType.Watching | undefined) {
		const user = this.user;
		if (user && name) {
			user.setActivity(name, { type: type });
		}
	}
}