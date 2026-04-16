import {
  OUTPUT_FORMAT_SCHEMAS,
  type ActionPlanOutput,
  type SummaryOutput
} from 'ai-engine'
import { Ajv } from 'ajv'
import type { AiReasonActionPlanResponse, AiReasonSummaryResponse, AiReasonTextResponse } from './types.js'

const ajv = new Ajv({ allErrors: true, strict: false })
const validateActionPlan = ajv.compile(OUTPUT_FORMAT_SCHEMAS.action_plan)
const validateSummary = ajv.compile(OUTPUT_FORMAT_SCHEMAS.summary)

const extractJsonCandidate = (rawText: string): unknown => {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return null
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    // Continue to fenced JSON parsing fallback.
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i)
  if (!fencedMatch) {
    return null
  }

  try {
    return JSON.parse(fencedMatch[1].trim())
  } catch {
    return null
  }
}

export type ParsedModelOutput =
  | {
      readonly type: 'action_plan'
      readonly actionPlan: ActionPlanOutput
    }
  | {
      readonly type: 'summary'
      readonly summary: SummaryOutput
    }
  | {
      readonly type: 'text'
      readonly text: string
    }

export function parseModelOutput(rawText: string): ParsedModelOutput {
  const parsedJson = extractJsonCandidate(rawText)
  if (!parsedJson || typeof parsedJson !== 'object') {
    return { type: 'text', text: rawText.trim() }
  }

  const candidate = parsedJson as { format?: string }

  if (candidate.format === 'action_plan' && validateActionPlan(parsedJson)) {
    return {
      type: 'action_plan',
      actionPlan: parsedJson as ActionPlanOutput
    }
  }

  if (candidate.format === 'summary' && validateSummary(parsedJson)) {
    return {
      type: 'summary',
      summary: parsedJson as SummaryOutput
    }
  }

  return { type: 'text', text: rawText.trim() }
}

export function toReasonResponse(
  parsed: ParsedModelOutput,
  metadata: {
    readonly model: string
    readonly toolCalls: number
    readonly truncatedHistoryCount: number
    readonly fallbackUsed: boolean
  }
): AiReasonActionPlanResponse | AiReasonSummaryResponse | AiReasonTextResponse {
  if (parsed.type === 'action_plan') {
    return {
      type: 'action_plan',
      actionPlan: parsed.actionPlan,
      metadata
    }
  }

  if (parsed.type === 'summary') {
    return {
      type: 'summary',
      summary: parsed.summary,
      metadata
    }
  }

  return {
    type: 'text',
    text: parsed.text,
    metadata
  }
}
