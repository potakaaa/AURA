import type { StatusCode } from 'hono/utils/http-status'

export type ErrorPayload = {
  code: string
  message: string
  retryable: boolean
}

export class ApiError extends Error {
  readonly status: StatusCode
  readonly code: string
  readonly retryable: boolean

  constructor(status: StatusCode, code: string, message: string, retryable = false) {
    super(message)
    this.status = status
    this.code = code
    this.retryable = retryable
  }
}
