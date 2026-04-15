import { GoogleGenAI } from '@google/genai'
import type { GeminiContent } from './context.js'
import type { GeminiFunctionDeclaration, GeminiToolCall } from './tools.js'

export type GeminiGenerateRequest = {
  readonly model: string
  readonly systemInstruction: string
  readonly contents: readonly GeminiContent[]
  readonly tools: readonly GeminiFunctionDeclaration[]
}

export type GeminiGenerateResult = {
  readonly text: string
  readonly functionCalls: readonly GeminiToolCall[]
  readonly rawResponse: unknown
}

export interface GeminiClient {
  generate(request: GeminiGenerateRequest): Promise<GeminiGenerateResult>
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

export class GoogleGeminiClient implements GeminiClient {
  private readonly client: GoogleGenAI

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(request: GeminiGenerateRequest): Promise<GeminiGenerateResult> {
    const response = await this.client.models.generateContent({
      model: request.model,
      contents: request.contents as unknown as object[],
      config: {
        systemInstruction: request.systemInstruction,
        tools: [
          {
            functionDeclarations: [...request.tools]
          }
        ]
      }
    })

    const rawResponse = response as unknown
    const responseRecord = asRecord(rawResponse)
    const candidates = Array.isArray(responseRecord.candidates)
      ? (responseRecord.candidates as unknown[])
      : []

    const firstCandidate = asRecord(candidates[0])
    const content = asRecord(firstCandidate.content)
    const parts = Array.isArray(content.parts) ? (content.parts as unknown[]) : []

    const textSegments: string[] = []
    const functionCalls: GeminiToolCall[] = []

    for (const part of parts) {
      const partRecord = asRecord(part)
      if (typeof partRecord.text === 'string' && partRecord.text.trim().length > 0) {
        textSegments.push(partRecord.text)
      }
      const functionCallRecord = asRecord(partRecord.functionCall)
      if (typeof functionCallRecord.name === 'string' && functionCallRecord.name.length > 0) {
        functionCalls.push({
          name: functionCallRecord.name,
          args: asRecord(functionCallRecord.args)
        })
      }
    }

    return {
      text: textSegments.join('\n').trim(),
      functionCalls,
      rawResponse
    }
  }
}
