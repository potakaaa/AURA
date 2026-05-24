import { Text } from '@/components/ui/text';
import { RIPPLE, rgbaWhite, SURFACE_DIM_RGB, WELCOME } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  type TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';

const BG_BASE = THEME.dark.surfaceDim;

const PRIMARY_CTA_SHADOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  android: { elevation: 8 },
  default: {},
});
const ONBOARDING_TITLE_TEXT: TextStyle = {
  fontFamily: 'Manrope_700Bold',
  fontSize: 30,
  lineHeight: 36,
  letterSpacing: -0.6,
  textAlign: 'center',
  includeFontPadding: false,
};

const ONBOARDING_BODY_TEXT: TextStyle = {
  fontFamily: 'Manrope_500Medium',
  fontSize: 15,
  lineHeight: 22,
  textAlign: 'center',
};

type OnboardingPage = {
  key: string;
  title: string;
  subtitle: string;
  variant: 'seed' | 'signal' | 'sanctuary';
};

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    key: 'clarity',
    title: 'Grow your clarity every day',
    subtitle: 'Lightweight guidance that keeps you steady, focused, and present.',
    variant: 'seed',
  },
  {
    key: 'noise',
    title: 'Quiet the noise, keep momentum',
    subtitle: 'Aura filters distractions so your goals stay front and center.',
    variant: 'signal',
  },
  {
    key: 'flow',
    title: 'We plant the cues. You shape the flow.',
    subtitle: 'Personalized guidance tuned to your rhythm and intent.',
    variant: 'sanctuary',
  },
];

function WelcomeRadialBackground({ width, height }: { width: number; height: number }) {
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
        <RadialGradient id="welcomeRadialGlow" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialGlowStart} stopOpacity="1" />
          <Stop offset="0.38" stopColor={WELCOME.radialGlowMid} stopOpacity="1" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient
          id="welcomeRadialAccent"
          cx={cxAccent}
          cy={cyAccent}
          r={rAccent}
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={WELCOME.radialAccentStart} stopOpacity="0.55" />
          <Stop offset="0.42" stopColor={WELCOME.radialAccentMid} stopOpacity="0.22" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#welcomeRadialGlow)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#welcomeRadialAccent)" />
    </Svg>
  );
}

function PlaceholderIllustration({ variant }: { variant: OnboardingPage['variant'] }) {
  const palette = useMemo(() => {
    if (variant === 'signal') {
      return {
        base: `rgba(${SURFACE_DIM_RGB},0.52)`,
        accent: THEME.dark.secondary,
        glow: THEME.dark.primary,
      };
    }

    if (variant === 'sanctuary') {
      return {
        base: `rgba(${SURFACE_DIM_RGB},0.6)`,
        accent: THEME.dark.primary,
        glow: THEME.dark.secondary,
      };
    }

    return {
      base: `rgba(${SURFACE_DIM_RGB},0.55)`,
      accent: THEME.dark.tertiary,
      glow: THEME.dark.primary,
    };
  }, [variant]);

  return (
    <View className="items-center justify-center">
      <View className="h-56 w-56 items-center justify-center">
        <LinearGradient
          colors={[palette.glow, palette.base]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            height: 190,
            width: 190,
            borderRadius: 95,
          }}
        />
        <View
          className="items-center justify-center"
          style={{
            height: 150,
            width: 150,
            borderRadius: 40,
            backgroundColor: palette.base,
            borderWidth: 1,
            borderColor: rgbaWhite(0.18),
          }}>
          <View
            style={{
              height: 70,
              width: 70,
              borderRadius: 35,
              backgroundColor: palette.accent,
              borderWidth: 1,
              borderColor: rgbaWhite(0.2),
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingPage>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const topPad = Math.max(insets.top, 16);
  const bottomPad = Math.max(insets.bottom, 16);

  const isLast = activeIndex === ONBOARDING_PAGES.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      return;
    }

    const nextIndex = Math.min(activeIndex + 1, ONBOARDING_PAGES.length - 1);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [activeIndex, isLast]);

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(nextIndex);
    },
    [width]
  );

  const renderItem = useCallback(
    ({ item }: { item: OnboardingPage }) => (
      <View style={{ width }}>
        <View className="flex-1 px-6" style={{ paddingTop: 24 }}>
          <View className="items-center gap-3">
            <Text className="text-foreground" style={ONBOARDING_TITLE_TEXT}>
              {item.title}
            </Text>
            <Text className="text-muted-foreground" style={ONBOARDING_BODY_TEXT}>
              {item.subtitle}
            </Text>
          </View>
          <View className="flex-1 items-center justify-center">
            <PlaceholderIllustration variant={item.variant} />
          </View>
        </View>
      </View>
    ),
    [width]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: BG_BASE }}>
      <WelcomeRadialBackground width={width} height={height} />
      <View className="flex-1">
        <View style={{ paddingTop: topPad, paddingHorizontal: 24 }}>
          <Text
            className="text-muted-foreground text-center text-xs uppercase tracking-[0.24em]"
            style={{ fontFamily: 'Manrope_600SemiBold' }}>
            Aura
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={ONBOARDING_PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          contentContainerStyle={{ flexGrow: 1 }}
        />

        <View style={{ paddingHorizontal: 24, paddingBottom: bottomPad + 24 }}>
          <View className="flex-row justify-center gap-2 pb-5">
            {ONBOARDING_PAGES.map((page, index) => {
              const isActive = index === activeIndex;
              return (
                <View
                  key={page.key}
                  style={{
                    height: 6,
                    width: isActive ? 20 : 6,
                    borderRadius: 999,
                    backgroundColor: isActive
                      ? THEME.dark.primary
                      : rgbaWhite(0.3),
                  }}
                />
              );
            })}
          </View>

          {isLast ? (
            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/signup' as Href)}
                android_ripple={{ color: RIPPLE.onPrimary }}
                className="w-full flex-row items-center justify-center gap-1 rounded-full py-[18px] active:opacity-90"
                style={[{ backgroundColor: THEME.dark.primary }, PRIMARY_CTA_SHADOW]}>
                <Text
                  className="text-primary-foreground text-base font-bold"
                  style={{ fontFamily: 'Manrope_700Bold' }}>
                  Create account
                </Text>
                <ChevronRight size={20} color={THEME.dark.primaryForeground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/login' as Href)}
                android_ripple={{ color: rgbaWhite(0.12) }}
                className="w-full items-center rounded-full border border-white/[0.14] bg-white/[0.05] py-[18px] active:opacity-90">
                <Text
                  className="text-foreground text-base font-bold"
                  style={{ fontFamily: 'Manrope_700Bold' }}>
                  Log in
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={handleNext}
              android_ripple={{ color: RIPPLE.onPrimary }}
              className="w-full flex-row items-center justify-center gap-1 rounded-full py-[18px] active:opacity-90"
              style={[{ backgroundColor: THEME.dark.primary }, PRIMARY_CTA_SHADOW]}>
              <Text
                className="text-primary-foreground text-base font-bold"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Next
              </Text>
              <ChevronRight size={20} color={THEME.dark.primaryForeground} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
