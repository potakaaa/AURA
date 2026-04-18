import * as React from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';

const LOGO = require('@/assets/images/aura_logo.png');

export type AuraLogoProps = Omit<ImageProps, 'source'> & {
  /** Default width in logical pixels. */
  width?: number;
  height?: number;
};

/**
 * Raster AURA mark from `assets/images/aura_logo.png`. Pass `style` or `width`/`height` to scale.
 */
export function AuraLogo({
  width = 36,
  height = 32,
  style,
  resizeMode = 'contain',
  accessibilityLabel = 'AURA',
  accessibilityRole = 'image',
  ...rest
}: AuraLogoProps) {
  const resolvedStyle: StyleProp<ImageStyle> = [{ width, height }, style];

  return (
    <Image
      source={LOGO}
      resizeMode={resizeMode}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={resolvedStyle}
      {...rest}
    />
  );
}
