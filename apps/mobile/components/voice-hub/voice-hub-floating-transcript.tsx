import { Text } from '@/components/ui/text';
import { VOICE_HUB } from '@/lib/raw-colors';
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
      className="w-[176px] overflow-hidden rounded-2xl border px-3 py-2"
      style={{
        backgroundColor: VOICE_HUB.transcriptSurface,
        borderColor: VOICE_HUB.floatingTranscriptBorder,
      }}>
      <View className="mb-1 flex-row items-center justify-center gap-1.5">
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: VOICE_HUB.statusDotActive }}
        />
        <Text
          className="text-secondary text-center text-[8px] font-bold uppercase tracking-widest"
          style={{ fontFamily: 'Manrope_700Bold' }}>
          {isListening ? 'Live' : 'Captured'}
        </Text>
      </View>
      <Text
        className="text-on-surface text-center text-[11px] leading-4"
        numberOfLines={2}
        style={{ fontFamily: 'Manrope_700Bold' }}>
        {message}
      </Text>
    </View>
  );
}
