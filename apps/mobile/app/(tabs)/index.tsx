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
import { THEME } from '@/lib/theme';
import { GradientText } from '@/components/welcome/gradient-text';
import { Calendar, FileText, Mail } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = THEME.dark.surfaceDim;

export default function VoiceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topPad = appTopBarOffsetTop(insets.top);
  const bottomPad = VOICE_HUB_TAB_CONTENT_INSET + insets.bottom;

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
              <VoiceHubOrb />

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

            <VoiceHubStateSection />
            <View className="h-2" />
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
