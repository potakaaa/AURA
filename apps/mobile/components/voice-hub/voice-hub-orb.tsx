import { Icon } from '@/components/ui/icon';
import { rgbaWhite, VOICE_HUB } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Platform, View } from 'react-native';

const ORB_SIZE = 256;
const ORB_RADIUS = ORB_SIZE / 2;

const ORB_GLOW = Platform.select({
  ios: {
    shadowColor: THEME.dark.inversePrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 42,
  },
  android: {
    elevation: 14,
    shadowColor: THEME.dark.secondary,
  },
  default: {},
});

const SPARKLE_SIZE = 56;

/** Glass-style orb: radial-style linear gradient, soft highlight, center sparkle, outer rings. */
export function VoiceHubOrb() {
  return (
    <View className="relative aspect-square w-full max-w-lg items-center justify-center self-center">
      <View
        className="absolute h-[80%] w-[80%] rounded-full border"
        style={{ borderColor: VOICE_HUB.orbRingOuter }}
      />
      <View
        className="absolute h-[95%] w-[95%] rounded-full border"
        style={{ borderColor: VOICE_HUB.orbRingInner }}
      />

      <View style={[{ width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_RADIUS }, ORB_GLOW]}>
        <LinearGradient
          colors={[
            THEME.dark.primary,
            THEME.dark.inversePrimary,
            THEME.dark.secondary,
            THEME.dark.background,
          ]}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.9, y: 0.95 }}
          style={{
            width: ORB_SIZE,
            height: ORB_SIZE,
            borderRadius: ORB_RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          <View
            pointerEvents="none"
            style={{
              ...Platform.select({
                ios: { backgroundColor: rgbaWhite(0.12) },
                android: { backgroundColor: rgbaWhite(0.1) },
                default: { backgroundColor: rgbaWhite(0.12) },
              }),
              opacity: 0.45,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Icon as={Sparkles} size={SPARKLE_SIZE} className="text-on-surface opacity-95" />
        </LinearGradient>
      </View>
    </View>
  );
}
