import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { ApiClient } from '../client';
import type { TokenStore } from '../token-store';

class MemoryTokenStore implements TokenStore {
  private accessToken: string | null;
  private refreshToken: string | null;

  constructor(tokens: { accessToken: string | null; refreshToken: string | null }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
  }

  async setRefreshToken(token: string): Promise<void> {
    this.refreshToken = token;
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    request.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    request.on('end', () => {
      if (!rawBody) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function json(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

describe('ApiClient auth flow integration', () => {
  const servers: Array<ReturnType<typeof createServer>> = [];

  afterEach(async () => {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
          }),
      ),
    );
    servers.length = 0;
  });

  it('injects bearer token and retries once after refresh on 401', async () => {
    const authHeaders: Array<string | undefined> = [];
    let refreshCalls = 0;

    const server = createServer(async (request, response) => {
      if (request.url === '/protected') {
        const authHeader = request.headers.authorization;
        authHeaders.push(authHeader);

        if (authHeader === 'Bearer new-access-token') {
          json(response, 200, { id: 'user_1' });
          return;
        }

        json(response, 401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Expired token',
            retryable: false,
          },
        });
        return;
      }

      if (request.url === '/auth/token') {
        refreshCalls += 1;
        const payload = (await readJsonBody(request)) as { refreshToken?: string } | undefined;
        if (payload?.refreshToken === 'good-refresh-token') {
          json(response, 200, {
            sessionId: 'session_1',
            accessToken: 'new-access-token',
            tokenType: 'Bearer',
            scope: null,
            expiresIn: 3600,
          });
          return;
        }

        json(response, 401, {
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token invalid',
            retryable: false,
          },
        });
        return;
      }

      json(response, 404, {
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          retryable: false,
        },
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
    servers.push(server);
    const address = server.address() as AddressInfo;

    const tokenStore = new MemoryTokenStore({
      accessToken: 'old-access-token',
      refreshToken: 'good-refresh-token',
    });
    const apiClient = new ApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      tokenStore,
    });

    const result = await apiClient.request<{ id: string }>({
      path: '/protected',
      method: 'GET',
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.id).toBe('user_1');
    }
    expect(refreshCalls).toBe(1);
    expect(authHeaders).toEqual(['Bearer old-access-token', 'Bearer new-access-token']);
    expect(await tokenStore.getAccessToken()).toBe('new-access-token');
  });

  it('returns auth_refresh_failed when refresh endpoint fails', async () => {
    const server = createServer(async (request, response) => {
      if (request.url === '/protected') {
        json(response, 401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Expired token',
            retryable: false,
          },
        });
        return;
      }

      if (request.url === '/auth/token') {
        json(response, 401, {
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token invalid',
            retryable: false,
          },
        });
        return;
      }

      json(response, 404, {
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          retryable: false,
        },
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
    servers.push(server);
    const address = server.address() as AddressInfo;

    const tokenStore = new MemoryTokenStore({
      accessToken: 'expired-token',
      refreshToken: 'bad-refresh-token',
    });
    const apiClient = new ApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      tokenStore,
    });

    const result = await apiClient.request<{ id: string }>({
      path: '/protected',
      method: 'GET',
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.type).toBe('auth_refresh_failed');
    }
  });
});
