import { WELCOME } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Same dual-radial treatment as `WelcomeRadialBackground` — soft purple + cyan washes on `surfaceDim`. */
const BG_BASE = THEME.dark.surfaceDim;

export function VoiceHubRadialBackground({ width, height }: { width: number; height: number }) {
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
        <RadialGradient id="voiceHubRadialGlow" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialGlowStart} stopOpacity="1" />
          <Stop offset="0.38" stopColor={WELCOME.radialGlowMid} stopOpacity="1" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient
          id="voiceHubRadialAccent"
          cx={cxAccent}
          cy={cyAccent}
          r={rAccent}
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialAccentStart} stopOpacity="0.55" />
          <Stop offset="0.42" stopColor={WELCOME.radialAccentMid} stopOpacity="0.22" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#voiceHubRadialGlow)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#voiceHubRadialAccent)" />
    </Svg>
  );
}
