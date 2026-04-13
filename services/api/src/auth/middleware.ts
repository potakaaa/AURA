import type { MiddlewareHandler } from 'hono'
import { ApiError } from '../errors.js'
import type { AuthService } from './service.js'
import type { AuthenticatedContext } from './types.js'

const AUTH_CONTEXT_KEY = 'authContext'

export function parseBearerToken(authorizationHeader: string | undefined): string {
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
    const context: AuthenticatedContext = {
      userId: session.userId,
      sessionId: session.id,
      accessToken: session.accessToken
    }
    c.set(AUTH_CONTEXT_KEY, context)

    if (session.accessToken !== bearerToken) {
      c.header('x-refreshed-access-token', session.accessToken)
    }

    await next()
  }
}

export function getAuthContext(c: { get: (key: string) => unknown }): AuthenticatedContext {
  const authContext = c.get(AUTH_CONTEXT_KEY)
  if (!authContext) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing authenticated session', false)
  }

  return authContext as AuthenticatedContext
}

export function getAuthenticatedUserId(c: { get: (key: string) => unknown }): string {
  return getAuthContext(c).userId
}
