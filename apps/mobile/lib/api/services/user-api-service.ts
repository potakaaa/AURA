import { apiError, type ApiResult } from '../result';

export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
};

export interface UserApiService {
  getMe(): Promise<ApiResult<MeResponse>>;
}

class UserApiServiceImpl implements UserApiService {
  async getMe(): Promise<ApiResult<MeResponse>> {
    return apiError({
      type: 'not_implemented',
      code: 'NOT_IMPLEMENTED',
      message: 'The /user/me endpoint is not available in the backend yet.',
      retryable: false,
    });
  }
}

export function createUserApiService(): UserApiService {
  return new UserApiServiceImpl();
}
