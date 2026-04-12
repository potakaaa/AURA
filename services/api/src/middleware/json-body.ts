import type { MiddlewareHandler } from 'hono'
import { ApiError } from '../errors.js'

export const validateJsonBodyMiddleware: MiddlewareHandler = async (c, next) => {
  const method = c.req.method.toUpperCase()
  const contentType = c.req.header('content-type') ?? ''

  if (
    ['POST', 'PUT', 'PATCH'].includes(method) &&
    contentType.includes('application/json')
  ) {
    try {
      await c.req.raw.clone().json()
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'Malformed JSON request body', false)
    }
  }

  await next()
}
