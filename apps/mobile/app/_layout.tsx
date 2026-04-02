import '@/global.css';

import { loadStoredColorScheme, type AppColorScheme } from '@/lib/color-scheme';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';

void SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateThemePreference() {
      try {
        const storedPreference = await loadStoredColorScheme();
        if (!isMounted) {
          return;
        }

        setColorScheme(storedPreference as AppColorScheme);
      } catch {
        if (isMounted) {
          setColorScheme('light');
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }

        try {
          await SplashScreen.hideAsync();
        } catch {
          // Avoid blocking render if splash hide fails.
        }
      }
    }

    void hydrateThemePreference();

    return () => {
      isMounted = false;
    };
  }, [setColorScheme]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
        }}
      />
      <PortalHost />
    </ThemeProvider>
  );
}
