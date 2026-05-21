import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraButton } from '@/components/ui/aura-button';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraThemeToggleRow } from '@/components/ui/aura-theme-toggle-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { persistColorScheme } from '@/lib/color-scheme';
import { supabase } from '@/lib/supabase';
import { Href, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function onToggleDarkMode(nextValue: boolean) {
    const nextScheme = nextValue ? 'dark' : 'light';
    setColorScheme(nextScheme);
    await persistColorScheme(nextScheme);
  }

  async function onSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
  }

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar title="Settings" showSettingsAction={false} />
        <View
          className="flex-1 px-5 pb-6"
          style={{ paddingTop: appTopBarOffsetTop(insets.top) + 12 }}>
          <AuraCard title="Appearance" description="Material-style dark theme persistence">
            <AuraThemeToggleRow checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
          </AuraCard>
          <AuraCard
            title="Temporary UI Lab"
            description="Preview the temporary Sonner-like toast component and different states.">
            <Button variant="outline" onPress={() => router.push('/(tabs)/toast-lab' as Href)}>
              <Text>Open Toast Lab</Text>
            </Button>
          <View className="mt-4">
            <AuraButton
              label="Open STT Test (Temporary)"
              auraVariant="secondary"
              className="h-12 rounded-full"
              onPress={() => router.push('/dev/stt-test')}
              accessibilityLabel="Open STT Test"
            />
          </View>
          </AuraCard>
          <AuraCard className="mt-4" title="Account" description="Manage your current session">
            <AuraButton
              label={isSigningOut ? 'Signing out...' : 'Log out'}
              auraVariant="secondary"
              className="h-12 rounded-full"
              onPress={onSignOut}
              disabled={isSigningOut}
              accessibilityLabel="Log out"
            />
          </AuraCard>
        </View>
      </View>
    </AuraScreen>
  );
}
