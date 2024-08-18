import { SlashCommandBuilder } from '@discordjs/builders';
import { isMaster } from '../utils/utils.js';
import { inspect } from 'util';
import { ChatInputCommandInteraction } from 'discord.js';


async function execute(interaction: ChatInputCommandInteraction) {
	const creatorID = interaction.user.id;
	await interaction.deferReply();

	if (!isMaster(creatorID)) {
		await interaction.editReply('nope');
		return;
	}

	try {
		const command = interaction.options.getString('komut');
		let evaled = eval(command!);

		if (typeof (evaled) !== 'string') {
			evaled = inspect(evaled);
		}
		await interaction.editReply(`\`\`\`xl\n${await clean(evaled)}\n\`\`\``);
	} catch (err: unknown) {
		if (err != null) {
			await interaction.editReply(`\`ERROR DESU\` \`\`\`xl\n${await clean(String(err))}\n\`\`\``);
		}
	}
	return;
}

async function clean(text: string) {
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