import { DbKeyError, getOrCreateDbKey } from './crypto';
import { describe, expect, it } from 'vitest';

describe('getOrCreateDbKey', () => {
  it('returns existing key when present', async () => {
    const key = await getOrCreateDbKey({
      secureStore: {
        getItem: async () => 'existing-key',
        setItem: async () => undefined,
      },
      randomBytesProvider: {
        getRandomBytes: async () => new Uint8Array([1, 2, 3, 4]),
      },
    });

    expect(key).toBe('existing-key');
  });

  it('generates and persists a 32-byte hex key on first launch', async () => {
    const storage = new Map<string, string>();

    const key = await getOrCreateDbKey({
      secureStore: {
        getItem: async (storeKey) => storage.get(storeKey) ?? null,
        setItem: async (storeKey, value) => {
          storage.set(storeKey, value);
        },
      },
      randomBytesProvider: {
        getRandomBytes: async (size) => Uint8Array.from({ length: size }, (_, index) => index),
      },
    });

    expect(key.length).toBe(64);
    expect(key).toMatch(/^[0-9a-f]+$/);
    expect(storage.size).toBe(1);
  });

  it('throws DbKeyError when secure store retrieval fails', async () => {
    await expect(
      getOrCreateDbKey({
        secureStore: {
          getItem: async () => {
            throw new Error('secure store read failed');
          },
          setItem: async () => undefined,
        },
      })
    ).rejects.toBeInstanceOf(DbKeyError);
  });
});
