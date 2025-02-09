import axios from 'axios';
import { Readable } from 'stream';

export async function textToSpeech(text: string) {
	try {
		const response = await axios.post('http://localhost:9872/tts_with_clone', { text }, { responseType: 'arraybuffer' });
		const audioBuffer = Buffer.from(response.data);
		const audioStream = Readable.from(audioBuffer);
		return audioStream;
	} catch (error) {
		console.error('Error in textToSpeech:', error);
		return null;
	}
}

