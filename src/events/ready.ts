import { DiscordClient } from '../classes/discordClient';

module.exports = {
	name: 'ready',
	once: true,
	execute(client: DiscordClient) {
		console.log(`Ready! Logged in as ${client.user!.tag}`);
	},
};