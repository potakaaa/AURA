import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

type ErrorPayload = {
  code: string
  message: string
  retryable: boolean
}

class ApiError extends Error {
  readonly status: StatusCode
  readonly code: string
  readonly retryable: boolean

  constructor(status: StatusCode, code: string, message: string, retryable = false) {
    super(message)
    this.status = status
    this.code = code
    this.retryable = retryable
  }
}

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS ?? ''
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => {
      const isProduction = (process.env.NODE_ENV ?? 'development') === 'production'
      const allowedOrigins = getAllowedOrigins()

      if (!isProduction) {
        return '*'
      }

      return origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
)

app.use('*', async (c, next) => {
  const method = c.req.method.toUpperCase()
  const contentType = c.req.header('content-type') ?? ''

  if (
    ['POST', 'PUT', 'PATCH'].includes(method) &&
    contentType.includes('application/json')
  ) {
    try {
      await c.req.raw.clone().json()
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'Malformed JSON request body', false)
    }
  }

  await next()
})

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: process.env.APP_VERSION ?? '0.1.0',
    timestamp: new Date().toISOString()
  })
})

app.post('/auth/google', (c) => {
  return c.json(
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Google auth endpoint is not implemented yet',
        retryable: false
      }
    },
    501
  )
})

app.post('/auth/token', (c) => {
  return c.json(
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Token refresh endpoint is not implemented yet',
        retryable: false
      }
    },
    501
  )
})

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        retryable: false
      } satisfies ErrorPayload
    },
    404
  )
})

app.onError((error, c) => {
  if (error instanceof ApiError) {
    c.status(error.status)
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable
        } satisfies ErrorPayload
      }
    )
  }

  c.status(500)
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error',
        retryable: true
      } satisfies ErrorPayload
    }
  )
})
