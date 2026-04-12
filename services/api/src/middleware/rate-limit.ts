import type { Context, MiddlewareHandler } from 'hono'
import { ApiError } from '../errors.js'

type RateLimitOptions = {
  limit: number
  windowMs: number
  errorCode: string
  errorMessage: string
  keyGenerator: (c: Context) => string
}

type Bucket = {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

export function createRateLimitMiddleware(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const key = options.keyGenerator(c)
    const now = Date.now()
    const bucket = buckets.get(key)
    if (!bucket || now - bucket.windowStart >= options.windowMs) {
      buckets.set(key, { count: 1, windowStart: now })
      await next()
      return
    }

    if (bucket.count >= options.limit) {
      throw new ApiError(429, options.errorCode, options.errorMessage, false)
    }

    bucket.count += 1
    await next()
  }
}

export function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  return (
    c.req.header('x-real-ip') ??
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-client-ip') ??
    'unknown'
  )
}

export function resetRateLimitStore(): void {
  buckets.clear()
}
