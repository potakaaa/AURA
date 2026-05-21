import {
  VoiceHubOrb,
  VoiceHubQuickAction,
  VoiceHubQuickActionsRow,
  VoiceHubRadialBackground,
  VoiceHubStateSection,
  VOICE_HUB_TAB_CONTENT_INSET,
} from '@/components/voice-hub';
import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { THEME } from '@/lib/theme';
import { GradientText } from '@/components/welcome/gradient-text';
import { Calendar, FileText, Mail } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = THEME.dark.surfaceDim;

export default function VoiceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topPad = appTopBarOffsetTop(insets.top);
  const bottomPad = VOICE_HUB_TAB_CONTENT_INSET + insets.bottom;
  const [micPermissionMessage, setMicPermissionMessage] = useState<string | null>(null);
  const {
    status,
    isListening,
    partialTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
  } = useSpeechRecognition();

  const speechErrorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (error.code === 'permission_denied') {
      return 'Microphone access is required for voice capture. Enable it in Settings to continue.';
    }

    if (error.code === 'not_available') {
      return 'Speech recognition is unavailable on this device.';
    }

    if (error.code === 'no_speech') {
      return 'No speech was detected. Try speaking closer to your microphone.';
    }

    return error.message || 'Speech recognition failed. Please try again.';
  }, [error]);

  const micDisabled = error?.code === 'permission_denied' || error?.code === 'not_available';

  const handleOrbPress = useCallback(async () => {
    setMicPermissionMessage(null);

    if (micDisabled) {
      setMicPermissionMessage(
        error?.code === 'permission_denied'
          ? 'Microphone access is required to start voice capture. Enable it in Settings to continue.'
          : 'Speech recognition is unavailable on this device.',
      );
      return;
    }

    if (isListening) {
      await stopListening();
      return;
    }

    if (status === 'processing') {
      await cancelListening();
      return;
    }

    try {
      await startListening();
    } catch {
      if (Platform.OS === 'android') {
        setMicPermissionMessage('Unable to start voice capture. Check microphone permission.');
      }
    }
  }, [cancelListening, error?.code, isListening, micDisabled, startListening, status, stopListening]);

  return (
    <AuraScreen>
      <View className="flex-1" style={{ backgroundColor: BG }}>
        <VoiceHubRadialBackground width={width} height={height} />

        <AuthenticatedAppTopBar backgroundColor={BG} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-2xl gap-10 self-center">
            <View className="items-center gap-8">
              <VoiceHubOrb onPress={handleOrbPress} disabled={micDisabled} />

              <View className="w-full items-center gap-6">
                <GradientText
                  variant="surfaceHeadline"
                  className="text-center text-4xl font-extrabold leading-tight tracking-tight"
                  outerClassName="self-center px-1"
                  textStyle={{ fontFamily: 'Manrope_800ExtraBold' }}>
                  How can I assist your focus today?
                </GradientText>

                <VoiceHubQuickActionsRow>
                  <VoiceHubQuickAction
                    label="Summarize emails"
                    icon={Mail}
                    iconClassName="text-primary"
                  />
                  <VoiceHubQuickAction
                    label="Schedule my day"
                    icon={Calendar}
                    iconClassName="text-secondary"
                  />
                  <VoiceHubQuickAction
                    label="Generate briefing"
                    icon={FileText}
                    iconClassName="text-tertiary"
                  />
                </VoiceHubQuickActionsRow>
              </View>
            </View>

            <VoiceHubStateSection
              micPermissionMessage={micPermissionMessage}
              speechStatus={status}
              partialTranscript={partialTranscript}
              finalTranscript={finalTranscript}
              speechErrorMessage={speechErrorMessage}
            />
            <View className="h-2" />
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
