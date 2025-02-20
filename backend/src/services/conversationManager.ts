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
  private readonly maxHistoryLength: number = 10;
  private readonly contextTimeout: number = 30 * 60 * 1000; // 30 minutes

  constructor(private deepseekClient: DeepseekClient) {
    this.conversations = new Map();
  }

  private getScenarioContext(text: string, scenario: string): string {
    const contextMap: { [key: string]: string } = {
      restaurant: 'You are a friendly German restaurant server. Focus on food, drinks, orders, and dining experience.',
      supermarket: 'You are a helpful German supermarket assistant. Focus on products, locations, prices, and shopping assistance.',
      train: 'You are a knowledgeable German train station attendant. Focus on schedules, platforms, tickets, and travel information.',
      conversation: 'You are a native German speaker having a casual conversation. Be friendly and engaging.'
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

    // Update context
    context.history.push({ role: 'user', content: text });
    context.lastInteraction = new Date();

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: this.getScenarioContext(text, scenario) },
      ...context.history
    ];

    // Get AI response
const response = await this.deepseekClient.completion(messages as ChatCompletionMessageParam[]);
    const aiResponse = response?.choices[0]?.message?.content || '';

    // Update history with AI response
    context.history.push({ role: 'assistant', content: aiResponse });

    // Trim history if too long
    if (context.history.length > this.maxHistoryLength) {
      context.history = context.history.slice(-this.maxHistoryLength);
    }

    return aiResponse;
  }

  clearContext(sessionId: string) {
    this.conversations.delete(sessionId);
  }
}