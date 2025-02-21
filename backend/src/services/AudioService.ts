import { Clients } from '../types'

export class AudioService {
  private clients: Clients

  constructor(clients: Clients) {
    this.clients = clients
  }

  public async generateAudio(text: string): Promise<Buffer> {
    try {
      const audioBuffer = await this.clients.gTTS.convertTextToAudio(text)
      
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Generated audio buffer is empty')
      }

      // Ensure the audio buffer is in MP3 format
      // gTTS should already provide MP3, but we're being explicit
      if (!this.isValidMP3(audioBuffer)) {
        throw new Error('Invalid MP3 format')
      }

      return audioBuffer
    } catch (error) {
      console.error('Error generating audio:', error)
      throw new Error('Failed to generate audio')
    }
  }

  private isValidMP3(buffer: Buffer): boolean {
    // Check for MP3 header magic numbers
    // ID3v2 header starts with "ID3"
    // MP3 frame header starts with 0xFF 0xFB
    return (
      (buffer.length > 2 && buffer.toString('ascii', 0, 3) === 'ID3') ||
      (buffer.length > 1 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)
    )
  }
}
