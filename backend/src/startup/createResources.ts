import { DeepseekClient } from "../clients/deepseek"
import { GTTSClient } from "../clients/gTTS"
import { Clients } from "../types"

export async function createResources(): Promise<Clients> {

  const deepseekClient = new DeepseekClient()
  const gttsClient = new GTTSClient()

  return {
    deepseek: deepseekClient,
    gTTS: gttsClient
  }
}