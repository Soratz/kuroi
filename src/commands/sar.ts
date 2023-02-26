import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordClient } from '../classes/discordClient';
import { secondsToString } from '../utils/utils';

// TODO: voice channelda olma kontrolü yapılabilir (çağıran kullanıcı için)
export const data = new SlashCommandBuilder()
	.setName('sar')
	.setDescription('Çaldığım ses parçasının istediğin bir saniyesine sarabilirsin.')
	.setDMPermission(false)
	.addIntegerOption(option =>
		option.setName('saniye')
			.setDescription('Parçayı saracağınız ses parçasını giriniz.')
			.setRequired(true)
			.setMinValue(0)
			.setMaxValue(1000000000));

export async function execute(interaction: ChatInputCommandInteraction) {
	const seconds = interaction.options.getInteger('saniye');
	if (seconds != null) {
		const timeString = secondsToString(seconds);
		const client = interaction.client as DiscordClient;
		const queue = client.audioQueues.get(interaction.guildId as string);
		if (queue && !queue.isEmpty()) {
			queue.play(interaction, seconds * 1000);
		}
		await interaction.reply({ content: `:fast_forward: Şarkı ${timeString} noktasına sarıldı.`, ephemeral: false });
	} else {
		await interaction.reply({ content: 'Sanırsam saramayacağız.', ephemeral: false });
	}
	return;
}
