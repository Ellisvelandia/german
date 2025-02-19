import { SupermarketScenario } from './Supermarket'
import { RestaurantScenario } from './Restaurant'
import { TrainStationScenario } from './TrainStation'
import { FreeConversationScenario } from './FreeConversation'
import { Scenario } from './Scenario'

export class ScenarioFactory {
  static createScenario(scenario: string): Scenario {
    switch (scenario) {
      case 'supermarket':
        return new SupermarketScenario()
      case 'restaurant':
        return new RestaurantScenario()
      case 'train station':
        return new TrainStationScenario()
      case 'free conversation':
        return new FreeConversationScenario()
      default:
        throw new Error(`Scenario "${scenario}" not found.`)
    }
  }
}