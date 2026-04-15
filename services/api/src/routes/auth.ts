import { Hono } from 'hono'
import { getAuthService } from '../auth/index.js'
import { parseBearerToken } from '../auth/middleware.js'
import {
  authGoogleBodySchema,
  authLogoutHeadersSchema,
  authTokenBodySchema,
  parseOrThrow
} from './schemas.js'

export const authRoutes = new Hono()

authRoutes.post('/google', async (c) => {
  const body = parseOrThrow(authGoogleBodySchema, await c.req.json())

  const authService = getAuthService()
  const authResult = await authService.authenticateWithGoogle({
    code: body.code,
    redirectUri: body.redirectUri,
    codeVerifier: body.codeVerifier
  })

  return c.json(
    {
      sessionId: authResult.sessionId,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      tokenType: authResult.tokenType,
      scope: authResult.scope,
      expiresIn: authResult.expiresIn,
      user: authResult.user
    },
    200
  )
})

authRoutes.post('/token', async (c) => {
  const body = parseOrThrow(authTokenBodySchema, await c.req.json())

  const authService = getAuthService()
  const refreshed = await authService.refreshAccessToken({
    refreshToken: body.refreshToken
  })

  return c.json(
    {
      sessionId: refreshed.sessionId,
      accessToken: refreshed.accessToken,
      tokenType: refreshed.tokenType,
      scope: refreshed.scope,
      expiresIn: refreshed.expiresIn
    },
    200
  )
})

authRoutes.post('/logout', async (c) => {
  const authService = getAuthService()
  const { authorization } = parseOrThrow(authLogoutHeadersSchema, {
    authorization: c.req.header('authorization')
  })
  const accessToken = parseBearerToken(authorization)
  await authService.logoutByAccessToken(accessToken)

  return c.body(null, 204)
})

authRoutes.post('/sessions/cleanup', async (c) => {
  const authService = getAuthService()
  const { authorization } = parseOrThrow(authLogoutHeadersSchema, {
    authorization: c.req.header('authorization')
  })
  const accessToken = parseBearerToken(authorization)
  await authService.validateOrRefreshAccessToken(accessToken)
  const purgedSessions = await authService.purgeExpiredSessions()

  return c.json(
    {
      purgedSessions
    },
    200
  )
})
