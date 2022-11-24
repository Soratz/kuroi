const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, IntentsBitField } = require('discord.js');
const { secret } = require('./config.json');
const { generateDependencyReport } = require('@discordjs/voice');

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
const client = new Client({ intents: intents });

// Attaching commands to client to access it from the client instance from other files.
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the commands Collection.
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
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