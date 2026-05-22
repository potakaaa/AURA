import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VOICE_HUB } from '@/lib/raw-colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Clock3, Waves } from 'lucide-react-native';
import { useMemo } from 'react';
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
  const transcript = finalTranscript || partialTranscript;
  const status = speechStatus ?? 'idle';
  const isActive = status === 'listening' || status === 'processing';
  const humanStatus = useMemo(
    () => status.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase()),
    [status]
  );

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
      <View className={`gap-4 ${row ? 'flex-row' : 'flex-col'}`}>
        <View
          className={`border-border/30 bg-surface-container/80 min-h-[180px] justify-between rounded-3xl border p-6 ${row ? 'min-w-0 flex-[2]' : 'w-full'}`}>
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
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
            <View className="bg-surface-container-high/80 flex-row items-center gap-2 rounded-full px-3 py-2">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isActive ? VOICE_HUB.statusDotActive : VOICE_HUB.statusDotIdle,
                }}
              />
              <Text
                className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                {humanStatus}
              </Text>
            </View>
          </View>
          <Text
            className="text-on-surface-variant mt-4 max-w-md text-sm leading-relaxed"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            You've reached 85% of your focus goal. Your environmental noise is optimized for
            creative flow.
          </Text>
          <View className="mt-5 flex-row gap-3">
            <View className="bg-surface-container-high/70 flex-1 rounded-2xl px-4 py-3">
              <Icon as={Waves} size={16} className="text-secondary" />
              <Text
                className="text-on-surface mt-2 text-sm font-bold"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Low noise
              </Text>
              <Text
                className="text-on-surface-variant mt-1 text-[11px]"
                style={{ fontFamily: 'Manrope_500Medium' }}>
                Room signal clear
              </Text>
            </View>
            <View className="bg-surface-container-high/70 flex-1 rounded-2xl px-4 py-3">
              <Icon as={Activity} size={16} className="text-tertiary" />
              <Text
                className="text-on-surface mt-2 text-sm font-bold"
                style={{ fontFamily: 'Manrope_700Bold' }}>
                85%
              </Text>
              <Text
                className="text-on-surface-variant mt-1 text-[11px]"
                style={{ fontFamily: 'Manrope_500Medium' }}>
                Focus goal
              </Text>
            </View>
          </View>
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
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View className="w-full items-center">
            <Icon as={Clock3} size={20} className="text-secondary" />
            <Text
              className="text-on-surface mt-3 text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope_800ExtraBold' }}>
              2.4h
            </Text>
            <Text
              className="text-on-surface-variant mt-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ fontFamily: 'Manrope_700Bold' }}>
              Focus Session
            </Text>
            {transcript ? (
              <View
                className="mt-4 w-full rounded-2xl px-3 py-3"
                style={{ backgroundColor: VOICE_HUB.transcriptSurface }}>
                <Text
                  className="text-on-surface text-center text-xs leading-5"
                  numberOfLines={4}
                  style={{ fontFamily: 'Manrope_500Medium' }}>
                  {partialTranscript
                    ? `Listening: ${partialTranscript}`
                    : `Captured: ${transcript}`}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
