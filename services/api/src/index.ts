import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { getAuthService } from './auth/index.js'
import { getAuthConfig } from './auth/config.js'

const port = Number(process.env.PORT ?? '3000')
const authService = getAuthService()
const authConfig = getAuthConfig()

if (authConfig.sessionCleanupIntervalMs > 0) {
  const cleanupTimer = setInterval(async () => {
    try {
      await authService.purgeExpiredSessions()
    } catch (error) {
      console.error('Failed to purge expired sessions', error)
    }
  }, authConfig.sessionCleanupIntervalMs)
  cleanupTimer.unref()
}

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
