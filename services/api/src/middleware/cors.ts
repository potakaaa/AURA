import { cors } from 'hono/cors'

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS ?? ''
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function createCorsMiddleware() {
  return cors({
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
}
