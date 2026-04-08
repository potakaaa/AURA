import '@/global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { loadStoredColorScheme, type AppColorScheme } from '@/lib/color-scheme';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
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
  const [fontsLoaded, fontsError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

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
          setColorScheme('dark');
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void hydrateThemePreference();

    return () => {
      isMounted = false;
    };
  }, [setColorScheme]);

  useEffect(() => {
    if (!isReady || (!fontsLoaded && !fontsError)) {
      return;
    }

    async function hideSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Avoid blocking render if splash hide fails.
      }
    }

    void hideSplash();
  }, [fontsError, fontsLoaded, isReady]);

  if (!isReady || (!fontsLoaded && !fontsError)) {
    return null;
  }

  const resolvedColorScheme = colorScheme ?? 'dark';

  return (
    <ThemeProvider value={NAV_THEME[resolvedColorScheme]}>
      <StatusBar style={resolvedColorScheme === 'dark' ? 'light' : 'dark'} />
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
