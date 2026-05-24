import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TOP_BAR } from '@/lib/raw-colors';
import { cn } from '@/lib/utils';
import { THEME } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Clock3, Eye, Lock, Sparkles, Users } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'insight' as const, label: 'Insight', Icon: Eye },
  { name: 'connect' as const, label: 'Connect', Icon: Users },
  { name: 'index' as const, label: 'Aura', Icon: Sparkles, isAura: true },
  { name: 'history' as const, label: 'History', Icon: Clock3 },
];

/** Bottom padding for scroll/root content so it clears the floating glass tab bar. */
export const VOICE_HUB_TAB_CONTENT_INSET = 88;

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
  const bottomOffset = Math.max(insets.bottom - 30, 0);

  return (
    <View className="absolute left-0 right-0 z-50 overflow-hidden px-4" style={{ bottom: bottomOffset }}>
      <View pointerEvents="none" style={styles.materialPanel}>
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: TOP_BAR.surface }]} />
        <LinearGradient
          colors={[...TOP_BAR.materialOverlay]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.panelHighlight} />
      </View>

      <View className="relative h-[88px] flex-row items-center justify-around px-2 pb-2 pt-3">
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
              className="min-w-[64px] items-center justify-center py-0 active:opacity-90">
              <View className="items-center justify-center gap-1">
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
                    'text-[10px] font-medium uppercase tracking-wider',
                    isFocused && isAura && 'text-primary',
                    isFocused && !isAura && 'text-secondary',
                    !isFocused && 'text-muted-foreground opacity-60'
                  )}
                  style={{ fontFamily: 'Manrope_700Bold' }}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  materialPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 8,
    bottom: 8,
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOP_BAR.controlBorder,
    backgroundColor: TOP_BAR.material,
    ...BAR_SHADOW,
  },
  panelHighlight: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TOP_BAR.controlHighlight,
  },
});
