import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionReplyOptions, ChannelType } from 'discord.js';

const row = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('delete')
			.setLabel('Sil')
			.setStyle(ButtonStyle.Danger)
			.setDisabled(false),
		new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('İptal')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(false),
	)
;

async function execute(interaction: ChatInputCommandInteraction) {
	const deleteNumber = Math.floor(interaction.options.getNumber('sayı')!);
	await interaction.reply({
		content: `${interaction.user}, son yazılan **${deleteNumber}** mesajı silmek istediğine emin misin?`,
		components: [row],
	} as InteractionReplyOptions);
}

async function buttonExecute(interaction: ButtonInteraction) {
	// Check if clicked by same person. First variable gets user from message context.
	if (interaction.message.interaction && interaction.message.interaction.user.id != interaction.user.id) {
		interaction.reply({ content: 'Bu sorgu sizin için değil!', ephemeral: true });
		return;
	}

	await interaction.message.delete();
	if (interaction.customId == 'delete' && interaction.channel?.type == ChannelType.GuildText) {
		// Number is scooped from message by spliting bold (**) markers
		const deleteNumber = interaction.message.content.split('**')[1];
		await interaction.channel.bulkDelete(Number.parseInt(deleteNumber));
		console.log(`${interaction.user.tag} deleted ${deleteNumber} messages in channel #${interaction.channel.name}`);
	}
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('temizle')
		.setDescription('Girilen sayı kadar son yazılan mesajı sil.')
		.setDMPermission(false)
		// Permission check is made here. Change if higher permission level is wanted.
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addNumberOption(option =>
			option.setName('sayı')
				.setDescription('Silnecek mesaj sayısı?')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100),
		),
	execute: execute,
	buttonExecute: buttonExecute,
};