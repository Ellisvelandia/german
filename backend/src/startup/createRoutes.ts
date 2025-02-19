import { Router, Request, Response } from 'express'
import multer from 'multer'
import { AudioToTextService } from '../services/AudioToTextService'
import { ConversationService } from '../services/ConversationService'
import { readFileSync } from 'fs'
import path from 'path'

// FOR DEBUGGING
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp3' // Get original extension or default to .mp3
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}` // Generate unique filename
    cb(null, filename)
  },
})

const upload = multer({ storage })

export const createRoutes = (clients: any) => {
  const router = Router()
  const apiKey = process.env.ASSEMBLYAI_API_KEY || ''
  const audioToTextService = new AudioToTextService(apiKey)
  const conversationService = new ConversationService(clients)

  // Endpoint for handling audio file input
  // @ts-ignore
  router.post('/converse/audio', upload.single('audio'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send({ error: 'No audio file uploaded' })
    }

    try {
      const audioFilePath = req.file.path
      const scenarioName = req.body.scenarioName

      const transcribedText = await audioToTextService.convertAudioToText(audioFilePath)

      const { audioFilePath: responseAudioPath, text, translation } = await conversationService.converse(scenarioName, [
        { role: 'user', content: transcribedText },
      ])

      const audioFile = readFileSync(responseAudioPath)

      res.setHeader('Content-Type', 'application/json')
      res.send({
        audio: audioFile.toString('base64'), // Base64 encode the audio data
        germanText: text,
        englishText: translation
      })
    } catch (error) {
      console.error('Error in /converse/audio:', error)
      res.status(500).send({ error: 'Failed to process audio' })
    }
  })

  // Endpoint for handling direct text input
  router.post('/converse/text', async (req: Request, res: Response) => {
    try {
      const scenarioName = req.body.scenarioName
      const userText = req.body.text || 'hello'

      const { audioFilePath: responseAudioPath, text, translation } = await conversationService.converse(scenarioName, [
        { role: 'user', content: userText },
      ])

      const audioFile = readFileSync(responseAudioPath)

      res.setHeader('Content-Type', 'application/json')
      res.send({
        audio: audioFile.toString('base64'),
        germanText: text,
        englishText: translation
      })
    } catch (error) {
      console.error('Error in /converse/text:', error)
      res.status(500).send({ error: 'Failed to generate response' })
    }
  })

  return router
}
