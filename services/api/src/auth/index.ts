import { getAuthConfig } from './config.js'
import { GoogleOAuthClient } from './google-client.js'
import { AuthService } from './service.js'
import { AuthSessionStore } from './session-store.js'
import { createAuthMiddleware } from './middleware.js'

let authService: AuthService | null = null

export function getAuthService(): AuthService {
  if (authService) {
    return authService
  }

  const authConfig = getAuthConfig()
  const authStore = new AuthSessionStore(authConfig.authDbPath)
  const authClient = new GoogleOAuthClient({ config: authConfig })
  authService = new AuthService({
    config: authConfig,
    store: authStore,
    client: authClient
  })

  return authService
}

export function getAuthMiddleware() {
  return createAuthMiddleware(getAuthService())
}

export function resetAuthForTests(): void {
  authService = null
}
