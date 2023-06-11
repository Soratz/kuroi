import { SlashCommandBuilder, EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.deferReply({ ephemeral: true });

	const command = interaction.options.getString('komut');
	if (command) {
		PrintCommandDetail(interaction, command);
	} else {
		PrintCommandsList(interaction);
	}
}

async function PrintCommandsList(interaction: ChatInputCommandInteraction) {
	// Adds all "client.commands.data.name" names in a string
	let commandString = '';
	const client = interaction.client as DiscordClient;
	client.commands.forEach(element => {
		commandString += '\n' + element.data.name.toString();
	});

	const commandListEmbed = new EmbedBuilder()
		.setColor(0xFFFFFF)
		.setDescription('Komut listesi aşağıda verilmiştir. Daha ayrıntılı açıklama için "/help <komut ismi>" olarak arama yapınız.')
		.addFields(
			{ name: 'Komutlar', value: commandString },
		)
	;

	interaction.editReply({ embeds: [commandListEmbed] });
}

// TODO: use a type for command
async function PrintCommandDetail(interaction: ChatInputCommandInteraction, command: any) {
	const client = interaction.client as DiscordClient;
	// Check if given command exist
	if (client.commands.has(command)) {
		const detail = client.commands.get(command).help;
		// Check if help data is included in command
		if (detail) {
			const commandDetailEmbed = new EmbedBuilder()
				.setColor(0xFFFFFF)
				.setTitle(command)
				.setDescription(detail)
			;

			interaction.editReply({ embeds: [commandDetailEmbed] });
		// Post warning if help description is not included in command data.
		} else {
			interaction.editReply('Bu komut için help açıklaması girilmemiş. Lütfen yetkililere bildirin.');
			console.log(`Help data of **${command}** does not exist.`);
		}
	// If given command doesn't exist.
	} else {
		interaction.editReply('Böyle bir komut yok. Komut listesi için sadece "/help" komutunu kullanın.');
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Tüm komutların listesini gör ve spesifik komutların nasıl çalıştığını öğren.')
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('komut')
				.setRequired(false)
				.setDescription('Nasıl kullandığını öğrnemk istediğin komutu yaz.')),
	execute: execute,
	help: 'Deneme help açıklaması',
};