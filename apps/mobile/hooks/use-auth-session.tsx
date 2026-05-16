import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthSessionContextValue = {
  isLoading: boolean;
  session: Session | null;
  isAuthenticated: boolean;
};

const AUTH_ROUTES = new Set(['welcome', 'login', 'signup']);

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }

      setIsLoading(false);
    }

    void restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const firstSegment = segments[0];
    const inAuthFlow = AUTH_ROUTES.has(firstSegment);

    if (!session && !inAuthFlow) {
      router.replace('/welcome');
      return;
    }

    if (session && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, segments, session]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      isLoading,
      session,
      isAuthenticated: Boolean(session),
    }),
    [isLoading, session]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }

  return context;
}
