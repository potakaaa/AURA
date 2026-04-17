import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the inner row (`h-20`) — use with `insets.top` to offset scroll content below the bar. */
export const APP_TOP_BAR_INNER_HEIGHT = 80;

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
  backgroundColor = '#050505',
  leading,
  trailing,
  className,
  style,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'absolute left-0 right-0 top-0 z-50 border-b border-white/[0.06] px-6',
        className
      )}
      style={[{ paddingTop: insets.top, backgroundColor }, style]}>
      <View className="h-20 flex-row items-center justify-between">
        {leading ?? <View />}
        {trailing ?? <View />}
      </View>
    </View>
  );
}
