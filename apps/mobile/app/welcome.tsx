import { AuthHeaderBrand } from '@/components/auth/auth-header-brand';
import { APP_TOP_BAR_INNER_HEIGHT } from '@/components/common';
import { GradientText } from '@/components/welcome/gradient-text';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  PRIMARY_RGB,
  RIPPLE,
  rgbaBlack,
  rgbaWhite,
  SECONDARY_RGB,
  SURFACE_DIM_RGB,
  WELCOME,
} from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useRef } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ChevronRight, Lock, Network, Sparkles } from 'lucide-react-native';

const HERO_IMAGE = require('@/assets/images/welcome_onboarding_image.png');

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

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.onPrimaryFixed,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  android: { elevation: 6 },
  default: {},
});

/** Space between the header edge and the first line of scroll content (eyebrow). */
const HEADER_BOTTOM_GAP = 24;

const ONBOARDING_TITLE_TEXT: TextStyle = {
  fontFamily: 'Manrope_800ExtraBold',
  fontSize: 48,
  lineHeight: 52,
  letterSpacing: -1.75,
  includeFontPadding: false,
  ...Platform.select({
    ios: {
      textShadowColor: rgbaBlack(0.55),
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 5,
    },
    android: {
      textShadowColor: rgbaBlack(0.4),
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    default: {},
  }),
};

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

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();

  const topPad = insets.top;
  const bottomPad = Math.max(insets.bottom, 16);
  const contentTop = topPad + APP_TOP_BAR_INNER_HEIGHT + HEADER_BOTTOM_GAP;

  return (
    <View className="flex-1" style={{ backgroundColor: BG_BASE }}>
      <WelcomeRadialBackground width={width} height={height} />

      <AuthHeaderBrand backgroundColor={BG_BASE} />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingTop: contentTop,
          paddingBottom: bottomPad + 32,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-8">
          <View className="gap-5">
            <View className="border-secondary/25 bg-secondary/10 self-start rounded-full border px-3.5 py-2">
              <View className="flex-row items-center gap-2">
                <Sparkles size={14} color={THEME.dark.secondary} />
                <Text
                  className="text-secondary text-[11px] font-bold uppercase tracking-[0.22em]"
                  style={{ fontFamily: 'Manrope_700Bold' }}>
                  Neural Synchronized Presence
                </Text>
              </View>
            </View>
            <View className="gap-0.5">
              <Text className="text-white" style={ONBOARDING_TITLE_TEXT}>
                Experience
              </Text>
              <GradientText variant="headline" textStyle={ONBOARDING_TITLE_TEXT}>
                Intelligence Unbound
              </GradientText>
            </View>
            <Text
              className="text-muted-foreground text-[17px] leading-[26px]"
              style={{ fontFamily: 'Manrope_500Medium' }}>
              Transcend traditional interaction. Aura adapts to your cognitive patterns, evolving
              alongside your digital consciousness in an ethereal flow of insight.
            </Text>
            <View className="mt-1 flex-row flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5">
              {['Voice-first', 'Private by design', 'On-device aware'].map((label) => (
                <View key={label} className="flex-row items-center gap-2">
                  <View className="bg-primary h-1.5 w-1.5 rounded-full" />
                  <Text
                    className="text-muted-foreground text-xs font-semibold tracking-wide"
                    style={{ fontFamily: 'Manrope_600SemiBold' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="flex-col gap-3 pt-1">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login' as Href)}
              android_ripple={{ color: RIPPLE.onPrimary }}
              className="w-full flex-row items-center justify-center gap-1 rounded-full py-[18px] active:opacity-90"
              style={[{ backgroundColor: THEME.dark.primary }, PRIMARY_CTA_SHADOW]}>
              <Text
                className="text-primary-foreground text-base font-bold"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Get Started
              </Text>
              <Icon as={ChevronRight} size={22} color={THEME.dark.primaryForeground} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              android_ripple={{ color: rgbaWhite(0.12) }}
              className="w-full items-center rounded-full border border-white/[0.14] bg-white/[0.05] py-[18px] active:opacity-90">
              <Text
                className="text-foreground text-base font-bold"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Learn More
              </Text>
            </Pressable>
          </View>

          <View
            className="relative aspect-[16/10] w-full overflow-hidden rounded-[32px]"
            style={CARD_SHADOW}>
            <LinearGradient
              colors={[
                `rgba(${PRIMARY_RGB},0.22)`,
                `rgba(${SECONDARY_RGB},0.12)`,
                `rgba(${SURFACE_DIM_RGB},0.4)`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="bg-card absolute inset-[1px] overflow-hidden rounded-[31px] border border-white/[0.1]">
              <Image source={HERO_IMAGE} className="h-full w-full" resizeMode="cover" />
              <LinearGradient
                colors={[
                  'transparent',
                  `rgba(${SURFACE_DIM_RGB},0.55)`,
                  `rgba(${SURFACE_DIM_RGB},0.97)`,
                ]}
                locations={[0.28, 0.62, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <LinearGradient
                colors={[`rgba(${SECONDARY_RGB},0.12)`, 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0.4, y: 0 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-8">
                <Text
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'Manrope_700Bold' }}>
                  Adaptive Oracle
                </Text>
                <Text
                  className="text-muted-foreground mt-1 text-sm"
                  style={{ fontFamily: 'Manrope_500Medium' }}>
                  Real-time neural pattern mapping
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-col gap-4">
            <View
              className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.035] p-7"
              style={CARD_SHADOW}>
              <View className="flex-row gap-5">
                <View className="border-secondary/20 bg-secondary/10 h-14 w-14 items-center justify-center rounded-2xl border">
                  <Icon as={Network} size={26} color={THEME.dark.secondary} />
                </View>
                <View className="flex-1 gap-2.5">
                  <Text
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Manrope_700Bold' }}>
                    Neural Sync
                  </Text>
                  <Text
                    className="text-muted-foreground text-sm leading-[22px]"
                    style={{ fontFamily: 'Manrope_500Medium' }}>
                    Seamless integration between your device ecosystem and our distributed
                    intelligence core.
                  </Text>
                </View>
              </View>
            </View>
            <View
              className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.035] p-7"
              style={CARD_SHADOW}>
              <View className="flex-row gap-5">
                <View className="border-tertiary/25 bg-tertiary/10 h-14 w-14 items-center justify-center rounded-2xl border">
                  <Icon as={Lock} size={26} color={THEME.dark.tertiary} />
                </View>
                <View className="flex-1 gap-2.5">
                  <Text
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Manrope_700Bold' }}>
                    Vault Secure
                  </Text>
                  <Text
                    className="text-muted-foreground text-sm leading-[22px]"
                    style={{ fontFamily: 'Manrope_500Medium' }}>
                    Quantum-resistant encryption layers ensuring your cognitive data remains yours
                    alone.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
