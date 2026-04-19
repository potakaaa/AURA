const DB_KEY_ALIAS = 'aura.db.encryptionKey.v1';
const DB_KEY_BYTES = 32;

type SecureStoreModule = typeof import('expo-secure-store');
type CryptoModule = typeof import('expo-crypto');

let secureStoreModule: SecureStoreModule | null = null;
let cryptoModule: CryptoModule | null = null;

function getSecureStoreModule(): SecureStoreModule {
  if (!secureStoreModule) {
    secureStoreModule = require('expo-secure-store') as SecureStoreModule;
  }
  return secureStoreModule;
}

function getCryptoModule(): CryptoModule {
  if (!cryptoModule) {
    cryptoModule = require('expo-crypto') as CryptoModule;
  }
  return cryptoModule;
}

export class DbKeyError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DbKeyError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export interface SecureStoreAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface RandomBytesProvider {
  getRandomBytes(byteCount: number): Promise<Uint8Array>;
}

export const defaultSecureStoreAdapter: SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    return getSecureStoreModule().getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await getSecureStoreModule().setItemAsync(key, value);
  },
};

export const defaultRandomBytesProvider: RandomBytesProvider = {
  async getRandomBytes(byteCount: number): Promise<Uint8Array> {
    return getCryptoModule().getRandomBytesAsync(byteCount);
  },
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateDbKey(options?: {
  secureStore?: SecureStoreAdapter;
  randomBytesProvider?: RandomBytesProvider;
}): Promise<string> {
  const secureStore = options?.secureStore ?? defaultSecureStoreAdapter;
  const randomBytesProvider = options?.randomBytesProvider ?? defaultRandomBytesProvider;

  let existing: string | null = null;
  try {
    existing = await secureStore.getItem(DB_KEY_ALIAS);
  } catch (error) {
    throw new DbKeyError('Unable to read encrypted database key from SecureStore.', {
      cause: error,
    });
  }

  if (existing) {
    return existing;
  }

  let bytes: Uint8Array;
  try {
    bytes = await randomBytesProvider.getRandomBytes(DB_KEY_BYTES);
  } catch (error) {
    throw new DbKeyError('Unable to generate encrypted database key bytes.', { cause: error });
  }

  const generatedKey = bytesToHex(bytes);

  try {
    await secureStore.setItem(DB_KEY_ALIAS, generatedKey);
  } catch (error) {
    throw new DbKeyError('Unable to persist encrypted database key in SecureStore.', {
      cause: error,
    });
  }

  return generatedKey;
}

export const dbKeyAlias = DB_KEY_ALIAS;
