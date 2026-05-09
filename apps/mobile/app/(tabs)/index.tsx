import {
  VoiceHubOrb,
  VoiceHubQuickAction,
  VoiceHubQuickActionsRow,
  VoiceHubRadialBackground,
  VoiceHubStateSection,
  useSTT,
  VOICE_HUB_TAB_CONTENT_INSET,
} from '@/components/voice-hub';
import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { THEME } from '@/lib/theme';
import { GradientText } from '@/components/welcome/gradient-text';
import { Calendar, FileText, Mail } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { PermissionsAndroid, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = THEME.dark.surfaceDim;

export default function VoiceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topPad = appTopBarOffsetTop(insets.top);
  const bottomPad = VOICE_HUB_TAB_CONTENT_INSET + insets.bottom;
  const [micPermissionMessage, setMicPermissionMessage] = useState<string | null>(null);
  const { isListening, startListening } = useSTT();

  const requestMicPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setMicPermissionMessage(null);
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

    try {
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        setMicPermissionMessage(null);
        return true;
      }

      const result = await PermissionsAndroid.request(permission);
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        setMicPermissionMessage(null);
        return true;
      }

      setMicPermissionMessage(
        'Microphone access is required to start voice capture. Enable it in Settings to continue.',
      );
      return false;
    } catch (error) {
      setMicPermissionMessage('Unable to request microphone access. Try again.');
      return false;
    }
  }, []);

  const handleOrbPress = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      if (!granted) {
        const didGrant = await requestMicPermission();
        if (!didGrant) {
          return;
        }
      }
    }
    if (!isListening) {
      await startListening();
    }
  }, [isListening, requestMicPermission, startListening]);

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
              <VoiceHubOrb onPress={handleOrbPress} disabled={isListening} />

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

            <VoiceHubStateSection micPermissionMessage={micPermissionMessage} />
            <View className="h-2" />
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
