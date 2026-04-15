import {
  SYSTEM_PROMPT,
  assembleContextWindow,
  type ContextMessage
} from 'ai-engine'
import type { AiHistoryMessage, AiReasonRequest } from './types.js'

export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args?: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } }

export type GeminiContent = {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export type PreparedGeminiContext = {
  readonly systemInstruction: string
  readonly contents: GeminiContent[]
  readonly truncatedHistoryCount: number
}

const asContextMessage = (message: AiHistoryMessage): ContextMessage => ({
  role: message.role,
  content: message.content
})

const mapContextMessageToGeminiContent = (message: ContextMessage): GeminiContent | null => {
  if (message.role === 'system') {
    // Gemini only supports user/model roles in content turns. We preserve
    // secondary system blocks (for example serialized preferences) as user text.
    return {
      role: 'user',
      parts: [{ text: message.content }]
    }
  }

  if (message.role === 'assistant') {
    return {
      role: 'model',
      parts: [{ text: message.content }]
    }
  }

  if (message.role === 'tool') {
    return {
      role: 'user',
      parts: [{ text: `Tool result\n${message.content}` }]
    }
  }

  return {
    role: 'user',
    parts: [{ text: message.content }]
  }
}

export function prepareGeminiContext(input: AiReasonRequest): PreparedGeminiContext {
  const contextResult = assembleContextWindow({
    systemPrompt: SYSTEM_PROMPT,
    userPreferences: input.userPreferences,
    history: (input.history ?? []).map(asContextMessage),
    newUserMessage: input.message
  })

  const contents: GeminiContent[] = []

  for (const message of contextResult.messages) {
    // The base system prompt is passed via systemInstruction to satisfy provider contract.
    if (message.role === 'system' && message.content === SYSTEM_PROMPT) {
      continue
    }
    const mapped = mapContextMessageToGeminiContent(message)
    if (mapped) {
      contents.push(mapped)
    }
  }

  return {
    systemInstruction: SYSTEM_PROMPT,
    contents,
    truncatedHistoryCount: contextResult.droppedHistoryMessages
  }
}
