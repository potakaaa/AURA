import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('GET /health', () => {
  it('returns status, version, and ISO timestamp', async () => {
    const response = await app.request('/health')

    expect(response.status).toBe(200)

    const body = (await response.json()) as {
      status: string
      version: string
      timestamp: string
    }

    expect(body.status).toBe('ok')
    expect(body.version).toBe('0.1.0')
    expect(typeof body.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false)
  })
})
