import gTTS from 'gtts';
import { Readable } from 'stream';

export class GTTSClient {
  private language: string;

  constructor(language: string = 'pt-br') {
    this.language = language;
  }

  public async convertTextToAudio(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const gtts = new gTTS(text, this.language);
        const chunks: Buffer[] = [];

        const stream = gtts.stream();
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          if (audioBuffer.length === 0) {
            reject(new Error('Generated audio buffer is empty'));
            return;
          }
          resolve(audioBuffer);
        });
        stream.on('error', (err: Error) => {
          console.error('Error converting text to audio:', err);
          reject(err);
        });
      } catch (err) {
        console.error('Error initializing gTTS:', err);
        reject(err);
      }
    });
  }
}
