import { ApiError } from '../errors.js'
import type { AiConfig } from './config.js'
import type { GeminiClient, GeminiGenerateRequest } from './client.js'
import type { GeminiContent } from './context.js'
import { prepareGeminiContext } from './context.js'
import { ServiceUnavailableFallbackCache } from './fallback-cache.js'
import { parseModelOutput, toReasonResponse } from './parser.js'
import { executeMockToolCall, getGeminiToolDeclarations } from './tools.js'
import type { AiReasonRequest, AiReasonResponse } from './types.js'

export class AiReasoningService {
  private readonly fallbackCache: ServiceUnavailableFallbackCache

  constructor(
    private readonly config: AiConfig,
    private readonly client: GeminiClient,
    fallbackCache?: ServiceUnavailableFallbackCache
  ) {
    this.fallbackCache =
      fallbackCache ?? new ServiceUnavailableFallbackCache(this.config.fallbackTtlMs)
  }

  async reason(input: AiReasonRequest): Promise<AiReasonResponse> {
    if (!input.message || input.message.trim().length === 0) {
      throw new ApiError(400, 'INVALID_REQUEST', 'Field "message" is required', false)
    }

    const prepared = prepareGeminiContext(input)
    const contents: GeminiContent[] = [...prepared.contents]
    const tools = getGeminiToolDeclarations()
    let toolCalls = 0

    if (!this.config.geminiApiKey) {
      return this.buildServiceUnavailableFallback(input.message, toolCalls, prepared.truncatedHistoryCount)
    }

    for (let iteration = 0; iteration <= this.config.maxToolTurns; iteration += 1) {
      const requestPayload: GeminiGenerateRequest = {
        model: this.config.geminiModel,
        systemInstruction: prepared.systemInstruction,
        contents,
        tools
      }

      this.logDebug('request', requestPayload)

      try {
        const modelResult = await this.client.generate(requestPayload)
        this.logDebug('response', modelResult.rawResponse)

        if (modelResult.functionCalls.length > 0) {
          toolCalls += modelResult.functionCalls.length
          contents.push({
            role: 'model',
            parts: modelResult.functionCalls.map((functionCall) => ({
              functionCall
            }))
          })

          const toolResponses = await Promise.all(
            modelResult.functionCalls.map((call) => executeMockToolCall(call))
          )
          contents.push({
            role: 'user',
            parts: toolResponses.map((response) => ({
              functionResponse: {
                name: response.name,
                response: response.response
              }
            }))
          })
          continue
        }

        const parsed = parseModelOutput(modelResult.text)
        return toReasonResponse(parsed, {
          model: this.config.geminiModel,
          toolCalls,
          truncatedHistoryCount: prepared.truncatedHistoryCount,
          fallbackUsed: false
        })
      } catch {
        return this.buildServiceUnavailableFallback(
          input.message,
          toolCalls,
          prepared.truncatedHistoryCount
        )
      }
    }

    return this.buildServiceUnavailableFallback(input.message, toolCalls, prepared.truncatedHistoryCount)
  }

  private buildServiceUnavailableFallback(
    key: string,
    toolCalls: number,
    truncatedHistoryCount: number
  ): AiReasonResponse {
    return this.fallbackCache.getOrCreate(key, () => ({
      type: 'text',
      text: 'AURA reasoning service is temporarily unavailable. Please try again shortly.',
      metadata: {
        model: this.config.geminiModel,
        toolCalls,
        truncatedHistoryCount,
        fallbackUsed: true
      }
    }))
  }

  private logDebug(stage: 'request' | 'response', payload: unknown): void {
    if (!this.config.debugLogging) {
      return
    }
    const serialized = JSON.stringify(payload)
    console.debug(`[ai:gemini:${stage}] ${serialized}`)
  }
}
