export type ApiEnvironment = 'development' | 'staging' | 'production';

const DEFAULT_BASE_URLS: Record<ApiEnvironment, string> = {
  development: 'http://10.0.2.2:8787',
  staging: 'https://staging.api.aura.app',
  production: 'https://api.aura.app',
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function resolveApiEnvironment(value?: string): ApiEnvironment {
  if (value === 'production' || value === 'staging' || value === 'development') {
    return value;
  }

  return 'development';
}

export type ApiConfigOptions = {
  baseUrl?: string;
  environment?: ApiEnvironment;
};

export function getApiBaseUrl(options: ApiConfigOptions = {}): string {
  if (options.baseUrl) {
    return normalizeBaseUrl(options.baseUrl);
  }

  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  const environment = options.environment ?? resolveApiEnvironment(process.env.EXPO_PUBLIC_API_ENV);
  return normalizeBaseUrl(DEFAULT_BASE_URLS[environment]);
}
