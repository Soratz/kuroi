/* eslint-disable @typescript-eslint/no-var-requires */
// Clears all commands imported to discord. Most used in test bots to clear duplicated commands after testing.

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { clientId, secret } = require('./secret.json');
const { selfrID } = require('./config.json');


const rest = new REST({ version: '10' }).setToken(secret);

(async () => {
	try {
		// Currently using empty commands for the guild (Self-Reflexivity) commands.
		await rest.put(Routes.applicationGuildCommands(clientId, selfrID), { body: [] });
		console.log('Successfully cleared application guild commands.');

		// Currently only applying commands to global commands.
		await rest.put(Routes.applicationCommands(clientId), { body: [] });
		console.log('Successfully cleared application commands.');
		console.log('Registering completed.');
	} catch (error) {
		console.error(error);
	}
	console.log('End of script.');
})();