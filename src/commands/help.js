const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

async function execute(interaction) {
	await interaction.deferReply({ ephemeral: true });

	const command = interaction.options.getString('komut');
	if (command) {
		PrintCommandDetail(interaction, command);
	} else {
		PrintCommandsList(interaction);
	}
}

async function PrintCommandsList(interaction) {
	// Adds all "client.commands.data.name" names in a string
	let commandString = '';
	interaction.client.commands.forEach(element => {
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

async function PrintCommandDetail(interaction, command) {
	// Check if given command exist
	if (interaction.client.commands.has(command)) {
		const detail = interaction.client.commands.get(command).help;
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