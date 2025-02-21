import { ScenarioStates } from "../types"
import { Scenario } from "./Scenario"

export class FreeConversationScenario extends Scenario {
  constructor() {
    super(
      'parceiro de conversa',
      'casual e incentivador'
    )
  }

  getSystemPrompt(state: ScenarioStates): string {
    const basePrompt = `You are a ${this.role} helping someone practice Brazilian Portuguese. Maintain a ${this.tone} tone.
    - Always respond in Brazilian Portuguese
    - Keep responses concise (1-3 sentences)
    - Use simple, everyday Brazilian Portuguese suitable for learners
    - Be patient and encouraging
    - Feel free to ask questions to keep the conversation going
    - Occasionally correct major grammar mistakes, but keep the flow natural
    - If the user seems stuck, gently guide them with questions or suggestions`

    return basePrompt
  }
}
