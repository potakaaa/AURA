import type { AuthConfig } from './config.js'
import type { AuthResult, AuthSession, RefreshResult, User } from './types.js'
import { ApiError } from '../errors.js'
import { GoogleOAuthClient } from './google-client.js'
import { AuthSessionStore } from './session-store.js'

type AuthenticateInput = {
  code: string
  redirectUri?: string
  codeVerifier?: string
}

type RefreshInput = {
  refreshToken: string
}

export class AuthService {
  private readonly config: AuthConfig
  private readonly client: GoogleOAuthClient
  private readonly store: AuthSessionStore

  constructor(options: {
    config: AuthConfig
    client: GoogleOAuthClient
    store: AuthSessionStore
  }) {
    this.config = options.config
    this.client = options.client
    this.store = options.store
  }

  async authenticateWithGoogle(input: AuthenticateInput): Promise<AuthResult> {
    const tokens = await this.client.exchangeCode(input)

    if (!tokens.refresh_token) {
      throw new ApiError(
        502,
        'GOOGLE_TOKEN_EXCHANGE_ERROR',
        'Google did not provide a refresh token',
        false
      )
    }

    const user = await this.client.fetchUserInfo(tokens.access_token)
    const expiresIn = Math.max(tokens.expires_in, 1)
    const expiresAt = Date.now() + expiresIn * 1000
    const persistedUser = await this.store.findOrCreateUser({
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture
    })

    const session = await this.store.createSession({
      userId: persistedUser.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? this.config.googleScopes,
      tokenType: tokens.token_type,
      expiresAt
    })

    return {
      sessionId: session.id,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn,
      scope: session.scope,
      tokenType: session.tokenType,
      user: persistedUser
    }
  }

  async refreshAccessToken(input: RefreshInput): Promise<RefreshResult> {
    const session = await this.store.findSessionByRefreshToken(input.refreshToken)
    if (!session) {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or revoked', false)
    }

    const refreshed = await this.client.refreshAccessToken({
      refreshToken: session.refreshToken
    })
    const expiresIn = Math.max(refreshed.expires_in, 1)

    const updatedSession = await this.store.upsertSession({
      ...session,
      previousAccessToken: session.accessToken,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? session.refreshToken,
      scope: refreshed.scope ?? session.scope,
      tokenType: refreshed.token_type,
      expiresAt: Date.now() + expiresIn * 1000
    })

    return {
      sessionId: updatedSession.id,
      accessToken: updatedSession.accessToken,
      expiresIn,
      scope: updatedSession.scope,
      tokenType: updatedSession.tokenType
    }
  }

  async validateOrRefreshAccessToken(accessToken: string): Promise<AuthSession> {
    const session = await this.store.findSessionByAccessToken(accessToken)
    if (!session) {
      throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or revoked', false)
    }

    const now = Date.now()
    const expiresSoon = now + this.config.accessTokenExpirySkewMs >= session.expiresAt
    if (!expiresSoon) {
      return session
    }

    const refreshed = await this.client.refreshAccessToken({
      refreshToken: session.refreshToken
    })
    const expiresIn = Math.max(refreshed.expires_in, 1)

    return this.store.upsertSession({
      ...session,
      previousAccessToken: session.accessToken,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? session.refreshToken,
      scope: refreshed.scope ?? session.scope,
      tokenType: refreshed.token_type,
      expiresAt: now + expiresIn * 1000
    })
  }

  async logoutByAccessToken(accessToken: string): Promise<void> {
    const session = await this.store.findSessionByAccessToken(accessToken)
    if (!session) {
      throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or revoked', false)
    }

    await this.store.deleteSessionById(session.id)
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.store.findUserById(userId)
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Authenticated user was not found', false)
    }

    return user
  }
}
