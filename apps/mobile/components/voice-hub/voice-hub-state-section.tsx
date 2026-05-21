import { Text } from '@/components/ui/text';
import { VOICE_HUB } from '@/lib/raw-colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions, View } from 'react-native';

type VoiceHubStateSectionProps = {
  micPermissionMessage?: string | null;
  speechStatus?: string;
  partialTranscript?: string;
  finalTranscript?: string;
  speechErrorMessage?: string | null;
};

export function VoiceHubStateSection({
  micPermissionMessage,
  speechStatus,
  partialTranscript,
  finalTranscript,
  speechErrorMessage,
}: VoiceHubStateSectionProps) {
  const { width } = useWindowDimensions();
  const row = width >= 720;

  return (
    <View className="w-full max-w-4xl gap-6 self-center">
      {micPermissionMessage ? (
        <View className="border-border/40 bg-surface-container/70 w-full rounded-2xl border px-4 py-3">
          <Text
            className="text-on-surface-variant text-xs font-medium"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            {micPermissionMessage}
          </Text>
        </View>
      ) : null}
      {speechErrorMessage ? (
        <View className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
          <Text
            className="text-xs font-medium text-red-200"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            {speechErrorMessage}
          </Text>
        </View>
      ) : null}
      <View className={`gap-6 ${row ? 'flex-row' : 'flex-col'}`}>
        <View
          className={`border-border/30 bg-surface-container/80 min-h-[160px] justify-between rounded-3xl border p-8 ${row ? 'min-w-0 flex-[2]' : 'w-full'}`}>
          <View>
            <Text
              className="text-primary mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ fontFamily: 'Manrope_700Bold' }}>
              Current State
            </Text>
            <Text
              className="text-on-surface text-xl font-bold"
              style={{ fontFamily: 'Manrope_700Bold' }}>
              Digital Wellbeing Balanced
            </Text>
          </View>
          <Text
            className="text-on-surface-variant mt-4 max-w-md text-sm leading-relaxed"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            You've reached 85% of your focus goal. Your environmental noise is optimized for creative flow.
          </Text>
          <Text
            className="text-on-surface-variant mt-3 text-xs uppercase tracking-widest"
            style={{ fontFamily: 'Manrope_700Bold' }}>
            Voice Status: {speechStatus ?? 'idle'}
          </Text>
        </View>

        <LinearGradient
          colors={[...VOICE_HUB.focusSessionGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight: 140,
            flex: row ? 1 : undefined,
            width: row ? undefined : '100%',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: VOICE_HUB.sessionCardBorder,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View className="items-center">
            <Text
              className="text-on-surface text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope_800ExtraBold' }}>
              2.4h
            </Text>
            <Text
              className="text-on-surface-variant mt-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ fontFamily: 'Manrope_700Bold' }}>
              Focus Session
            </Text>
            {partialTranscript ? (
              <Text
                className="text-on-surface mt-3 text-center text-xs"
                style={{ fontFamily: 'Manrope_500Medium' }}>
                Listening: {partialTranscript}
              </Text>
            ) : null}
            {finalTranscript ? (
              <Text
                className="text-on-surface mt-2 text-center text-xs"
                style={{ fontFamily: 'Manrope_500Medium' }}>
                Final: {finalTranscript}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
