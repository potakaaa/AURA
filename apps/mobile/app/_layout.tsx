import '@/global.css';

import { Toaster } from '@/components/ui/toaster';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { initDatabase } from '@/src/db';
import { AuthSessionProvider, useAuthSession } from '@/hooks/use-auth-session';
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
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

void SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  console.info('[agent][H5] RootLayout render start');
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
      const unencryptedEnv = process.env.EXPO_PUBLIC_DB_UNENCRYPTED?.toLowerCase();
      const useUnencryptedDb =
        unencryptedEnv === 'true' || (__DEV__ && Platform.OS === 'android' && unencryptedEnv !== 'false');
      await initDatabase({ useUnencryptedDb });
      console.info('[agent][H1] initializeDatabase completed');
    }

    async function hydrateThemePreference() {
      try {
        await initializeDatabase();
        const storedPreference = await loadStoredColorScheme();
        if (!isMounted) {
          console.info('[agent][H5] hydrateThemePreference skipped because unmounted');
          return;
        }

        setColorScheme(storedPreference as AppColorScheme);
        console.info('[agent][H4] applied stored color scheme', storedPreference);
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
          console.info('[agent][H4] isReady set true');
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
        console.info('[agent][H4] SplashScreen.hideAsync resolved');
      } catch {
        // Avoid blocking render if splash hide fails.
      }
    }

    void hideSplash();
  }, [fontsError, fontsLoaded, isReady]);

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

  if (!isReady || (!fontsLoaded && !fontsError)) {
    console.info('[agent][H4] waiting state', { isReady, fontsLoaded, hasFontsError: Boolean(fontsError) });
    return null;
  }

  const resolvedColorScheme = colorScheme ?? 'dark';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[resolvedColorScheme]}>
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <StatusBar style={resolvedColorScheme === 'dark' ? 'light' : 'dark'} />
          <Toaster />
          <AuthSessionProvider>
            <AuthNavigator />
          </AuthSessionProvider>
          <PortalHost />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AuthNavigator() {
  const { isLoading } = useAuthSession();

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
        headerShown: false,
      }}
    />
  );
}
