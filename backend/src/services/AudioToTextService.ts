import axios from 'axios'
import fs from 'fs'

export class AudioToTextService {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AssemblyAI API key is required')
    }
    this.apiKey = apiKey
  }

  public async convertAudioToText(audioFilePath: string): Promise<string> {
    try {
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found at ${audioFilePath}`)
      }

      const uploadResponse = await this.uploadAudio(audioFilePath)
      const transcriptResponse = await this.createTranscriptionJob(uploadResponse.upload_url)
      const finalTranscript = await this.pollTranscriptionStatus(transcriptResponse.id)

      return finalTranscript
    } catch (error) {
      throw error
    }
  }

  public async convertBufferToText(buffer: Buffer): Promise<string> {
    try {
      const uploadResponse = await this.uploadAudioBuffer(buffer)
      const transcriptResponse = await this.createTranscriptionJob(uploadResponse.upload_url)
      const finalTranscript = await this.pollTranscriptionStatus(transcriptResponse.id)

      return finalTranscript
    } catch (error) {
      throw error
    }
  }

  private async uploadAudioBuffer(buffer: Buffer) {
    const response = await axios.post('https://api.assemblyai.com/v2/upload', buffer, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/octet-stream'
      }
    })

    return response.data
  }

  private async uploadAudio(filePath: string) {
    const fileStream = fs.createReadStream(filePath)

    const response = await axios.post('https://api.assemblyai.com/v2/upload', fileStream, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/octet-stream'
      }
    })

    return response.data
  }

  private async createTranscriptionJob(audioUrl: string) {
    const response = await axios.post('https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl, language_code: 'de' },
      {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  private async pollTranscriptionStatus(transcriptId: string): Promise<string> {
    const maxAttempts = 60
    const initialIntervalMs = 1000
    let intervalMs = initialIntervalMs

    for (let attempt = 0;attempt < maxAttempts;attempt++) {
      const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': this.apiKey
        }
      })

      const status = response.data.status

      switch (status) {
        case 'completed':
          return response.data.text
        case 'error':
          throw new Error(`Transcription failed: ${response.data.error}`)
        case 'queued':
        case 'processing':
          await new Promise(resolve => setTimeout(resolve, intervalMs))
          break
        default:
          throw new Error(`Unexpected status: ${status}`)
      }
    }

    throw new Error('Transcription timed out')
  }
}