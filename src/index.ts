import { Client, Collection, IntentsBitField } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { secret } from "./secret.json";
import { generateDependencyReport } from "@discordjs/voice";
import { DiscordClient } from "./classes/discordClient";

console.log(generateDependencyReport());

// Create client intents
const intents = new IntentsBitField();
intents.add(
	IntentsBitField.Flags.GuildPresences,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.DirectMessages,
	IntentsBitField.Flags.GuildVoiceStates);

// Create a new client instance
const client: DiscordClient = new DiscordClient({ intents: intents });

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Reading command files
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the commands Collection.
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
	// Add button commands of slash commands if there is
	if ('buttonExecute' in command) {
		client.buttonCommands.set(command.data.name, command);
	}
}

// Reading event files.
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Login to Discord with your client's token
client.login(secret);