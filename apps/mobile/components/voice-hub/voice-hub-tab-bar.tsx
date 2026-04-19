import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { THEME } from '@/lib/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Eye, Lock, Sparkles, Users } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'insight' as const, label: 'Insight', Icon: Eye },
  { name: 'connect' as const, label: 'Connect', Icon: Users },
  { name: 'index' as const, label: 'Aura', Icon: Sparkles, isAura: true },
  { name: 'vault' as const, label: 'Vault', Icon: Lock },
];

/** Bottom padding for scroll/root content so it clears the custom tab bar (bar + typical home indicator). */
export const VOICE_HUB_TAB_CONTENT_INSET = 80;

const BAR_SHADOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.inversePrimary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 8 },
  default: {},
});

export function VoiceHubTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pb = Math.max(insets.bottom, 10);

  return (
    <View
      className="bg-surface-container/95 absolute bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] border-t border-white/5"
      style={[{ paddingBottom: pb, paddingTop: 10 }, BAR_SHADOW]}>
      <View className="flex-row items-end justify-around px-2 pt-1">
        {TABS.map(({ name, label, Icon: TabIcon, isAura }) => {
          const routeIndex = state.routes.findIndex((r) => r.name === name);
          const isFocused = routeIndex !== -1 && state.index === routeIndex;

          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              hitSlop={6}
              onPress={() => {
                navigation.navigate(name);
              }}
              className="min-w-[64px] items-center justify-center py-1 active:opacity-90">
              <Icon
                as={TabIcon}
                size={24}
                className={cn(
                  isFocused && isAura && 'text-primary',
                  isFocused && !isAura && 'text-secondary',
                  !isFocused && 'text-muted-foreground opacity-60'
                )}
              />
              <Text
                className={cn(
                  'mt-1 text-[10px] font-medium uppercase tracking-wider',
                  isFocused && isAura && 'text-primary',
                  isFocused && !isAura && 'text-secondary',
                  !isFocused && 'text-muted-foreground opacity-60'
                )}
                style={{ fontFamily: 'Manrope_700Bold' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
