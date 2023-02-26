import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';

export const data = new SlashCommandBuilder()
	.setName('döngü')
	.setDescription('Çaldığım parçayı döngüye alalım mı?')
	.setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
	const client = interaction.client as DiscordClient;
	const queue = client.audioQueues.get(interaction.guildId as string);
	if (queue && !queue.isEmpty()) {
		queue.setLoop(!queue.loopEnabled);
		if (queue.loopEnabled) {
			await interaction.reply({ content: ':repeat: Döngü aktifleştirildi.', ephemeral: false });
		} else {
			await interaction.reply({ content: ':arrow_heading_down: Döngü devre dışı bırakıldı.', ephemeral: false });
		}
	} else {
		await interaction.reply({ content: ':x: Şu an bir şarkı çalmıyor.', ephemeral: true });
	}
	return;
}
