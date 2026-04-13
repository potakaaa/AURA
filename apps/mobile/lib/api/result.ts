export type ApiErrorType =
  | 'network'
  | 'http'
  | 'parsing'
  | 'auth_refresh_failed'
  | 'not_implemented'
  | 'unknown';

export type ApiErrorDetails = {
  type: ApiErrorType;
  message: string;
  code?: string;
  status?: number;
  retryable?: boolean;
  cause?: unknown;
};

export type ApiSuccess<T> = {
  status: 'success';
  data: T;
};

export type ApiFailure = {
  status: 'error';
  error: ApiErrorDetails;
};

export type ApiLoading = {
  status: 'loading';
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure | ApiLoading;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { status: 'success', data };
}

export function apiLoading(): ApiLoading {
  return { status: 'loading' };
}

export function apiError(error: ApiErrorDetails): ApiFailure {
  return { status: 'error', error };
}

type BackendErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
};

export function mapHttpError(status: number, payload?: unknown): ApiFailure {
  const backendPayload = payload as BackendErrorPayload | undefined;
  const code = backendPayload?.error?.code ?? `HTTP_${status}`;
  const message = backendPayload?.error?.message ?? `Request failed with HTTP ${status}`;
  const retryable = backendPayload?.error?.retryable ?? status >= 500;

  return apiError({
    type: 'http',
    status,
    code,
    message,
    retryable,
  });
}

export function mapParsingError(cause: unknown): ApiFailure {
  return apiError({
    type: 'parsing',
    message: 'Failed to parse API response.',
    retryable: false,
    cause,
  });
}

export function mapNetworkError(cause: unknown): ApiFailure {
  return apiError({
    type: 'network',
    message: 'Network request failed. Check your connection and try again.',
    retryable: true,
    cause,
  });
}

export function mapUnknownError(cause: unknown): ApiFailure {
  return apiError({
    type: 'unknown',
    message: 'Unexpected error while calling API.',
    retryable: false,
    cause,
  });
}
