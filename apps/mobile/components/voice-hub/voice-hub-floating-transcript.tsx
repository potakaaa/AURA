import { Text } from '@/components/ui/text';
import { VOICE_HUB } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

type VoiceHubFloatingTranscriptProps = {
  transcript?: string;
  isListening?: boolean;
};

export function VoiceHubFloatingTranscript({
  transcript,
  isListening,
}: VoiceHubFloatingTranscriptProps) {
  const message = transcript?.trim();

  if (!message) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 z-10 items-center px-4"
      style={{ top: -4 }}>
      <LinearGradient
        colors={[...VOICE_HUB.floatingTranscriptGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="max-w-[92%] overflow-hidden rounded-[28px] border px-5 py-4"
        style={{
          borderColor: VOICE_HUB.floatingTranscriptBorder,
          shadowColor: THEME.dark.secondary,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 10,
        }}>
        <View
          className="absolute left-5 right-5 top-0 h-px"
          style={{ backgroundColor: VOICE_HUB.floatingTranscriptHighlight }}
        />
        <View className="mb-3 flex-row items-center justify-center gap-2">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: VOICE_HUB.statusDotActive }}
          />
          <Text
            className="text-secondary text-center text-[10px] font-bold uppercase tracking-widest"
            style={{ fontFamily: 'Manrope_700Bold' }}>
            {isListening ? 'Live transcript' : 'Captured'}
          </Text>
        </View>
        <Text
          className="text-on-surface text-center text-lg leading-7"
          numberOfLines={4}
          style={{ fontFamily: 'Manrope_700Bold' }}>
          &ldquo;{message}&rdquo;
        </Text>
      </LinearGradient>
    </View>
  );
}
