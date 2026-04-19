import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VOICE_HUB_TAB_CONTENT_INSET } from '@/components/voice-hub';

export default function InsightTabScreen() {
  const insets = useSafeAreaInsets();

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar />
        <View
          className="flex-1 items-center justify-center px-6"
          style={{
            paddingTop: appTopBarOffsetTop(insets.top),
            paddingBottom: VOICE_HUB_TAB_CONTENT_INSET + insets.bottom,
          }}>
          <Text
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'Manrope_700Bold' }}>
            Insight
          </Text>
          <Text
            className="mt-2 text-center text-muted-foreground"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            Placeholder — UI only
          </Text>
        </View>
      </View>
    </AuraScreen>
  );
}
