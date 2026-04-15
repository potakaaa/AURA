import { Hono } from 'hono'
import { getAuthMiddleware, getAuthService } from '../auth/index.js'
import { getAuthenticatedUserId } from '../auth/middleware.js'
import { createRateLimitMiddleware } from '../middleware/rate-limit.js'

export const userRoutes = new Hono()
const userRateLimitMiddleware = createRateLimitMiddleware({
  limit: 100,
  windowMs: 60_000,
  errorCode: 'RATE_LIMITED',
  errorMessage: 'Rate limit exceeded for this user',
  keyGenerator: (c) => `user:${getAuthenticatedUserId(c)}`
})

userRoutes.use('*', async (c, next) => {
  const middleware = getAuthMiddleware()
  return middleware(c, next)
})
userRoutes.use('*', userRateLimitMiddleware)

userRoutes.get('/me', async (c) => {
  const userId = getAuthenticatedUserId(c)
  const user = await getAuthService().getUserById(userId)
  return c.json(user, 200)
})
