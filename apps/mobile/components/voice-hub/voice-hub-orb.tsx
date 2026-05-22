import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { rgbaWhite, VOICE_HUB } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Sparkles } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

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

type VoiceHubOrbProps = {
  onPress?: () => void;
  disabled?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
};

/** Glass-style orb: radial-style linear gradient, soft highlight, center sparkle, outer rings. */
export function VoiceHubOrb({ onPress, disabled, isListening, isProcessing }: VoiceHubOrbProps) {
  const statusLabel = isListening ? 'Listening' : isProcessing ? 'Processing' : 'Tap to speak';

  return (
    <Pressable
      className="relative aspect-square w-full max-w-md items-center justify-center self-center"
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop voice capture' : 'Activate voice capture'}
      onPress={onPress}
      disabled={disabled}
      style={disabled ? { opacity: 0.7 } : undefined}>
      <View
        className="absolute h-[72%] w-[72%] rounded-full border"
        style={{
          borderColor: isListening ? VOICE_HUB.orbRingActive : VOICE_HUB.orbRingOuter,
          opacity: isListening ? 0.88 : 0.62,
        }}
      />
      <View
        className="absolute h-[91%] w-[91%] rounded-full border"
        style={{
          borderColor: isListening ? VOICE_HUB.orbRingActiveSoft : VOICE_HUB.orbRingInner,
          opacity: isProcessing ? 0.9 : 1,
        }}
      />
      <View
        className="absolute h-full w-full rounded-full border"
        style={{
          borderColor: VOICE_HUB.orbHalo,
          opacity: isListening || isProcessing ? 0.75 : 0.36,
        }}
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
          <View className="items-center gap-3">
            <View
              className="h-16 w-16 items-center justify-center rounded-full border"
              style={{
                backgroundColor: rgbaWhite(isListening ? 0.18 : 0.11),
                borderColor: rgbaWhite(0.2),
              }}>
              <Icon
                as={isListening ? Mic : Sparkles}
                size={isListening ? 34 : SPARKLE_SIZE}
                className="text-on-surface opacity-95"
              />
            </View>
            <Text
              className="text-on-surface text-xs font-bold uppercase tracking-widest"
              style={{ fontFamily: 'Manrope_700Bold' }}>
              {statusLabel}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
