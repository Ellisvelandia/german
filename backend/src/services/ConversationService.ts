import { 
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
  ChatCompletionFunctionMessageParam
} from 'openai/resources';
import { Clients } from '../types';
import { TranslationService } from './TranslationService';
import { AudioService } from './AudioService';
import { ScenarioFactory } from '../scenarios/ScenarioFactory';
import { ScenarioStates } from '../types';

type ValidMessageRole = 'system' | 'user' | 'assistant' | 'function';

export class ConversationService {
  private clients: Clients;
  private translationService: TranslationService;
  private audioService: AudioService;
  private responseCache: Map<string, { response: any, timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(clients: Clients) {
    this.clients = clients;
    this.translationService = new TranslationService(clients);
    this.audioService = new AudioService(clients);
    this.responseCache = new Map();
  }

  public async converse(scenarioName: string, userMessages: ChatCompletionMessageParam[]) {
    const cacheKey = this.generateCacheKey(scenarioName, userMessages);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) return cachedResponse;

    try {
      const lastMessage = userMessages[userMessages.length - 1];
      const lastMessageContent = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : JSON.stringify(lastMessage.content);

      const [aiResponse, translation] = await Promise.all([
        this.getAIResponse(scenarioName, userMessages),
        this.translationService.translateToEnglish(lastMessageContent)
      ]);

      const audioPromise = this.audioService.generateAudio(aiResponse);

      const response = {
        text: aiResponse,
        translation,
        audioBuffer: await audioPromise
      };

      this.cacheResponse(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Conversation error:', error);
      throw error;
    }
  }

  private generateCacheKey(scenario: string, messages: ChatCompletionMessageParam[]): string {
    const lastMessage = messages[messages.length - 1];
    const lastMessageContent = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : JSON.stringify(lastMessage.content);
    return `${scenario}:${lastMessageContent}`.toLowerCase();
  }

  private getCachedResponse(key: string) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.response;
    }
    return null;
  }

  private cacheResponse(key: string, response: any) {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });

    if (this.responseCache.size > 1000) {
      const oldestKey = Array.from(this.responseCache.keys())[0];
      this.responseCache.delete(oldestKey);
    }
  }

  private async getAIResponse(scenario: string, messages: ChatCompletionMessageParam[]): Promise<string> {
    const systemPrompt = ScenarioFactory.createScenario(scenario).getSystemPrompt(
      messages.length === 1 ? ScenarioStates.START : ScenarioStates.CONTINUE
    );

    const systemMessage: ChatCompletionSystemMessageParam = {
      role: 'system',
      content: systemPrompt
    };

    const processedMessages: ChatCompletionMessageParam[] = messages.map(msg => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);

      switch (msg.role as ValidMessageRole) {
        case 'function':
          return {
            role: 'function',
            name: (msg as ChatCompletionFunctionMessageParam).name,
            content
          } as ChatCompletionFunctionMessageParam;
        case 'assistant':
          return {
            role: 'assistant',
            content
          } as ChatCompletionAssistantMessageParam;
        case 'system':
          return {
            role: 'system',
            content
          } as ChatCompletionSystemMessageParam;
        case 'user':
        default:
          return {
            role: 'user',
            content
          } as ChatCompletionUserMessageParam;
      }
    });

    const aiMessages: ChatCompletionMessageParam[] = [systemMessage, ...processedMessages];

    const response = await this.clients.deepseek.completion(aiMessages);
    const responseContent = response.choices[0]?.message?.content;

    if (typeof responseContent !== 'string') {
      throw new Error('Invalid response format from AI service');
    }

    return responseContent;
  }
}
