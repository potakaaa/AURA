import { GradientText } from '@/components/welcome/gradient-text';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { rgbaWhite } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { router, type Href } from 'expo-router';
import { Settings, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppTopBar } from './app-top-bar';

export type AuthenticatedAppTopBarProps = {
  /** Opaque bar background; defaults to app background. */
  backgroundColor?: string;
  /** When set, shows this title instead of the AURA wordmark. */
  title?: string;
  /** Renders the settings action; default true. Use false on the settings screen. */
  showSettingsAction?: boolean;
};

/**
 * Shared top bar for signed-in routes: avatar, AURA (or screen title), settings.
 * Uses {@link AppTopBar} with a solid (opaque) background — no translucent /88 scrim.
 */
export function AuthenticatedAppTopBar({
  backgroundColor = THEME.dark.background,
  title,
  showSettingsAction = true,
}: AuthenticatedAppTopBarProps) {
  return (
    <AppTopBar
      backgroundColor={backgroundColor}
      leading={
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="bg-surface-highest h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10">
            <Icon as={User} size={22} className="text-muted-foreground" />
          </View>
          {title ? (
            <Text
              className="text-foreground shrink text-xl font-bold tracking-tight"
              numberOfLines={1}
              style={{ fontFamily: 'Manrope_700Bold' }}>
              {title}
            </Text>
          ) : (
            <GradientText
              variant="aura"
              className="text-2xl font-black tracking-tight"
              outerClassName="self-center">
              AURA
            </GradientText>
          )}
        </View>
      }
      trailing={
        showSettingsAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={8}
            android_ripple={{ color: rgbaWhite(0.12) }}
            onPress={() => router.push('/(tabs)/settings' as Href)}
            className="active:opacity-80">
            <Icon as={Settings} size={28} className="text-muted-foreground" />
          </Pressable>
        ) : (
          <View className="h-7 w-7" />
        )
      }
    />
  );
}
