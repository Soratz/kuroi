// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { secret, clientId, selfrID } = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Pushing each command's JSON data to commands array.
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(secret);

(async () => {
	try {
		// Currently using empty commands for the guild (Self-Reflexivity) commands.
		await rest.put(Routes.applicationGuildCommands(clientId, selfrID), { body: [] });
		console.log('Successfully registered application guild commands.');

		// Currently only applying commands to global commands.
		await rest.put(Routes.applicationCommands(clientId), { body: commands });
		console.log('Successfully registered application commands.');
		for (const commandName of commandFiles) {
			console.log(' - %s', commandName);
		}
	} catch (error) {
		console.error(error);
	}
})();