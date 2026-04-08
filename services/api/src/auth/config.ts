import { ApiError } from '../errors.js'

const MINIMAL_SCOPES = ['openid', 'email', 'profile'] as const

export type AuthConfig = {
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
  googleTokenEndpoint: string
  googleUserInfoEndpoint: string
  googleScopes: string
  authDbPath: string
  accessTokenExpirySkewMs: number
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new ApiError(
      500,
      'AUTH_CONFIG_ERROR',
      `Missing required environment variable: ${name}`,
      false
    )
  }
  return value
}

export function getAuthConfig(): AuthConfig {
  const googleClientId = requireEnv('GOOGLE_CLIENT_ID')
  const googleClientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
  const googleRedirectUri = requireEnv('GOOGLE_REDIRECT_URI')

  return {
    googleClientId,
    googleClientSecret,
    googleRedirectUri,
    googleTokenEndpoint: process.env.GOOGLE_TOKEN_ENDPOINT?.trim()
      ?? 'https://oauth2.googleapis.com/token',
    googleUserInfoEndpoint: process.env.GOOGLE_USERINFO_ENDPOINT?.trim()
      ?? 'https://openidconnect.googleapis.com/v1/userinfo',
    googleScopes: process.env.GOOGLE_OAUTH_SCOPES?.trim() ?? MINIMAL_SCOPES.join(' '),
    authDbPath: process.env.AUTH_DB_PATH?.trim() ?? './.data/auth.db',
    accessTokenExpirySkewMs: Number(process.env.AUTH_ACCESS_TOKEN_EXPIRY_SKEW_MS ?? '30000')
  }
}
