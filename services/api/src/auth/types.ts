export type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
  id_token?: string
}

export type GoogleUserInfo = {
  sub: string
  email?: string
  name?: string
  picture?: string
}

export type AuthSession = {
  sessionId: string
  googleSub: string
  email: string | null
  name: string | null
  picture: string | null
  accessToken: string
  previousAccessToken: string | null
  refreshToken: string
  scope: string | null
  tokenType: string
  accessTokenExpiresAt: number
  createdAt: number
  updatedAt: number
}

export type AuthResult = {
  sessionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string | null
  tokenType: string
  user: {
    sub: string
    email: string | null
    name: string | null
    picture: string | null
  }
}

export type RefreshResult = {
  sessionId: string
  accessToken: string
  expiresIn: number
  scope: string | null
  tokenType: string
}
