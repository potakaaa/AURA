import { Hono } from 'hono'
import { getAuthMiddleware, getAuthService } from '../auth/index.js'
import { getAuthenticatedUserId } from '../auth/middleware.js'
import { createRateLimitMiddleware } from '../middleware/rate-limit.js'
import { parseOrThrow, updateUserMeBodySchema } from './schemas.js'

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
  return c.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    },
    200
  )
})

userRoutes.put('/me', async (c) => {
  const userId = getAuthenticatedUserId(c)
  const body = parseOrThrow(updateUserMeBodySchema, await c.req.json())
  const user = await getAuthService().updateUserProfile(userId, {
    name: body.name,
    notificationsEnabled: body.notificationsEnabled
  })

  return c.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      notificationsEnabled: user.notificationsEnabled
    },
    200
  )
})

userRoutes.delete('/me', async (c) => {
  const userId = getAuthenticatedUserId(c)
  await getAuthService().deleteUser(userId)
  return c.body(null, 204)
})
