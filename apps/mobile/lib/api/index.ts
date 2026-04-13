import { ApiClient } from './client';
import { createAuthApiService } from './services/auth-api-service';
import { createUserApiService } from './services/user-api-service';
import { AsyncStorageTokenStore } from './token-store';

const tokenStore = new AsyncStorageTokenStore();
const apiClient = new ApiClient({ tokenStore });

export const authApiService = createAuthApiService(apiClient, tokenStore);
export const userApiService = createUserApiService();

export * from './client';
export * from './config';
export * from './result';
export * from './token-store';
export * from './services/auth-api-service';
export * from './services/user-api-service';
