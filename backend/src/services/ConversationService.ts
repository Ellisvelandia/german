import { ChatCompletionMessageParam } from 'openai/resources'
import { Clients } from '../types'
import { TranslationService } from './TranslationService'
import { AudioService } from './AudioService'
import { ScenarioFactory } from '../scenarios/ScenarioFactory'
import { ScenarioStates } from '../types'

export class ConversationService {
  private clients: Clients
  private translationService: TranslationService
  private audioService: AudioService

  constructor(clients: Clients) {
    this.clients = clients
    this.translationService = new TranslationService(clients)
    this.audioService = new AudioService(clients)
  }

  public async converse(scenarioName: string, userMessages: ChatCompletionMessageParam[]) {
    try {
      const scenario = ScenarioFactory.createScenario(scenarioName)
      const state = userMessages.length === 1 ? ScenarioStates.START : ScenarioStates.CONTINUE
      
      const systemPrompt = scenario.getSystemPrompt(state)
      
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages
      ]

      const response = await this.clients.deepseek.completion(messages)
      
      // Extract and validate AI response
      const aiMessage = response.choices[0]?.message
      if (!aiMessage?.content) {
        throw new Error('Failed to get valid response from AI')
      }

      const aiResponse = aiMessage.content

      // Now aiResponse is definitely a string
      const translation = await this.translationService.translateToEnglish(aiResponse)
      const audioBuffer = await this.audioService.generateAudio(aiResponse)

      return {
        text: aiResponse,
        translation,
        audioBuffer
      }
    } catch (error) {
      console.error('Error in conversation:', error)
      throw error
    }
  }
}
