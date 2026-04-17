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
import { Platform, Text, View } from 'react-native';

void SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  console.info('[agent][H5] RootLayout render start');
  // #region agent log
  fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H5',location:'app/_layout.tsx:31',message:'RootLayout rendered',data:{dev:__DEV__},timestamp:Date.now()})}).catch(() => {});
  // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1',location:'app/_layout.tsx:48',message:'Database initialization started',data:{useUnencryptedDb},timestamp:Date.now()})}).catch(() => {});
      // #endregion
      await initDatabase({ useUnencryptedDb });
      console.info('[agent][H1] initializeDatabase completed');
      // #region agent log
      fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1',location:'app/_layout.tsx:50',message:'Database initialization finished',data:{useUnencryptedDb},timestamp:Date.now()})}).catch(() => {});
      // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1',location:'app/_layout.tsx:64',message:'Theme hydration failed',data:{error:error instanceof Error?error.message:'unknown-error'},timestamp:Date.now()})}).catch(() => {});
        // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1_H2',location:'app/_layout.tsx:76',message:'RootLayout marked ready',data:{isMounted:true},timestamp:Date.now()})}).catch(() => {});
          // #endregion
        }
      }
    }

    void hydrateThemePreference();

    return () => {
      isMounted = false;
    };
  }, [setColorScheme]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H2_H4',location:'app/_layout.tsx:95',message:'Readiness gate changed',data:{isReady,fontsLoaded,hasFontsError:Boolean(fontsError)},timestamp:Date.now()})}).catch(() => {});
    // #endregion
    if (!isReady || (!fontsLoaded && !fontsError)) {
      return;
    }

    async function hideSplash() {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H4',location:'app/_layout.tsx:103',message:'Splash hide started',data:{isReady,fontsLoaded,hasFontsError:Boolean(fontsError)},timestamp:Date.now()})}).catch(() => {});
        // #endregion
        await SplashScreen.hideAsync();
        console.info('[agent][H4] SplashScreen.hideAsync resolved');
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H4',location:'app/_layout.tsx:105',message:'Splash hide finished',data:{ok:true},timestamp:Date.now()})}).catch(() => {});
        // #endregion
      } catch {
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H4',location:'app/_layout.tsx:107',message:'Splash hide failed',data:{ok:false},timestamp:Date.now()})}).catch(() => {});
        // #endregion
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
