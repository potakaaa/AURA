import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

const LIGHT_TOKENS = {
  background: '220 32% 97%',
  foreground: '224 42% 10%',
  card: '220 40% 99%',
  cardForeground: '224 42% 10%',
  popover: '220 40% 99%',
  popoverForeground: '224 42% 10%',
  primary: '272 75% 53%',
  primaryForeground: '220 38% 98%',
  secondary: '193 100% 42%',
  secondaryForeground: '220 35% 10%',
  tertiary: '330 100% 50%',
  tertiaryForeground: '220 38% 98%',
  muted: '221 28% 92%',
  mutedForeground: '220 18% 34%',
  accent: '272 52% 90%',
  accentForeground: '224 42% 10%',
  destructive: '334 96% 47%',
  destructiveForeground: '220 38% 98%',
  border: '220 22% 84%',
  input: '220 22% 84%',
  ring: '272 75% 53%',
  radius: '1.25rem',
  chart1: '272 75% 53%',
  chart2: '193 100% 42%',
  chart3: '330 100% 50%',
  chart4: '220 45% 30%',
  chart5: '220 34% 58%',
  onSurface: '224 42% 10%',
  onSurfaceVariant: '220 18% 34%',
  surfaceDim: '220 32% 97%',
  surfaceContainer: '220 32% 95%',
  surfaceContainerHigh: '220 24% 89%',
  onPrimaryFixed: '0 0% 0%',
  secondaryContainer: '193 100% 28%',
  tertiaryContainer: '330 100% 48%',
  inversePrimary: '272 75% 53%',
  gradientAuraStart: '258 90% 72%',
  gradientAuraEnd: '330 81% 60%',
} as const;

const DARK_TOKENS = {
  background: '220 20% 6%',
  foreground: '220 30% 94%',
  card: '220 24% 9%',
  cardForeground: '220 30% 94%',
  popover: '220 24% 9%',
  popoverForeground: '220 30% 94%',
  primary: '272 78% 64%',
  primaryForeground: '220 35% 8%',
  secondary: '193 100% 53%',
  secondaryForeground: '220 35% 8%',
  tertiary: '330 100% 60%',
  tertiaryForeground: '220 35% 8%',
  muted: '220 22% 15%',
  mutedForeground: '220 16% 74%',
  accent: '220 22% 15%',
  accentForeground: '220 30% 94%',
  destructive: '334 97% 58%',
  destructiveForeground: '220 35% 8%',
  border: '220 18% 20%',
  input: '220 18% 20%',
  ring: '272 78% 64%',
  radius: '1.25rem',
  chart1: '272 78% 64%',
  chart2: '193 100% 53%',
  chart3: '330 100% 60%',
  chart4: '220 40% 72%',
  chart5: '220 30% 46%',
  onSurface: '220 30% 94%',
  onSurfaceVariant: '220 8% 68%',
  surfaceDim: '220 20% 6%',
  surfaceContainer: '220 16% 11%',
  surfaceContainerHigh: '220 14% 16%',
  onPrimaryFixed: '0 0% 0%',
  secondaryContainer: '193 100% 25%',
  tertiaryContainer: '330 100% 51%',
  inversePrimary: '272 73% 50%',
  gradientAuraStart: '272 78% 64%',
  gradientAuraEnd: '330 100% 60%',
} as const;

function asHsl(tokens: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [key, key === 'radius' ? value : `hsl(${value})`])
  ) as Record<string, string>;
}

export const THEME = {
  light: asHsl(LIGHT_TOKENS),
  dark: asHsl(DARK_TOKENS),
};

export const TYPOGRAPHY = {
  display: 'text-5xl font-bold tracking-tight',
  headline: 'text-3xl font-semibold tracking-tight',
  title: 'text-xl font-semibold tracking-tight',
  body: 'text-base leading-6',
  label: 'text-sm font-medium tracking-tight',
} as const;

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};