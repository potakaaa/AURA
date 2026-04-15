import { Hono } from 'hono'
import { getAuthMiddleware } from '../auth/index.js'
import { getAuthenticatedUserId } from '../auth/middleware.js'
import { createRateLimitMiddleware } from '../middleware/rate-limit.js'

export const protectedRoutes = new Hono()
const userRateLimitMiddleware = createRateLimitMiddleware({
  limit: 100,
  windowMs: 60_000,
  errorCode: 'RATE_LIMITED',
  errorMessage: 'Rate limit exceeded for this user',
  keyGenerator: (c) => `user:${getAuthenticatedUserId(c)}`
})

protectedRoutes.use('*', async (c, next) => {
  const middleware = getAuthMiddleware()
  return middleware(c, next)
})
protectedRoutes.use('*', userRateLimitMiddleware)
