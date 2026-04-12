import { getApiBaseUrl } from './config';
import {
  apiError,
  apiSuccess,
  mapHttpError,
  mapNetworkError,
  mapParsingError,
  mapUnknownError,
  type ApiFailure,
  type ApiResult,
} from './result';
import type { TokenStore } from './token-store';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_TIMEOUT_MS = 30_000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions<TBody> = {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
  timeoutMs?: number;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  tokenType?: string;
  scope?: string;
  expiresIn?: number;
};

type Logger = {
  debug(message: string, context?: Record<string, unknown>): void;
};

type FetchLike = typeof fetch;

export type ApiClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: FetchLike;
  logger?: Logger;
  tokenStore: TokenStore;
};

const noopLogger: Logger = {
  debug: () => undefined,
};

function makeLogger(): Logger {
  const isDebugBuild = typeof __DEV__ !== 'undefined' && __DEV__;
  if (!isDebugBuild) {
    return noopLogger;
  }

  return {
    debug(message, context) {
      if (context) {
        console.log(`[ApiClient] ${message}`, context);
        return;
      }

      console.log(`[ApiClient] ${message}`);
    },
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isNetworkError(error: unknown): boolean {
  if (isAbortError(error)) {
    return true;
  }

  return error instanceof TypeError;
}

function isRefreshResponse(payload: unknown): payload is RefreshResponse {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return typeof (payload as RefreshResponse).accessToken === 'string';
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function persistTokens(
  tokenStore: TokenStore,
  tokens: { accessToken: string | null; refreshToken: string | null },
): Promise<void> {
  if (tokens.accessToken) {
    await tokenStore.setAccessToken(tokens.accessToken);
  }

  if (tokens.refreshToken) {
    await tokenStore.setRefreshToken(tokens.refreshToken);
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly tokenStore: TokenStore;
  private readonly fetchFn: FetchLike;
  private readonly logger: Logger;

  constructor(options: ApiClientOptions) {
    this.baseUrl = getApiBaseUrl({ baseUrl: options.baseUrl });
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.tokenStore = options.tokenStore;
    this.fetchFn = options.fetchFn ?? fetch;
    this.logger = options.logger ?? makeLogger();
  }

  async request<TResponse, TBody = unknown>(
    options: ApiRequestOptions<TBody>,
  ): Promise<ApiResult<TResponse>> {
    return this.requestInternal<TResponse, TBody>(options, true);
  }

  async refreshSession(): Promise<ApiResult<RefreshResponse>> {
    return this.refreshAccessToken();
  }

  private async requestInternal<TResponse, TBody>(
    options: ApiRequestOptions<TBody>,
    canRetryAfterRefresh: boolean,
  ): Promise<ApiResult<TResponse>> {
    const requestInit = await this.buildRequestInit(options);
    const url = toAbsoluteUrl(this.baseUrl, options.path);
    this.logger.debug('Sending request', {
      method: requestInit.method,
      url,
      requiresAuth: options.requiresAuth ?? true,
    });

    let response: Response;
    try {
      response = await this.fetchWithTimeout(url, requestInit, options.timeoutMs ?? this.timeoutMs);
    } catch (error) {
      return isNetworkError(error) ? mapNetworkError(error) : mapUnknownError(error);
    }

    if ((options.requiresAuth ?? true) && response.status === 401 && canRetryAfterRefresh) {
      const refreshResult = await this.refreshAccessToken();
      if (refreshResult.status === 'error') {
        return apiError({
          type: 'auth_refresh_failed',
          message: 'Session expired. Please sign in again.',
          code: refreshResult.error.code,
          status: refreshResult.error.status,
          retryable: false,
          cause: refreshResult.error,
        });
      }

      return this.requestInternal<TResponse, TBody>(
        {
          ...options,
          retryOnUnauthorized: false,
        },
        false,
      );
    }

    return this.mapResponseToResult<TResponse>(response);
  }

  private async buildRequestInit<TBody>(options: ApiRequestOptions<TBody>): Promise<RequestInit> {
    const method = options.method ?? 'GET';
    const headers = new Headers(options.headers ?? {});

    headers.set('Accept', JSON_CONTENT_TYPE);
    if (!headers.has('Content-Type') && options.body !== undefined) {
      headers.set('Content-Type', JSON_CONTENT_TYPE);
    }

    if (options.requiresAuth ?? true) {
      const accessToken = await this.tokenStore.getAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }

    const body =
      options.body === undefined || method === 'GET' ? undefined : JSON.stringify(options.body);

    return {
      method,
      headers,
      body,
    };
  }

  private async mapResponseToResult<TResponse>(response: Response): Promise<ApiResult<TResponse>> {
    const parsedBody = await this.parseResponseBody(response);
    if (parsedBody.status !== 'success') {
      if (parsedBody.status === 'error') {
        return parsedBody;
      }

      return mapUnknownError(new Error('Unexpected loading state while parsing response.'));
    }

    if (!response.ok) {
      return mapHttpError(response.status, parsedBody.data);
    }

    return apiSuccess(parsedBody.data as TResponse);
  }

  private async parseResponseBody(response: Response): Promise<ApiResult<unknown>> {
    if (response.status === 204) {
      return apiSuccess(undefined);
    }

    let rawBody = '';
    try {
      rawBody = await response.text();
    } catch (error) {
      return mapUnknownError(error);
    }

    if (!rawBody) {
      return apiSuccess(undefined);
    }

    try {
      return apiSuccess(JSON.parse(rawBody));
    } catch (error) {
      return mapParsingError(error);
    }
  }

  private async fetchWithTimeout(
    url: string,
    requestInit: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await this.fetchFn(url, {
        ...requestInit,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async refreshAccessToken(): Promise<ApiResult<RefreshResponse>> {
    const refreshToken = await this.tokenStore.getRefreshToken();
    if (!refreshToken) {
      return apiError({
        type: 'auth_refresh_failed',
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token found.',
        retryable: false,
      });
    }

    const refreshResult = await this.requestInternal<unknown, { refreshToken: string }>(
      {
        path: '/auth/token',
        method: 'POST',
        body: { refreshToken },
        requiresAuth: false,
        retryOnUnauthorized: false,
      },
      false,
    );

    if (refreshResult.status === 'error') {
      return refreshResult;
    }
    if (refreshResult.status !== 'success') {
      return mapUnknownError(new Error('Unexpected loading state during token refresh.'));
    }

    if (!isRefreshResponse(refreshResult.data)) {
      return apiError({
        type: 'parsing',
        code: 'INVALID_REFRESH_PAYLOAD',
        message: 'Refresh endpoint returned an invalid payload.',
        retryable: false,
      });
    }

    await persistTokens(this.tokenStore, {
      accessToken: refreshResult.data.accessToken,
      refreshToken: refreshResult.data.refreshToken ?? refreshToken,
    });

    this.logger.debug('Access token refreshed successfully.');
    return apiSuccess(refreshResult.data);
  }
}

export function isApiFailure<T>(result: ApiResult<T>): result is ApiFailure {
  return result.status === 'error';
}
