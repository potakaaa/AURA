import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'api.accessToken';
const REFRESH_TOKEN_KEY = 'api.refreshToken';

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

export class AsyncStorageTokenStore implements TokenStore {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function saveTokens(tokenStore: TokenStore, tokens: StoredTokens): Promise<void> {
  if (tokens.accessToken) {
    await tokenStore.setAccessToken(tokens.accessToken);
  }

  if (tokens.refreshToken) {
    await tokenStore.setRefreshToken(tokens.refreshToken);
  }
}
