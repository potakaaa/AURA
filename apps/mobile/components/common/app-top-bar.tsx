import { TOP_BAR } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

/** Height of the inner row (`h-20`) — use with `insets.top` to offset scroll content below the bar. */
export const APP_TOP_BAR_INNER_HEIGHT = 80;

/** Total top padding for content below {@link AppTopBar}. Root layout owns device safe-area spacing. */
export function appTopBarOffsetTop(_insetsTop = 0): number {
  return APP_TOP_BAR_INNER_HEIGHT;
}

const BAR_SHADOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.onPrimaryFixed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
  },
  android: { elevation: 8 },
  default: {},
});

export type AppTopBarProps = {
  /** Solid bar background (opaque). */
  backgroundColor?: string;
  leading?: ReactNode;
  /**
   * Trailing slot. Pass `false` for a single centered row (e.g. auth brand) with no second column.
   */
  trailing?: ReactNode | false;
} & Pick<ViewProps, 'className' | 'style'>;

/**
 * Full-width top bar with safe-area top inset, opaque background, and bottom hairline.
 * Defaults to absolute positioning for overlaying scroll/gradient content.
 */
export function AppTopBar({
  backgroundColor = TOP_BAR.surface,
  leading,
  trailing,
  className,
  style,
}: AppTopBarProps) {
  const centerOnly = trailing === false;

  return (
    <View
      className={cn('absolute left-0 right-0 top-0 z-50 overflow-hidden px-5', className)}
      style={[{ backgroundColor }, BAR_SHADOW, style]}>
      <BlurView intensity={34} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={[...TOP_BAR.brandHalo]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brandHalo}
      />
      <View pointerEvents="none" style={styles.materialPanel}>
        <LinearGradient
          colors={[...TOP_BAR.materialOverlay]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.panelHighlight} />
      </View>
      <View
        className={cn(
          'relative h-20 flex-row items-center px-1',
          centerOnly ? 'justify-center' : 'justify-between'
        )}>
        {centerOnly ? (
          (leading ?? <View />)
        ) : (
          <>
            {leading ?? <View />}
            {trailing ?? <View />}
          </>
        )}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[...TOP_BAR.bottomEdge]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomEdge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  brandHalo: {
    position: 'absolute',
    top: -58,
    left: -28,
    width: 280,
    height: 152,
  },
  materialPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 12,
    bottom: 12,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOP_BAR.controlBorder,
    backgroundColor: TOP_BAR.material,
  },
  panelHighlight: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TOP_BAR.controlHighlight,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
