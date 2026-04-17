import { APP_TOP_BAR_INNER_HEIGHT, AppTopBar } from '@/components/common';
import { GradientText } from '@/components/welcome/gradient-text';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { Lock, Network, Settings, User } from 'lucide-react-native';

const HERO_IMAGE = require('@/assets/images/welcome_onboarding_image.png');

const BG_BASE = '#050505';
const PRIMARY_CTA = '#C894FF';
const PRIMARY_CTA_LABEL = '#14081f';

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
      textShadowColor: 'rgba(0, 0, 0, 0.55)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 5,
    },
    android: {
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
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

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient
          id="welcomeRadialGlow"
          cx={cx}
          cy={cy}
          r={r}
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1a1230" stopOpacity="1" />
          <Stop offset="0.38" stopColor="#0c0a14" stopOpacity="1" />
          <Stop offset="1" stopColor={BG_BASE} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#welcomeRadialGlow)" />
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

      <AppTopBar
        backgroundColor={BG_BASE}
        leading={
          <View className="flex-row items-center gap-4">
            <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
              <Icon as={User} size={20} className="text-on-surface-variant" />
            </View>
            <GradientText variant="aura" className="text-2xl font-black tracking-tighter">
              AURA
            </GradientText>
          </View>
        }
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="active:opacity-80">
            <Icon as={Settings} size={28} className="text-muted-foreground" />
          </Pressable>
        }
      />

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
            <Text
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ fontFamily: 'Manrope_700Bold', color: '#5ee7ff' }}>
              Neural Synchronized Presence
            </Text>
            <View className="gap-0.5">
              <Text className="text-white" style={ONBOARDING_TITLE_TEXT}>
                Experience
              </Text>
              <GradientText variant="headline" textStyle={ONBOARDING_TITLE_TEXT}>
                Intelligence Unbound
              </GradientText>
            </View>
            <Text
              className="text-base leading-relaxed"
              style={{ fontFamily: 'Manrope_500Medium', color: '#949494' }}>
              Transcend traditional interaction. Aura adapts to your cognitive patterns, evolving
              alongside your digital consciousness in an ethereal flow of insight.
            </Text>
          </View>

          <View className="flex-col gap-3 pt-1">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)')}
              className="w-full items-center rounded-full py-[18px] active:opacity-90"
              style={{ backgroundColor: PRIMARY_CTA }}>
              <Text
                className="text-base font-bold"
                style={{ fontFamily: 'Manrope_700Bold', color: PRIMARY_CTA_LABEL }}>
                Get Started
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              className="w-full items-center rounded-full border border-white/10 bg-white/[0.06] py-[18px] active:opacity-90">
              <Text
                className="text-base font-bold text-white/90"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Learn More
              </Text>
            </Pressable>
          </View>

          <View className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-white/[0.08]">
            <Image source={HERO_IMAGE} className="h-full w-full" resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(5,5,5,0.92)']}
              locations={[0.35, 1]}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View className="absolute bottom-6 left-6 right-6">
              <Text
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Adaptive Oracle
              </Text>
              <Text
                className="text-sm"
                style={{ fontFamily: 'Manrope_500Medium', color: '#a8a8a8' }}>
                Real-time neural pattern mapping
              </Text>
            </View>
          </View>

          <View className="flex-col gap-4">
            <View className="gap-4 rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#4DEBFF]/15">
                <Icon as={Network} size={24} color="#4DEBFF" />
              </View>
              <Text className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope_700Bold' }}>
                Neural Sync
              </Text>
              <Text
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'Manrope_500Medium', color: '#949494' }}>
                Seamless integration between your device ecosystem and our distributed intelligence
                core.
              </Text>
            </View>
            <View className="gap-4 rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#ff6bcd]/12">
                <Icon as={Lock} size={24} color="#ff8ad4" />
              </View>
              <Text className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope_700Bold' }}>
                Vault Secure
              </Text>
              <Text
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'Manrope_500Medium', color: '#949494' }}>
                Quantum-resistant encryption layers ensuring your cognitive data remains yours alone.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
