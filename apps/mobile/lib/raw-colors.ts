/**
 * Literal color strings not represented as CSS variables (--*) / Tailwind tokens.
 * Prefer `THEME` from `@/lib/theme` and NativeWind `className` first; add here only when needed.
 */
import { THEME } from '@/lib/theme';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace('#', '');
  if (raw.length !== 6) return null;
  const n = Number.parseInt(raw, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Parses `hsl(H S% L%)` or `#RRGGBB` (React Native / design tokens). */
export function parseCssColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const h = color.trim();
  if (h.startsWith('#')) return hexToRgb(h);
  const mm = h.match(/^hsl\(\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s*\)$/i);
  if (mm) return hslToRgb(Number(mm[1]), Number(mm[2]), Number(mm[3]));
  return null;
}

export function rgbaBlack(alpha: number): string {
  return `rgba(0, 0, 0, ${alpha})`;
}

export function rgbaWhite(alpha: number): string {
  return `rgba(255, 255, 255, ${alpha})`;
}

type DarkRgbKey = 'primary' | 'secondary' | 'surfaceDim';

function commaRgbFromTheme(key: DarkRgbKey): string {
  const rgb = parseCssColorToRgb(THEME.dark[key]);
  return rgb ? `${rgb.r},${rgb.g},${rgb.b}` : '0,0,0';
}

/** Comma-separated RGB for `rgba(${PRIMARY_RGB}, a)` (dark theme primary). */
export const PRIMARY_RGB = commaRgbFromTheme('primary');

/** Comma-separated RGB for cyan/secondary accents (dark theme secondary). */
export const SECONDARY_RGB = commaRgbFromTheme('secondary');

/** Comma-separated RGB for dark surfaces (dark theme surface dim). */
export const SURFACE_DIM_RGB = commaRgbFromTheme('surfaceDim');

export const BAR = {
  topVignette: [rgbaBlack(0.2), rgbaBlack(0)] as const,
  topSheen: [rgbaWhite(0.07), rgbaWhite(0)] as const,
  ambientGlow: ['transparent', `rgba(${PRIMARY_RGB},0.07)`, 'transparent'] as const,
  bottomEdge: [rgbaWhite(0), `rgba(${PRIMARY_RGB},0.14)`, rgbaWhite(0.1)] as const,
} as const;

/** Minimal top bar (two gradients only). */
export const BAR_SIMPLE = {
  topSheen: [rgbaWhite(0.055), rgbaWhite(0)] as const,
  bottomEdge: [rgbaWhite(0), rgbaWhite(0.09)] as const,
} as const;

/** Welcome screen SVG / one-off illustration stops (not in design tokens yet). */
export const WELCOME = {
  radialGlowStart: '#1a1230',
  radialGlowMid: '#0c0a14',
  radialAccentStart: '#143a44',
  radialAccentMid: '#0a1620',
} as const;

/** Android ripple tints where `android_ripple` needs a literal. */
export const RIPPLE = {
  onPrimary: 'rgba(20, 8, 31, 0.25)',
} as const;
