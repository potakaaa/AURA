import type {
  ActionPlanOutput,
  SummaryOutput,
  UserPreferences
} from 'ai-engine'

export type AiHistoryMessage = {
  readonly role: 'user' | 'assistant' | 'tool'
  readonly content: string
}

export type AiReasonRequest = {
  readonly message: string
  readonly history?: readonly AiHistoryMessage[]
  readonly userPreferences?: UserPreferences
  readonly formatHint?: 'action_plan' | 'summary' | 'auto'
}

export type AiReasoningMetadata = {
  readonly model: string
  readonly toolCalls: number
  readonly truncatedHistoryCount: number
  readonly fallbackUsed: boolean
}

export type AiReasonTextResponse = {
  readonly type: 'text'
  readonly text: string
  readonly metadata: AiReasoningMetadata
}

export type AiReasonActionPlanResponse = {
  readonly type: 'action_plan'
  readonly actionPlan: ActionPlanOutput
  readonly metadata: AiReasoningMetadata
}

export type AiReasonSummaryResponse = {
  readonly type: 'summary'
  readonly summary: SummaryOutput
  readonly metadata: AiReasoningMetadata
}

export type AiReasonResponse =
  | AiReasonTextResponse
  | AiReasonActionPlanResponse
  | AiReasonSummaryResponse
