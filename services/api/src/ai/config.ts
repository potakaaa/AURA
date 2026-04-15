export type AiConfig = {
  readonly geminiApiKey: string
  readonly geminiModel: string
  readonly debugLogging: boolean
  readonly fallbackTtlMs: number
  readonly maxToolTurns: number
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_FALLBACK_TTL_MS = 5 * 60 * 1_000
const DEFAULT_MAX_TOOL_TURNS = 3

export function getAiConfig(): AiConfig {
  const fallbackTtlMsRaw = Number(
    process.env.AI_SERVICE_UNAVAILABLE_CACHE_TTL_MS ?? DEFAULT_FALLBACK_TTL_MS
  )
  const maxToolTurnsRaw = Number(process.env.AI_MAX_TOOL_TURNS ?? DEFAULT_MAX_TOOL_TURNS)

  return {
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
    geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    debugLogging: process.env.AI_DEBUG_LOGGING === 'true',
    fallbackTtlMs:
      Number.isFinite(fallbackTtlMsRaw) && fallbackTtlMsRaw > 0
        ? fallbackTtlMsRaw
        : DEFAULT_FALLBACK_TTL_MS,
    maxToolTurns:
      Number.isInteger(maxToolTurnsRaw) && maxToolTurnsRaw > 0
        ? maxToolTurnsRaw
        : DEFAULT_MAX_TOOL_TURNS
  }
}
