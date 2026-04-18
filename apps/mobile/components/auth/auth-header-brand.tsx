import { AuraLogo } from '@/components/brand/aura-logo';
import { AppTopBar } from '@/components/common';
import { GradientText } from '@/components/welcome/gradient-text';
import { THEME } from '@/lib/theme';
import { View } from 'react-native';

type AuthHeaderBrandProps = {
  /** Bar fill; defaults to theme surface dim. */
  backgroundColor?: string;
};

/**
 * App top bar: raster mark + “AURA” wordmark in one row, centered on the bar.
 * Uses `trailing={false}` so the bar is a single flex row (no empty trailing slot skew).
 */
export function AuthHeaderBrand({
  backgroundColor = THEME.dark.surfaceDim,
}: AuthHeaderBrandProps) {
  return (
    <AppTopBar
      backgroundColor={backgroundColor}
      trailing={false}
      leading={
        <View className="flex-row items-center justify-center gap-2">
          <AuraLogo width={36} height={32} />
          <GradientText
            variant="aura"
            className="text-2xl font-black tracking-tighter"
            outerClassName="self-center"
          >
            AURA
          </GradientText>
        </View>
      }
    />
  );
}
