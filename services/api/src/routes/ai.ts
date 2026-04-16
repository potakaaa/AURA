import { Hono } from 'hono'
import { getAiReasoningService } from '../ai/index.js'
import { ApiError } from '../errors.js'
import type { AiReasonRequest } from '../ai/types.js'

export const aiRoutes = new Hono()

function assertValidRequest(body: AiReasonRequest): void {
  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Field "message" is required', false)
  }

  if (body.history && !Array.isArray(body.history)) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Field "history" must be an array', false)
  }

  if (body.history) {
    for (const item of body.history) {
      if (
        !item ||
        typeof item !== 'object' ||
        (item.role !== 'user' && item.role !== 'assistant' && item.role !== 'tool') ||
        typeof item.content !== 'string'
      ) {
        throw new ApiError(
          400,
          'INVALID_REQUEST',
          'Each history item must include role and string content',
          false
        )
      }
    }
  }
}

aiRoutes.post('/reason', async (c) => {
  const body = (await c.req.json()) as AiReasonRequest
  assertValidRequest(body)

  const result = await getAiReasoningService().reason({
    message: body.message,
    history: body.history,
    userPreferences: body.userPreferences,
    formatHint: body.formatHint ?? 'auto'
  })

  return c.json(result, 200)
})
