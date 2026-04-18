import { BAR_SIMPLE } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the inner row (`h-20`) — use with `insets.top` to offset scroll content below the bar. */
export const APP_TOP_BAR_INNER_HEIGHT = 80;

const BAR_SHADOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.onPrimaryFixed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  default: {},
});

export type AppTopBarProps = {
  /** Solid bar background (opaque). */
  backgroundColor?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
} & Pick<ViewProps, 'className' | 'style'>;

/**
 * Full-width top bar with safe-area top inset, opaque background, and bottom hairline.
 * Defaults to absolute positioning for overlaying scroll/gradient content.
 */
export function AppTopBar({
  backgroundColor = THEME.dark.surfaceDim,
  leading,
  trailing,
  className,
  style,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('absolute left-0 right-0 top-0 z-50 overflow-hidden px-6', className)}
      style={[{ paddingTop: insets.top, backgroundColor }, BAR_SHADOW, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={[...BAR_SIMPLE.topSheen]}
        locations={[0, 1]}
        style={styles.topSheen}
      />
      <View className="relative h-20 flex-row items-center justify-between">
        {leading ?? <View />}
        {trailing ?? <View />}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[...BAR_SIMPLE.bottomEdge]}
        locations={[0, 1]}
        style={styles.bottomEdge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
