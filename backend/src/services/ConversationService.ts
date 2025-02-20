import { ScenarioFactory } from '../scenarios/ScenarioFactory'
import { ChatCompletionMessageParam } from 'openai/resources'
import { Clients, ScenarioStates } from '../types'
import { TranslationService } from './TranslationService'

export class ConversationService {
  private clients: Clients
  private translationService: TranslationService

  constructor(clients: Clients) {
    this.clients = clients
    this.translationService = new TranslationService(clients)
  }

  public async converse(scenario: string, messages: ChatCompletionMessageParam[]) {
    try {
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

      const audioFilePath = await this.clients.gTTS.convertTextToAudio(text)
      if (!audioFilePath) {
        throw new Error('Failed to generate audio response: Audio conversion failed')
      }

      const translation = await this.translationService.translateToEnglish(text)
      if (!translation) {
        throw new Error('Failed to translate response: Translation service returned empty result')
      }

      return { text, translation, audioFilePath }
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

    const defaultUserMessage: ChatCompletionMessageParam = { role: 'user', content: 'Hallo!' }
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