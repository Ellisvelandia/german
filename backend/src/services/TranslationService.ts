// src/services/TranslationService.ts
import { ChatCompletionMessageParam } from 'openai/resources'
import { Clients } from '../types'

export class TranslationService {
  private clients: Clients
  private translationCache: Map<string, string>

  constructor(clients: Clients) {
    this.clients = clients
    this.translationCache = new Map()
  }

  public async translateToEnglish(portugueseText: string): Promise<string> {
    // Check cache first for an existing translation
    const cacheKey = portugueseText.toLowerCase().trim()
    if (this.translationCache.has(cacheKey)) {
      const cachedTranslation = this.translationCache.get(cacheKey)
      if (cachedTranslation) {
        return cachedTranslation
      }
    }

    // Prepare messages for the AI with the system prompt and user text to translate
    const systemPrompt = "Translate Portuguese to English. Translation only."
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: portugueseText }
    ]

    try {
      const response = await this.clients.deepseek.completion(messages)
      
      // Extract and validate the translation
      const translationMessage = response.choices[0]?.message
      if (!translationMessage?.content) {
        throw new Error('Failed to get valid translation from AI')
      }

      const translation = translationMessage.content

      // Cache the translation
      this.translationCache.set(cacheKey, translation)
      
      // Limit cache size to prevent memory issues
      if (this.translationCache.size > 1000) {
        const firstKey = this.translationCache.keys().next().value
        if (firstKey) {
          this.translationCache.delete(firstKey)
        }
      }

      return translation
    } catch (error) {
      console.error('Error translating text:', error)
      throw new Error('Failed to translate text')
    }
  }
}
