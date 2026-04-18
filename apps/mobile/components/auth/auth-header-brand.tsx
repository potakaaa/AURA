import { AuraLogo } from '@/components/brand/aura-logo';
import { AppTopBar } from '@/components/common';
import { GradientText } from '@/components/welcome/gradient-text';
import { THEME } from '@/lib/theme';
import { StyleSheet, View } from 'react-native';

/**
 * App top bar: raster mark + “AURA” wordmark in one row, centered on the full bar
 * (avoids skew from `justify-between` + empty trailing slot).
 */
export function AuthHeaderBrand() {
  return (
    <AppTopBar
      backgroundColor={THEME.dark.surfaceDim}
      leading={
        <View
          pointerEvents="box-none"
          style={StyleSheet.absoluteFillObject}
          className="flex-row items-center justify-center gap-2">
          <AuraLogo width={36} height={32} />
          <GradientText variant="aura" className="text-2xl font-black tracking-tighter">
            AURA
          </GradientText>
        </View>
      }
    />
  );
}
