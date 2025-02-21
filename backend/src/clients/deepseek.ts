import { OpenAI } from 'openai'
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources'

export class DeepseekClient {
	private client: OpenAI

	constructor() {
		this.client = new OpenAI({
			baseURL: 'https://openrouter.ai/api/v1',
			apiKey: process.env.DEEPSEEK_KEY,
			timeout: 10000
		})
	}

	public async completion(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
		try {
			const response = await this.client.chat.completions.create({
				messages,
				model: "deepseek/deepseek-chat",
				temperature: 0.5,
				max_tokens: 50,
				presence_penalty: -0.5,
				frequency_penalty: 0.3
			})

			if (!response || !response.choices[0]?.message?.content) {
				throw new Error('Invalid response from AI service')
			}

			// Ensure the response has the required content
			response.choices[0].message.content = response.choices[0].message.content || ''

			return response
		} catch (error) {
			console.error('Error connecting to deepseek:', error)
			throw new Error('Failed to get response from AI service')
		}
	}
}
