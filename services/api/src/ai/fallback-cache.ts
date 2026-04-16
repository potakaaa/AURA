import type { AiReasonTextResponse } from './types.js'

type CacheEntry = {
  readonly expiresAt: number
  readonly value: AiReasonTextResponse
}

export class ServiceUnavailableFallbackCache {
  private readonly store = new Map<string, CacheEntry>()

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  getOrCreate(key: string, valueFactory: () => AiReasonTextResponse): AiReasonTextResponse {
    const now = this.now()
    const existing = this.store.get(key)
    if (existing && existing.expiresAt > now) {
      return existing.value
    }

    const value = valueFactory()
    this.store.set(key, {
      value,
      expiresAt: now + this.ttlMs
    })

    return value
  }

  clear(): void {
    this.store.clear()
  }
}
