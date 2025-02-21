import { OpenAI } from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';

interface QueuedRequest {
  promise: Promise<any>;
  status: 'pending' | 'fulfilled' | 'rejected';
}

export class DeepseekClient {
  private client: OpenAI;
  private requestQueue: QueuedRequest[] = [];
  private MAX_CONCURRENT_REQUESTS = 3;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.DEEPSEEK_KEY,
      timeout: 8000, // Reduced timeout
      maxRetries: 2
    });
  }

  public async completion(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
    // Manage concurrent requests
    while (this.getActiveRequestCount() >= this.MAX_CONCURRENT_REQUESTS) {
      await Promise.race(this.requestQueue.map(req => req.promise));
      this.cleanupQueue();
    }

    const requestPromise = this.client.chat.completions.create({
      messages,
      model: "deepseek/deepseek-chat",
      temperature: 0.5,
      max_tokens: 50,
      presence_penalty: -0.5,
      frequency_penalty: 0.3,
      stream: false
    });

    const queuedRequest: QueuedRequest = {
      promise: requestPromise,
      status: 'pending'
    };

    this.requestQueue.push(queuedRequest);

    try {
      const response = await requestPromise;
      queuedRequest.status = 'fulfilled';

      if (!response || !response.choices[0]?.message?.content) {
        throw new Error('Invalid response from AI service');
      }

      return response;
    } catch (error) {
      queuedRequest.status = 'rejected';
      console.error('Error connecting to deepseek:', error);
      throw new Error('Failed to get response from AI service');
    } finally {
      this.cleanupQueue();
    }
  }

  private getActiveRequestCount(): number {
    return this.requestQueue.filter(req => req.status === 'pending').length;
  }

  private cleanupQueue(): void {
    this.requestQueue = this.requestQueue.filter(req => req.status === 'pending');
  }
}
