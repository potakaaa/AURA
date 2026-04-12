import type { MiddlewareHandler } from 'hono'
import { ApiError } from '../errors.js'
import type { AuthService } from './service.js'
import type { AuthSession } from './types.js'

const AUTH_CONTEXT_KEY = 'authSession'

function parseBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing Authorization header', false)
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid Authorization header format', false)
  }

  return token.trim()
}

export function createAuthMiddleware(authService: AuthService): MiddlewareHandler {
  return async (c, next) => {
    const bearerToken = parseBearerToken(c.req.header('authorization'))
    const session = await authService.validateOrRefreshAccessToken(bearerToken)
    c.set(AUTH_CONTEXT_KEY, session)

    if (session.accessToken !== bearerToken) {
      c.header('x-refreshed-access-token', session.accessToken)
    }

    await next()
  }
}

export function getAuthSession(c: { get: (key: string) => unknown }): AuthSession {
  const session = c.get(AUTH_CONTEXT_KEY)
  if (!session) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing authenticated session', false)
  }

  return session as AuthSession
}
