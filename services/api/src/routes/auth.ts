import { Hono } from 'hono'
import { getAuthService } from '../auth/index.js'
import { parseBearerToken } from '../auth/middleware.js'
import { ApiError } from '../errors.js'

export const authRoutes = new Hono()

authRoutes.post('/google', async (c) => {
  const body = (await c.req.json()) as {
    code?: string
    redirectUri?: string
    codeVerifier?: string
  }

  if (!body.code) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Field "code" is required', false)
  }

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
  const body = (await c.req.json()) as {
    refreshToken?: string
  }

  if (!body.refreshToken) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Field "refreshToken" is required', false)
  }

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
  const accessToken = parseBearerToken(c.req.header('authorization'))
  await authService.logoutByAccessToken(accessToken)

  return c.body(null, 204)
})
