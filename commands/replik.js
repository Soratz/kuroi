const { SlashCommandBuilder } = require('@discordjs/builders');
const { Quote } = require('../utils/db/schemas.js');
const { isPriveleged } = require('../utils/utils.js');

async function createQuote(quoteMessage, authorName, authorID, date, imageURL, creatorID) {
	const quote = new Quote({
		quote: quoteMessage,
		author: authorName,
		authorID: authorID,
		date: date,
		imageURL: imageURL,
		creatorID: creatorID,
	});

	await quote.save();
}

async function execute(interaction) {
	if (interaction.options.getSubcommand() === 'bak') {
		await interaction.deferReply();
		const quoteAuthorUser = interaction.options.getUser('kullanıcı');
		const context = interaction.options.getString('içerik');
		const query = { 'authorID': /.*/, 'quote': /.*/ };
		// any given context
		if (context) {
			query['quote'] = new RegExp(context, 'gmi');
		}
		// a selected user
		if (quoteAuthorUser) {
			query['authorID'] = quoteAuthorUser.id;
		}
		const count = await Quote.count(query);
		if (count == 0) {
			await interaction.editReply('Öyle bir replik yok sanırsam.');
			return;
		}
		const random = Math.floor(Math.random() * count);
		const quote = await Quote.findOne(query).skip(random).exec();
		if (!quote) {
			await interaction.editReply('Sana replik yok!');
			console.log('Related quote hasn\'t been found.');
			console.log('Query: ', query);
			console.log('Query count: ', count);
			return;
		}
		const quoteString = await quote.toString(interaction);
		await interaction.editReply(quoteString);
	} else if (interaction.options.getSubcommand() === 'ekle') {
		await interaction.deferReply();
		const creatorID = interaction.user.id;
		if (!isPriveleged(creatorID)) {
			await interaction.editReply('Sen kim replik eklemek?');
			return;
		}

		const quoteMessage = interaction.options.getString('replik');
		const authorUser = interaction.options.getUser('kullanıcı');
		const imageURL = interaction.options.getString('görsel');
		const date = interaction.createdAt;
		const authorName = authorUser.username;
		const authorID = authorUser.id;

		await createQuote(quoteMessage, authorName, authorID, date, imageURL, creatorID);
		await interaction.editReply('Replik eklendi.');
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('replik')
		.setDescription('Bakalım ne söylemişiz?')
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('bak')
				.setDescription('Rastgele bir kullanıcının veya belirttiğin birinin repliğine bak.')
				.addUserOption(option =>
					option.setName('kullanıcı')
						.setRequired(false)
						.setDescription('Replik sahibini seç.'))
				.addStringOption(option =>
					option.setName('içerik')
						.setRequired(false)
						.setDescription('Replik içeriğiyle ilgili bir şey yazabilirsin.')))
		.addSubcommand(subcommand =>
			subcommand.setName('ekle')
				.setDescription('Bir kullanıcı için replik ekle.')
				.addUserOption(option =>
					option.setName('kullanıcı')
						.setRequired(true)
						.setDescription('Replik sahibini seç.'))
				.addStringOption(option =>
					option.setName('replik')
						.setRequired(true)
						.setDescription('Repliği yaz.'))
				.addStringOption(option =>
					option.setName('görsel')
						.setRequired(false)
						.setDescription('Eğer bir görsel varsa linkini ekleyebilirsin.'))),
	execute: execute,
};