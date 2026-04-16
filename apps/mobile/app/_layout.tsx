import '@/global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { initDatabase } from '@/src/db';
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
import { Text, View } from 'react-native';

void SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [dbError, setDbError] = useState<string | null>(null);
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

    async function initializeDatabase() {
      const useUnencryptedDb =
        __DEV__ && process.env.EXPO_PUBLIC_DB_UNENCRYPTED?.toLowerCase() === 'true';
      await initDatabase({ useUnencryptedDb });
    }

    async function hydrateThemePreference() {
      try {
        await initializeDatabase();
        const storedPreference = await loadStoredColorScheme();
        if (!isMounted) {
          return;
        }

        setColorScheme(storedPreference as AppColorScheme);
      } catch (error) {
        if (isMounted) {
          setColorScheme('dark');
          if (error instanceof Error) {
            setDbError(error.message);
          } else {
            setDbError('Unknown database initialization error.');
          }
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

  if (dbError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-lg font-semibold text-foreground">
          Unable to initialize secure local storage.
        </Text>
        <Text className="mt-3 text-center text-sm text-muted-foreground">
          {dbError}
        </Text>
      </View>
    );
  }

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
