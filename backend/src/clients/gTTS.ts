// @ts-ignore
import gTTS from 'gtts'
import { Readable } from 'stream'

export class GTTSClient {
  private language: string

  constructor(language: string = 'de') {
    this.language = language
  }

  public async convertTextToAudio(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gtts = new gTTS(text, this.language)
      const chunks: Buffer[] = []

      const stream = gtts.stream()
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        const audioBuffer = Buffer.concat(chunks)
        resolve(audioBuffer)
      })
      stream.on('error', (err: Error) => {
        console.error('Error converting text to audio:', err)
        reject(err)
      })
    })
  }
}