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

describe('user profile and rate limiting', () => {
  const originalFetch = globalThis.fetch
  let testDbDir = ''

  beforeEach(async () => {
    testDbDir = await mkdtemp(join(tmpdir(), 'aura-user-'))
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

  async function loginWithIdentity(options: {
    code: string
    sub: string
    email: string
    name?: string
    setMock?: boolean
  }): Promise<{ accessToken: string; userId: string }> {
    if (options.setMock ?? true) {
      globalThis.fetch = vi.fn(async (input) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/token')) {
          return jsonResponse({
            access_token: `google-access-${options.code}`,
            refresh_token: `google-refresh-${options.code}`,
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          sub: options.sub,
          email: options.email,
          name: options.name ?? options.email
        })
      }) as typeof fetch
    }

    const loginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: options.code })
    })
    if (loginResponse.status !== 200) {
      const errorBody = await loginResponse.text()
      throw new Error(`login ${options.code} failed (${loginResponse.status}): ${errorBody}`)
    }

    const loginBody = (await loginResponse.json()) as {
      accessToken: string
      user: { id: string }
    }
    return { accessToken: loginBody.accessToken, userId: loginBody.user.id }
  }

  it('returns authenticated user profile from /user/me', async () => {
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          access_token: 'google-access-profile',
          refresh_token: 'google-refresh-profile',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      return jsonResponse({
        sub: 'google-sub-profile',
        email: 'profile@example.com',
        name: 'Profile User',
        picture: 'https://example.com/profile.png'
      })
    }) as typeof fetch

    const loginResponse = await app.request('/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'valid-code' })
    })
    expect(loginResponse.status).toBe(200)
    const loginBody = (await loginResponse.json()) as {
      accessToken: string
      user: { id: string }
    }

    const meResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`
      }
    })
    expect(meResponse.status).toBe(200)
    const meBody = (await meResponse.json()) as {
      id: string
      email: string | null
      name: string | null
      picture: string | null
    }
    expect(meBody.id).toBe(loginBody.user.id)
    expect(meBody.email).toBe('profile@example.com')
    expect(meBody.name).toBe('Profile User')
    expect(meBody.picture).toBe('https://example.com/profile.png')
  })

  it('rate limits auth endpoints to 20 requests per minute by client IP', async () => {
    let lastStatus = 0
    for (let index = 0; index < 20; index += 1) {
      const response = await app.request('/auth/token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10'
        },
        body: JSON.stringify({ refreshToken: 'missing-refresh-token' })
      })
      lastStatus = response.status
    }
    expect(lastStatus).toBe(401)

    const limitedResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10'
      },
      body: JSON.stringify({ refreshToken: 'missing-refresh-token' })
    })
    expect(limitedResponse.status).toBe(429)
    const body = (await limitedResponse.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.retryable).toBe(false)
  })

  it('keeps auth rate limit buckets isolated per client IP', async () => {
    for (let index = 0; index < 20; index += 1) {
      const response = await app.request('/auth/token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.20'
        },
        body: JSON.stringify({ refreshToken: 'missing-refresh-token' })
      })
      expect(response.status).toBe(401)
    }

    const ipOneLimitedResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.20'
      },
      body: JSON.stringify({ refreshToken: 'missing-refresh-token' })
    })
    expect(ipOneLimitedResponse.status).toBe(429)

    const ipTwoResponse = await app.request('/auth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.21'
      },
      body: JSON.stringify({ refreshToken: 'missing-refresh-token' })
    })
    expect(ipTwoResponse.status).toBe(401)
  })

  it('rate limits general authenticated endpoints to 100 requests per minute by user', async () => {
    const login = await loginWithIdentity({
      code: 'valid-code',
      sub: 'google-sub-rate-limit',
      email: 'rate-limit@example.com'
    })

    let okStatus = 0
    for (let index = 0; index < 100; index += 1) {
      const response = await app.request('/user/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${login.accessToken}`
        }
      })
      okStatus = response.status
    }
    expect(okStatus).toBe(200)

    const limitedResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      }
    })
    expect(limitedResponse.status).toBe(429)
    const body = (await limitedResponse.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.retryable).toBe(false)
  })

  it('keeps authenticated rate limit buckets isolated per user', async () => {
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/token')) {
        const body = String(init?.body ?? '')
        if (body.includes('code=user-one-code')) {
          return jsonResponse({
            access_token: 'google-access-user-one',
            refresh_token: 'google-refresh-user-one',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        }

        return jsonResponse({
          access_token: 'google-access-user-two',
          refresh_token: 'google-refresh-user-two',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile'
        })
      }

      const initHeaders =
        init?.headers && typeof init.headers === 'object'
          ? new Headers(init.headers as HeadersInit)
          : new Headers()
      const authHeader = initHeaders.get('authorization') ?? ''
      if (authHeader.includes('google-access-user-one')) {
        return jsonResponse({
          sub: 'google-sub-user-one',
          email: 'user-one@example.com'
        })
      }

      return jsonResponse({
        sub: 'google-sub-user-two',
        email: 'user-two@example.com'
      })
    }) as typeof fetch

    const userOne = await loginWithIdentity({
      code: 'user-one-code',
      sub: 'google-sub-user-one',
      email: 'user-one@example.com',
      setMock: false
    })
    const userTwo = await loginWithIdentity({
      code: 'user-two-code',
      sub: 'google-sub-user-two',
      email: 'user-two@example.com',
      setMock: false
    })
    expect(userOne.userId).not.toBe(userTwo.userId)

    for (let index = 0; index < 100; index += 1) {
      const response = await app.request('/user/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userOne.accessToken}`
        }
      })
      expect(response.status).toBe(200)
    }

    const userOneLimited = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userOne.accessToken}`
      }
    })
    expect(userOneLimited.status).toBe(429)

    const userTwoResponse = await app.request('/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userTwo.accessToken}`
      }
    })
    expect(userTwoResponse.status).toBe(200)
  })

  it('returns standardized unauthorized error for /user/me without token', async () => {
    const response = await app.request('/user/me', { method: 'GET' })
    expect(response.status).toBe(401)
    const body = (await response.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.retryable).toBe(false)
  })
})
