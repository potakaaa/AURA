import { getAiConfig } from './config.js'
import { GoogleGeminiClient } from './client.js'
import { AiReasoningService } from './service.js'

let aiReasoningService: AiReasoningService | null = null

export function getAiReasoningService(): AiReasoningService {
  if (aiReasoningService) {
    return aiReasoningService
  }

  const config = getAiConfig()
  const client = new GoogleGeminiClient(config.geminiApiKey)
  aiReasoningService = new AiReasoningService(config, client)
  return aiReasoningService
}

export function setAiReasoningServiceForTests(service: AiReasoningService | null): void {
  aiReasoningService = service
}
