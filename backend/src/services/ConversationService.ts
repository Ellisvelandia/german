import { ScenarioFactory } from '../scenarios/ScenarioFactory'
import { ChatCompletionMessageParam } from 'openai/resources'
import { Clients, ScenarioStates } from '../types'
import { TranslationService } from './TranslationService'

export class ConversationService {
  private clients: Clients
  private translationService: TranslationService
  private responseCache: Map<string, { text: string; translation: string }>

  constructor(clients: Clients) {
    this.clients = clients
    this.translationService = new TranslationService(clients)
    this.responseCache = new Map()
  }

  private getCacheKey(scenario: string, messages: ChatCompletionMessageParam[]): string {
    const lastMessage = messages[messages.length - 1]
    return `${scenario}:${lastMessage?.content || ''}`
  }

  public async converse(scenario: string, messages: ChatCompletionMessageParam[]) {
    try {
      const cacheKey = this.getCacheKey(scenario, messages)
      const cachedResponse = this.responseCache.get(cacheKey)
      if (cachedResponse) {
        return cachedResponse
      }
      if (!scenario) {
        throw new Error('Scenario is required')
      }

      if (!Array.isArray(messages)) {
        throw new Error('Messages must be an array')
      }

      const { text } = await this.conversationText(scenario, messages)
      if (!text) {
        throw new Error('Failed to generate conversation text: Empty response from AI')
      }

      const translation = await this.translationService.translateToEnglish(text)
      if (!translation) {
        throw new Error('Failed to translate response: Translation service returned empty result')
      }

      // Store only text and translation in cache
      const response = { text, translation }
      this.responseCache.set(cacheKey, response)

      // Generate audio buffer on-the-fly without storing
      const audioBuffer = await this.clients.gTTS.convertTextToAudio(text)
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Failed to generate audio response: Audio conversion failed')
      }

      // Convert to base64 and specify the correct content type
      const audioBase64 = audioBuffer.toString('base64')
      return {
        ...response,
        audio: audioBase64,
        contentType: 'audio/mpeg' // Explicitly specify the content type
      }
    } catch (error) {
      console.error('Error in conversation service:', error)
      if (error instanceof Error) {
        throw new Error(`Conversation service error: ${error.message}`)
      }
      throw new Error('An unexpected error occurred in the conversation service')
    }
  }
  private conversationText = async (scenario: string, messages: ChatCompletionMessageParam[]) => {
    let scenarioInstance;
    try {
      scenarioInstance = ScenarioFactory.createScenario(scenario)
    } catch (error) {
      console.error('Invalid scenario:', error)
      throw new Error(`Invalid scenario: ${scenario}`)
    }
    const isConversationNew = messages.length === 0
    const state = isConversationNew ? ScenarioStates.START : ScenarioStates.CONTINUE

    const systemPrompt = scenarioInstance.getSystemPrompt(state)
    const systemMessage: ChatCompletionMessageParam = { role: 'system', content: systemPrompt }

    const defaultUserMessage: ChatCompletionMessageParam = { role: 'user', content: 'Olá!' }
    const conversationMessages = isConversationNew ? [systemMessage, defaultUserMessage] : [systemMessage, ...messages]

    try {
      const response = await this.clients.deepseek.completion(conversationMessages)
      const generatedText = response?.choices[0]?.message?.content || ''
      return { text: generatedText }
    } catch (error) {
      throw new Error('Failed to generate response')
    }
  }
}
