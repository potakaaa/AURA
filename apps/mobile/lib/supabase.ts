import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const authStorage = typeof localStorage !== 'undefined' ? localStorage : undefined;

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
