import { APP_TOP_BAR_INNER_HEIGHT } from '@/components/common';
import { rgbaBlack, WELCOME } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const BG_BASE = THEME.dark.surfaceDim;

const HEADER_BOTTOM_GAP = 24;

function AuthAmbientBackground({ width, height }: { width: number; height: number }) {
  const cx = width * 0.12;
  const cy = height * 0.06;
  const r = Math.max(width, height) * 1.05;

  const cxAccent = width * 0.82;
  const cyAccent = height * 0.42;
  const rAccent = Math.max(width, height) * 0.72;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id="authRadialGlow" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialGlowStart} stopOpacity="1" />
          <Stop offset="0.38" stopColor={WELCOME.radialGlowMid} stopOpacity="1" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient
          id="authRadialAccent"
          cx={cxAccent}
          cy={cyAccent}
          r={rAccent}
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialAccentStart} stopOpacity="0.55" />
          <Stop offset="0.42" stopColor={WELCOME.radialAccentMid} stopOpacity="0.22" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#authRadialGlow)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#authRadialAccent)" />
    </Svg>
  );
}

type AuthScreenShellProps = PropsWithChildren<{
  footer?: ReactNode;
}>;

/**
 * Dark auth layout: ambient background, keyboard-aware scroll, safe-area padding below the app top bar.
 * Render {@link AppTopBar} as a sibling above this shell (same pattern as welcome).
 */
export function AuthScreenShell({ children, footer }: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const topPad = insets.top;
  const bottomPad = Math.max(insets.bottom, 16);
  const contentTop = topPad + APP_TOP_BAR_INNER_HEIGHT + HEADER_BOTTOM_GAP;

  return (
    <View className="flex-1" style={{ backgroundColor: BG_BASE }}>
      <AuthAmbientBackground width={width} height={height} />
      <LinearGradient
        pointerEvents="none"
        colors={[rgbaBlack(0.35), 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: contentTop,
            paddingBottom: bottomPad + 32,
            paddingHorizontal: 24,
            flexGrow: 1,
          }}>
          <View className="gap-6">{children}</View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
