const { SlashCommandBuilder } = require('@discordjs/builders');
const { isMaster } = require('../utils/utils.js');
const { inspect } = require('util');

async function execute(interaction) {
	const creatorID = interaction.user.id;
	await interaction.deferReply();

	if (!isMaster(creatorID)) {
		await interaction.editReply('nope');
		return;
	}

	try {
		const command = interaction.options.getString('komut');
		let evaled = eval(command);

		if (typeof (evaled) !== 'string') {
			evaled = inspect(evaled);
		}
		await interaction.editReply(`\`\`\`xl\n${await clean(evaled)}\n\`\`\``);
	} catch (err) {
		await interaction.editReply(`\`ERROR DESU\` \`\`\`xl\n${await clean(err)}\n\`\`\``);
	}
	return;
}

async function clean(text) {
	if (typeof (text) === 'string') {
		return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
	} else {
		return text;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('arayuz')
		.setDescription('Arayüz komutu')
		.setDMPermission(true)
		.setDefaultMemberPermissions(1 << 3)
		.addStringOption(option =>
			option.setName('komut')
				.setRequired(true)
				.setDescription('Komutu yaz.')),
	execute: execute,
};