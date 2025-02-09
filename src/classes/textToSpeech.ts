import axios from 'axios';
import { Readable } from 'stream';

export async function textToSpeech(text: string, voice_clone: boolean) {
	const endpoint = voice_clone ? 'http://localhost:9872/tts_with_clone' : 'http://localhost:9872/tts';
	const source_voice = voice_clone ? 'af_heart' : null;
	try {
		const response = await axios.post(endpoint, { text, source_voice }, { responseType: 'arraybuffer' });
		const audioBuffer = Buffer.from(response.data);
		const audioStream = Readable.from(audioBuffer);
		return audioStream;

	} catch (error) {
		console.error('Error in textToSpeech:', error);
		return null;
	}
}

