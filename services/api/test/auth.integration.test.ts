import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { createAuthMiddleware } from '../src/auth/middleware.js'
import { getAuthService, resetAuthForTests } from '../src/auth/index.js'
import { resetRateLimitStore } from '../src/middleware/rate-limit.js'

type JsonRecord = Record<string, unknown>

function jsonResponse(body: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  })
}

describe('Google OAuth auth endpoints', () => {
  const originalFetch = globalThis.fetch
  let testDbDir = ''

  beforeEach(async () => {
    testDbDir = await mkdtemp(join(tmpdir(), 'aura-auth-'))
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_REDIRECT_URI = 'aura://oauth2redirect/google'
    process.env.GOOGLE_OAUTH_SCOPES = 'openid email profile'
    process.env.AUTH_DB_PATH = join(testDbDir, 'auth.db')
    process.env.AUTH_ACCESS_TOKEN_EXPIRY_SKEW_MS = '0'
    process.env.GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
    process.env.GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'
    resetAuthForTests()
    resetRateLimitStore()
  })

  afterEach(async () => {
    globalThis.fetch = originalFetch
    resetAuthForTests()
    resetRateLimitStore()
    await rm(testDbDir, { recursive: true, force: true })
  })

  it('creates user on first login and reuses it on subsequent logins', async () => {
    let tokenCounter = 0
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        tokenCounter += 1
        expect(init?.method).toBe('POST')
        return jsonResponse({
          access_token: `google-access-${tokenCounter}`,
          refresh_token: `google-refresh-${tokenCounter}`,
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: 'google-sub-123',
        email: 'user@example.com',
        name: 'AURA User',
        picture: 'https://example.com/avatar.png'
      })
    }) as typeof fetch

    const firstLogin = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code' })
    })
    expect(firstLogin.status).toBe(200)
    const firstBody = (await firstLogin.json()) as {
      sessionId: string
      user: {
        id: string
        createdAt: number
        lastLoginAt: number
      }
    }
    expect(firstBody.sessionId).toBeTruthy()
    expect(firstBody.user.id).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 2))

    const secondLogin = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code-2' })
    })
    expect(secondLogin.status).toBe(200)
    const secondBody = (await secondLogin.json()) as {
      sessionId: string
      user: {
        id: string
        createdAt: number
        lastLoginAt: number
      }
    }
    expect(secondBody.sessionId).toBeTruthy()
    expect(secondBody.user.id).toBe(firstBody.user.id)
    expect(secondBody.user.createdAt).toBe(firstBody.user.createdAt)
    expect(secondBody.user.lastLoginAt).toBeGreaterThan(firstBody.user.lastLoginAt)
  })

  it('returns 401 when Google code is invalid', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(
        {
          error: 'invalid_grant',
          error_description: 'Bad Request'
        },
        400
      )
    ) as typeof fetch

    const response = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'invalid-code' })
    })

    expect(response.status).toBe(401)
    const body = (await response.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('INVALID_GOOGLE_GRANT')
    expect(body.error.retryable).toBe(false)
  })

  it('refreshes access token from a refresh token', async () => {
    const mockedFetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        const body = String(init?.body ?? '')
        if (body.includes('grant_type=authorization_code')) {
          return jsonResponse({
            access_token: 'google-access-2',
            refresh_token: 'google-refresh-2',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'google-access-3',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: 'google-sub-456',
        email: 'refresh@example.com',
        name: 'Refresh User'
      })
    })

    globalThis.fetch = mockedFetch as typeof fetch

    const loginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code' })
    })
    const loginBody = (await loginResponse.json()) as { refreshToken: string }

    const refreshResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: loginBody.refreshToken })
    })

    expect(refreshResponse.status).toBe(200)
    const refreshBody = (await refreshResponse.json()) as { accessToken: string }
    expect(refreshBody.accessToken).toBe('google-access-3')
  })

  it('returns 401 for revoked or unknown refresh token', async () => {
    const response = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'revoked-token' })
    })

    expect(response.status).toBe(401)
    const body = (await response.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('INVALID_REFRESH_TOKEN')
    expect(body.error.message).toContain('invalid or revoked')
  })

  it('invalidates current session on explicit logout', async () => {
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        const body = String(init?.body ?? '')
        if (body.includes('grant_type=authorization_code')) {
          return jsonResponse({
            access_token: 'google-access-logout',
            refresh_token: 'google-refresh-logout',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'google-access-refreshed-logout',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: 'google-sub-logout',
        email: 'logout@example.com'
      })
    }) as typeof fetch

    const loginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code' })
    })
    const loginBody = (await loginResponse.json()) as { accessToken: string }

    const logoutResponse = await app.request('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`
      }
    })
    expect(logoutResponse.status).toBe(204)

    const protectedResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`
      }
    })
    expect(protectedResponse.status).toBe(401)
    const body = (await protectedResponse.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('INVALID_ACCESS_TOKEN')
    expect(body.error.retryable).toBe(false)
  })

  it('automatically refreshes expired access token in auth middleware', async () => {
    const mockedFetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        const body = String(init?.body ?? '')
        if (body.includes('grant_type=authorization_code')) {
          return jsonResponse({
            access_token: 'expired-access-token',
            refresh_token: 'refresh-for-expired-token',
            expires_in: 1,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'newly-refreshed-access-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: 'google-sub-expired',
        email: 'expired@example.com'
      })
    })

    globalThis.fetch = mockedFetch as typeof fetch

    const loginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code' })
    })
    const loginBody = (await loginResponse.json()) as { accessToken: string }

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const protectedApp = new Hono()
    protectedApp.use('/resource', createAuthMiddleware(getAuthService()))
    protectedApp.get('/resource', (c) => c.json({ ok: true }))

    const protectedResponse = await protectedApp.request('/resource', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`
      }
    })

    expect(protectedResponse.status).toBe(200)
    expect(protectedResponse.headers.get('x-refreshed-access-token')).toBe(
      'newly-refreshed-access-token'
    )
  })
})
