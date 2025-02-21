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
      // Validate inputs
      if (!scenarioName) {
        throw new Error('Scenario name is required');
      }
      if (!Array.isArray(userMessages) || userMessages.length === 0) {
        throw new Error('User messages are required');
      }

      const scenario = ScenarioFactory.createScenario(scenarioName);
      const state = userMessages.length === 1 ? ScenarioStates.START : ScenarioStates.CONTINUE;
      
      const systemPrompt = scenario.getSystemPrompt(state);
      
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages
      ];

      const response = await this.clients.deepseek.completion(messages);
      
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid or empty response from AI service');
      }

      const aiResponse = response.choices[0].message.content;

      // Add timeout handling for translation and audio generation
      const [translation, audioBuffer] = await Promise.all([
        this.translationService.translateToEnglish(aiResponse)
          .catch(error => {
            console.error('Translation error:', error);
            return 'Translation unavailable';
          }),
        this.audioService.generateAudio(aiResponse)
          .catch(error => {
            console.error('Audio generation error:', error);
            return null;
          })
      ]);

      return {
        text: aiResponse,
        translation,
        audioBuffer
      };
    } catch (error) {
      console.error('Conversation service error:', error);
      throw error;
    }
  }
}
