import { Hono } from 'hono'
import { ApiError, type ErrorPayload } from './errors.js'
import { createCorsMiddleware } from './middleware/cors.js'
import { validateJsonBodyMiddleware } from './middleware/json-body.js'
import { authRoutes } from './routes/auth.js'
import { healthRoutes } from './routes/health.js'
import { protectedRoutes } from './routes/protected.js'

export const app = new Hono()

app.use('*', createCorsMiddleware())
app.use('*', validateJsonBodyMiddleware)
app.route('/', healthRoutes)
app.route('/auth', authRoutes)
app.route('/protected', protectedRoutes)

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
