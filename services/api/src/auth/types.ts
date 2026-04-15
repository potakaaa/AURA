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

export type User = {
  id: string
  email: string | null
  name: string | null
  picture: string | null
  notificationsEnabled: boolean
  createdAt: number
  updatedAt: number
  lastLoginAt: number
  deletedAt: number | null
}

export type AuthSession = {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  createdAt: number
  tokenType: string
  scope: string | null
  previousAccessToken: string | null
  updatedAt: number
}

export type AuthenticatedContext = {
  userId: string
  sessionId: string
  accessToken: string
}

export type AuthResult = {
  sessionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string | null
  tokenType: string
  user: User
}

export type RefreshResult = {
  sessionId: string
  accessToken: string
  expiresIn: number
  scope: string | null
  tokenType: string
}
