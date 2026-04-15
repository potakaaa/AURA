import { z } from 'zod'
import { ApiError } from '../errors.js'

export const authGoogleBodySchema = z.object({
  code: z.string().trim().min(1, 'Field "code" is required'),
  redirectUri: z.string().trim().url().optional(),
  codeVerifier: z.string().trim().min(1).optional()
})

export const authTokenBodySchema = z.object({
  refreshToken: z.string().trim().min(1, 'Field "refreshToken" is required')
})

export const authLogoutHeadersSchema = z.object({
  authorization: z.string().trim().min(1, 'Missing Authorization header')
})

export const updateUserMeBodySchema = z.object({
  name: z.string().trim().min(1, 'Field "name" is required'),
  notificationsEnabled: z.boolean()
})

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (result.success) {
    return result.data
  }

  const firstIssue = result.error.issues[0]
  const path = firstIssue?.path.length ? `${firstIssue.path.join('.')}: ` : ''
  const message = `${path}${firstIssue?.message ?? 'Invalid request payload'}`
  throw new ApiError(400, 'INVALID_REQUEST', message, false)
}
