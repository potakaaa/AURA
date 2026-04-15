import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { resetAuthForTests } from '../src/auth/index.js'
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

type LoginResult = {
  accessToken: string
  refreshToken: string
  userId: string
}

describe('user session management endpoints', () => {
  const originalFetch = globalThis.fetch
  let testDbDir = ''

  beforeEach(async () => {
    testDbDir = await mkdtemp(join(tmpdir(), 'aura-user-session-'))
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_REDIRECT_URI = 'aura://oauth2redirect/google'
    process.env.GOOGLE_OAUTH_SCOPES = 'openid email profile'
    process.env.AUTH_DB_PATH = join(testDbDir, 'auth.db')
    process.env.AUTH_ACCESS_TOKEN_EXPIRY_SKEW_MS = '0'
    process.env.GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
    process.env.GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'
    process.env.AUTH_SESSION_CLEANUP_INTERVAL_MS = '0'
    resetAuthForTests()
    resetRateLimitStore()
  })

  afterEach(async () => {
    globalThis.fetch = originalFetch
    resetAuthForTests()
    resetRateLimitStore()
    await rm(testDbDir, { recursive: true, force: true })
  })

  async function loginWithIdentity(input: {
    code: string
    sub: string
    email: string
    name?: string
    expiresInSeconds?: number
  }): Promise<LoginResult> {
    globalThis.fetch = vi.fn(async (requestInfo, requestInit) => {
      const url = typeof requestInfo === 'string' ? requestInfo : requestInfo.toString()
      if (url.includes('/token')) {
        return jsonResponse({
          access_token: `google-access-${input.code}`,
          refresh_token: `google-refresh-${input.code}`,
          expires_in: input.expiresInSeconds ?? 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: input.sub,
        email: input.email,
        name: input.name ?? input.email
      })
    }) as typeof fetch

    const response = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: input.code })
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      accessToken: string
      refreshToken: string
      user: { id: string }
    }

    return {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      userId: body.user.id
    }
  }

  it('updates profile preferences through PUT /user/me', async () => {
    const login = await loginWithIdentity({
      code: 'profile-update',
      sub: 'google-sub-profile-update',
      email: 'profile-update@example.com',
      name: 'Before Update'
    })

    const updateResponse = await app.request('/user/me', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${login.accessToken}`
      },
      body: JSON.stringify({
        name: 'After Update',
        notificationsEnabled: false
      })
    })
    expect(updateResponse.status).toBe(200)
    const updatedBody = (await updateResponse.json()) as {
      id: string
      name: string
      notificationsEnabled: boolean
    }
    expect(updatedBody.id).toBe(login.userId)
    expect(updatedBody.name).toBe('After Update')
    expect(updatedBody.notificationsEnabled).toBe(false)

    const repeatedUpdateResponse = await app.request('/user/me', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${login.accessToken}`
      },
      body: JSON.stringify({
        name: 'After Update',
        notificationsEnabled: false
      })
    })
    expect(repeatedUpdateResponse.status).toBe(200)

    const meResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      }
    })
    expect(meResponse.status).toBe(200)
    const meBody = (await meResponse.json()) as { name: string }
    expect(meBody.name).toBe('After Update')
  })

  it('returns 400 when PUT /user/me is missing required fields', async () => {
    const login = await loginWithIdentity({
      code: 'missing-fields',
      sub: 'google-sub-missing-fields',
      email: 'missing-fields@example.com'
    })

    const response = await app.request('/user/me', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${login.accessToken}`
      },
      body: JSON.stringify({
        notificationsEnabled: true
      })
    })
    expect(response.status).toBe(400)
    const body = (await response.json()) as {
      error: { code: string; retryable: boolean }
    }
    expect(body.error.code).toBe('INVALID_REQUEST')
    expect(body.error.retryable).toBe(false)
  })

  it('soft deletes user and invalidates all sessions on DELETE /user/me', async () => {
    const login = await loginWithIdentity({
      code: 'delete-user',
      sub: 'google-sub-delete-user',
      email: 'delete-user@example.com'
    })

    const deleteResponse = await app.request('/user/me', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      }
    })
    expect(deleteResponse.status).toBe(204)

    const meResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      }
    })
    expect(meResponse.status).toBe(401)
  })

  it('rejects duplicate email for a different Google subject', async () => {
    globalThis.fetch = vi.fn(async (requestInfo, requestInit) => {
      const url = typeof requestInfo === 'string' ? requestInfo : requestInfo.toString()
      if (url.includes('/token')) {
        const body = String(requestInit?.body ?? '')
        if (body.includes('code=dup-first')) {
          return jsonResponse({
            access_token: 'google-access-dup-first',
            refresh_token: 'google-refresh-dup-first',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'google-access-dup-second',
          refresh_token: 'google-refresh-dup-second',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      const headers = new Headers(requestInit?.headers)
      const authorization = headers.get('authorization') ?? ''
      if (authorization.includes('google-access-dup-first')) {
        return jsonResponse({
          sub: 'google-sub-dup-first',
          email: 'duplicate@example.com',
          name: 'Duplicate User One'
        })
      }

      return jsonResponse({
        sub: 'google-sub-dup-second',
        email: 'duplicate@example.com',
        name: 'Duplicate User Two'
      })
    }) as typeof fetch

    const firstLoginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'dup-first' })
    })
    expect(firstLoginResponse.status).toBe(200)

    const secondLoginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'dup-second' })
    })
    const rawBody = await secondLoginResponse.text()
    expect(secondLoginResponse.status, rawBody).toBe(409)
    const body = JSON.parse(rawBody) as {
      error: { code: string; retryable: boolean }
    }
    expect(body.error.code).toBe('DUPLICATE_EMAIL')
    expect(body.error.retryable).toBe(false)
  })

  it('purges expired sessions through on-demand cleanup endpoint', async () => {
    globalThis.fetch = vi.fn(async (requestInfo, requestInit) => {
      const url = typeof requestInfo === 'string' ? requestInfo : requestInfo.toString()
      if (url.includes('/token')) {
        const body = String(requestInit?.body ?? '')
        if (body.includes('code=expired-session')) {
          return jsonResponse({
            access_token: 'google-access-expired-session',
            refresh_token: 'google-refresh-expired-session',
            expires_in: 1,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }
        if (body.includes('code=active-session')) {
          return jsonResponse({
            access_token: 'google-access-active-session',
            refresh_token: 'google-refresh-active-session',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'google-access-fallback',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      const headers = new Headers(requestInit?.headers)
      const authorization = headers.get('authorization') ?? ''
      if (authorization.includes('google-access-active-session')) {
        return jsonResponse({
          sub: 'google-sub-active-session',
          email: 'active-session@example.com'
        })
      }

      return jsonResponse({
        sub: 'google-sub-expired-session',
        email: 'expired-session@example.com'
      })
    }) as typeof fetch

    const expiredSessionLogin = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'expired-session' })
    })
    expect(expiredSessionLogin.status).toBe(200)
    const expiredBody = (await expiredSessionLogin.json()) as {
      refreshToken: string
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const activeSessionLogin = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'active-session' })
    })
    expect(activeSessionLogin.status).toBe(200)
    const activeBody = (await activeSessionLogin.json()) as {
      accessToken: string
    }

    const cleanupResponse = await app.request('/auth/sessions/cleanup', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeBody.accessToken}`
      }
    })
    expect(cleanupResponse.status).toBe(200)
    const cleanupBody = (await cleanupResponse.json()) as { purgedSessions: number }
    expect(cleanupBody.purgedSessions).toBeGreaterThanOrEqual(1)

    const refreshResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: expiredBody.refreshToken })
    })
    expect(refreshResponse.status).toBe(401)
  })

  it('validates auth payloads with 400 for missing required fields', async () => {
    const googleResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })
    expect(googleResponse.status).toBe(400)

    const tokenResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })
    expect(tokenResponse.status).toBe(400)
  })
})
