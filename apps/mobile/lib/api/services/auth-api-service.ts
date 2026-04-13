import { ApiClient } from '../client';
import { apiError, type ApiResult } from '../result';
import type { TokenStore } from '../token-store';

export type LoginRequest = {
  code: string;
  redirectUri?: string;
  codeVerifier?: string;
};

export type AuthUser = {
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

export type LoginResponse = {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string | null;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshTokenResponse = {
  sessionId: string;
  accessToken: string;
  tokenType: string;
  scope: string | null;
  expiresIn: number;
};

export interface AuthApiService {
  login(request: LoginRequest): Promise<ApiResult<LoginResponse>>;
  refreshToken(): Promise<ApiResult<RefreshTokenResponse>>;
  logout(): Promise<ApiResult<void>>;
}

class AuthApiServiceImpl implements AuthApiService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly tokenStore: TokenStore,
  ) {}

  async login(request: LoginRequest): Promise<ApiResult<LoginResponse>> {
    const result = await this.apiClient.request<LoginResponse, LoginRequest>({
      path: '/auth/google',
      method: 'POST',
      body: request,
      requiresAuth: false,
      retryOnUnauthorized: false,
    });

    if (result.status === 'success') {
      await this.tokenStore.setAccessToken(result.data.accessToken);
      await this.tokenStore.setRefreshToken(result.data.refreshToken);
    }

    return result;
  }

  async refreshToken(): Promise<ApiResult<RefreshTokenResponse>> {
    const result = await this.apiClient.refreshSession();
    if (result.status === 'error') {
      return result;
    }
    if (result.status !== 'success') {
      return apiError({
        type: 'unknown',
        code: 'UNEXPECTED_LOADING_STATE',
        message: 'Unexpected loading state during token refresh.',
        retryable: false,
      });
    }

    return {
      status: 'success',
      data: {
        sessionId: result.data.sessionId ?? '',
        accessToken: result.data.accessToken,
        tokenType: result.data.tokenType ?? 'Bearer',
        scope: result.data.scope ?? null,
        expiresIn: result.data.expiresIn ?? 0,
      },
    };
  }

  async logout(): Promise<ApiResult<void>> {
    return apiError({
      type: 'not_implemented',
      code: 'NOT_IMPLEMENTED',
      message: 'Logout endpoint is not available in the backend yet.',
      retryable: false,
    });
  }
}

export function createAuthApiService(apiClient: ApiClient, tokenStore: TokenStore): AuthApiService {
  return new AuthApiServiceImpl(apiClient, tokenStore);
}
