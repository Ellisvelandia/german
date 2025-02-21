import { ScenarioStates } from '../types'
import { Scenario } from './Scenario'

const START_CONVERSATION = `
You are a waiter at a Brazilian restaurant. Keep responses very brief (max 20 words).
Always respond in Brazilian Portuguese. Be direct and efficient.

Start with a quick greeting and ask for order.
Example: "Olá! Pronto para pedir?"
`

const CONTINUE_CONVERSATION = `
You are a waiter at a Brazilian restaurant. Keep responses very brief (max 20 words).
Always respond in Brazilian Portuguese. Be direct and efficient.
Focus on taking orders and providing quick service information.
`

export class RestaurantScenario extends Scenario {
  constructor() {
    super('garçom', 'profissional e amigável')
  }

  getSystemPrompt(state: ScenarioStates): string {
    switch (state) {
      case ScenarioStates.START:
        return START_CONVERSATION
      case ScenarioStates.CONTINUE:
        return CONTINUE_CONVERSATION
      default:
        throw new Error(`Invalid scenario state: ${state}`)
    }
  }
}
