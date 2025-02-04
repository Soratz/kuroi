import mongoose, { ConnectOptions } from 'mongoose';
import { mongodbConnectionURL } from '../../secret.json';
import { BaseInteraction } from 'discord.js';

mongoose.set('strictQuery', true);
mongoose.connect(mongodbConnectionURL, { useNewUrlParser: true, useUnifiedTopology: true } as ConnectOptions)
	.then(() => {
		console.log('Successfully connected to MongoDB');
	})
	.catch(error => {
		console.error('Failed to connect to MongoDB:', error);
	});

const quotesSchema = new mongoose.Schema({
	quote: String,
	author: String,
	authorID: String,
	date: Date,
	imageURL: String,
	creatorID: String,
});

quotesSchema.methods.asString = async function(interaction: BaseInteraction) {
	let username = this.author;
	try {
		const authorUser = await interaction.client.users.fetch(this.authorID);
		if (authorUser) {
			username = authorUser.username;
		}
	} catch (error) {
		console.log('No author found for the id: ', this.authorID);
	}
	const date = this.date;
	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const day = ('0' + date.getDate()).slice(-2);
	const dateText = day + '.' + month + '.' + year;
	const text = `\`${this.quote}\`  - ${username}  *${dateText}*`;
	if (this.imageURL) {
		return text + ' Görsel: ' + this.imageURL;
	} else {
		return text;
	}
};

export const Quote = mongoose.model('Quote', quotesSchema);

module.exports = {
	Quote,
};