import { describe, expect, it } from 'vitest';

import { mapHttpError, mapNetworkError, mapParsingError } from '../result';

describe('ApiResult error mapping', () => {
  it('maps backend HTTP errors into ApiResult.Error', () => {
    const result = mapHttpError(401, {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token expired',
        retryable: false,
      },
    });

    expect(result.status).toBe('error');
    expect(result.error.type).toBe('http');
    expect(result.error.status).toBe(401);
    expect(result.error.code).toBe('UNAUTHORIZED');
    expect(result.error.message).toBe('Token expired');
  });

  it('maps network failures to retryable errors', () => {
    const result = mapNetworkError(new TypeError('Failed to fetch'));

    expect(result.status).toBe('error');
    expect(result.error.type).toBe('network');
    expect(result.error.retryable).toBe(true);
  });

  it('maps JSON parse failures to parsing errors', () => {
    const result = mapParsingError(new SyntaxError('Unexpected token'));

    expect(result.status).toBe('error');
    expect(result.error.type).toBe('parsing');
    expect(result.error.retryable).toBe(false);
  });
});
