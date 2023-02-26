import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

// TODO: a control to check if the member of this interaction is in the same voice channel.
async function execute(interaction: ChatInputCommandInteraction) {
	const guildId = interaction.guildId;
	if (!guildId) {
		interaction.reply({ content:'Bu komutu sadece sunucudan kullanabilirsin.', ephemeral: true });
		return;
	} else {
		const voiceChannel = (interaction.member as GuildMember).voice.channel;
		if (!voiceChannel) {
			interaction.reply({ content:'Bu komutu ses kanalına bağlanmadan kullanamazsın.', ephemeral: true });
			return;
		}
	}

	const queue = (interaction.client as DiscordClient).audioQueues.get(guildId);
	// If playing anything
	if (queue && !queue.isEmpty()) {
		const nextSong = queue.dequeue();
		if (nextSong) {
			const songName = nextSong.title;
			queue.play(interaction);
			await interaction.reply(`Tamamdır, sıradaki şarkımız: \`\`${songName}\`\``);
			return;
		}
	}
	await interaction.reply({ content: 'Eeee, geçecek bir şey yok.' });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gec')
		.setDescription('Sıradaki şarkıya geçelim!')
		.setDMPermission(false),
	execute: execute,
};