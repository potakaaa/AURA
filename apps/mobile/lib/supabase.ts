import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

type AuthStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

function getAuthStorage(): AuthStorage | undefined {
  if (typeof globalThis.localStorage === 'undefined') {
    return undefined;
  }

  const candidate = globalThis.localStorage as Partial<AuthStorage> & {
    getItemAsync?: (key: string) => Promise<string | null>;
    setItemAsync?: (key: string, value: string) => Promise<void>;
    removeItemAsync?: (key: string) => Promise<void>;
  };

  const getItem =
    typeof candidate.getItem === 'function'
      ? (key: string) => candidate.getItem!(key)
      : typeof candidate.getItemAsync === 'function'
        ? (key: string) => candidate.getItemAsync!(key)
        : undefined;
  const setItem =
    typeof candidate.setItem === 'function'
      ? (key: string, value: string) => candidate.setItem!(key, value)
      : typeof candidate.setItemAsync === 'function'
        ? (key: string, value: string) => candidate.setItemAsync!(key, value)
        : undefined;
  const removeItem =
    typeof candidate.removeItem === 'function'
      ? (key: string) => candidate.removeItem!(key)
      : typeof candidate.removeItemAsync === 'function'
        ? (key: string) => candidate.removeItemAsync!(key)
        : undefined;

  if (!getItem || !setItem || !removeItem) {
    return undefined;
  }

  return { getItem, setItem, removeItem };
}

const authStorage = getAuthStorage();

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: Boolean(authStorage),
      detectSessionInUrl: false,
    },
  }
);
