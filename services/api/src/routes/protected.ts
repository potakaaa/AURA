import { Hono } from 'hono'
import { getAuthMiddleware } from '../auth/index.js'

export const protectedRoutes = new Hono()

protectedRoutes.use('*', async (c, next) => {
  const middleware = getAuthMiddleware()
  return middleware(c, next)
})
