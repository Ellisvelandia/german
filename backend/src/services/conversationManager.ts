import { DeepseekClient } from '../clients/deepseek';
import { ChatCompletionMessageParam } from 'openai/resources';

interface ConversationContext {
  scenario: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lastInteraction: Date;
}

export class ConversationManager {
  private conversations: Map<string, ConversationContext>;
  private readonly maxHistoryLength: number = 2; // Reduced from 5
  private readonly contextTimeout: number = 5 * 60 * 1000; // Reduced to 5 minutes

  constructor(private deepseekClient: DeepseekClient) {
    this.conversations = new Map();
  }

  private getScenarioContext(scenario: string): string {
    const contextMap: { [key: string]: string } = {
      supermarket: 'You are a helpful Brazilian Portuguese supermarket assistant. Focus on products, locations, prices, and shopping assistance.',
      train: 'You are a knowledgeable Brazilian Portuguese train station attendant. Focus on schedules, platforms, tickets, and travel information.',
      restaurant: 'You are a Brazilian Portuguese speaking waiter at a restaurant. Focus on menu items, orders, and dining assistance.',
      conversation: 'You are a native Brazilian Portuguese speaker having a casual conversation. Be friendly, engaging, and help the user practice everyday Brazilian Portuguese.',
      'free conversation': 'You are a friendly Brazilian Portuguese conversation partner. Maintain a casual and encouraging tone. Keep responses natural and help the user practice colloquial Brazilian Portuguese.'
    };

    return contextMap[scenario] || contextMap.conversation;
  }

  private cleanupOldContexts() {
    const now = new Date();
    for (const [sessionId, context] of this.conversations.entries()) {
      if (now.getTime() - context.lastInteraction.getTime() > this.contextTimeout) {
        this.conversations.delete(sessionId);
      }
    }
  }

  async processMessage(sessionId: string, text: string, scenario: string) {
    this.cleanupOldContexts();

    let context = this.conversations.get(sessionId);
    if (!context) {
      context = {
        scenario,
        history: [],
        lastInteraction: new Date()
      };
      this.conversations.set(sessionId, context);
    }

    // Keep only the last message for context
    context.history = context.history.slice(-1);
    context.history.push({ role: 'user', content: text });
    context.lastInteraction = new Date();

    // Prepare messages for AI with minimal context
    const messages = [
      { role: 'system', content: this.getScenarioContext(scenario) },
      { role: 'user', content: text }
    ];

    // Get AI response
    const response = await this.deepseekClient.completion(messages as ChatCompletionMessageParam[]);
    const aiResponse = response?.choices[0]?.message?.content || '';

    // Only store the latest interaction
    context.history = [
      { role: 'user', content: text },
      { role: 'assistant', content: aiResponse }
    ];

    return aiResponse;
  }

  clearContext(sessionId: string) {
    this.conversations.delete(sessionId);
  }
}
