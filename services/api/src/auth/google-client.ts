import type { AuthConfig } from './config.js'
import type { GoogleTokenResponse, GoogleUserInfo } from './types.js'
import { ApiError } from '../errors.js'

type ExchangeCodeInput = {
  code: string
  redirectUri?: string
  codeVerifier?: string
}

type RefreshAccessTokenInput = {
  refreshToken: string
}

type FetchFn = typeof fetch

type GoogleOAuthClientOptions = {
  config: AuthConfig
  fetchFn?: FetchFn
}

export class GoogleOAuthClient {
  private readonly config: AuthConfig
  private readonly fetchFn: FetchFn

  constructor(options: GoogleOAuthClientOptions) {
    this.config = options.config
    this.fetchFn = options.fetchFn ?? fetch
  }

  async exchangeCode(input: ExchangeCodeInput): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code: input.code,
      client_id: this.config.googleClientId,
      client_secret: this.config.googleClientSecret,
      redirect_uri: input.redirectUri ?? this.config.googleRedirectUri,
      grant_type: 'authorization_code',
      scope: this.config.googleScopes
    })

    if (input.codeVerifier) {
      body.set('code_verifier', input.codeVerifier)
    }

    return this.requestToken(body)
  }

  async refreshAccessToken(input: RefreshAccessTokenInput): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.googleClientId,
      client_secret: this.config.googleClientSecret,
      refresh_token: input.refreshToken,
      grant_type: 'refresh_token',
      scope: this.config.googleScopes
    })

    return this.requestToken(body)
  }

  async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await this.fetchFn(this.config.googleUserInfoEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new ApiError(
        response.status === 401 ? 401 : 502,
        response.status === 401 ? 'INVALID_GOOGLE_TOKEN' : 'GOOGLE_USERINFO_ERROR',
        'Failed to fetch Google user information',
        false
      )
    }

    const data = (await response.json()) as GoogleUserInfo
    if (!data.sub) {
      throw new ApiError(502, 'GOOGLE_USERINFO_ERROR', 'Google user info missing subject', false)
    }

    return data
  }

  private async requestToken(body: URLSearchParams): Promise<GoogleTokenResponse> {
    const response = await this.fetchFn(this.config.googleTokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })

    const payload = (await response.json()) as Record<string, unknown>

    if (!response.ok) {
      const message =
        typeof payload.error_description === 'string'
          ? payload.error_description
          : 'Google token request failed'
      throw new ApiError(
        response.status === 400 ? 401 : 502,
        response.status === 400 ? 'INVALID_GOOGLE_GRANT' : 'GOOGLE_TOKEN_EXCHANGE_ERROR',
        message,
        false
      )
    }

    const tokenPayload = payload as unknown as GoogleTokenResponse
    if (!tokenPayload.access_token || !tokenPayload.expires_in || !tokenPayload.token_type) {
      throw new ApiError(502, 'GOOGLE_TOKEN_EXCHANGE_ERROR', 'Malformed Google token response', false)
    }

    return tokenPayload
  }
}
