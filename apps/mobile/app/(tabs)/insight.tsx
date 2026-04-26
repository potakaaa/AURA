import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CloudOff, Box, ZapOff } from 'lucide-react-native';

import { VOICE_HUB_TAB_CONTENT_INSET } from '@/components/voice-hub';

export default function InsightTabScreen() {
  const insets = useSafeAreaInsets();

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar />
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{
            paddingTop: appTopBarOffsetTop(insets.top),
            paddingBottom: VOICE_HUB_TAB_CONTENT_INSET + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}>
          <View className="items-center">
            <View className="mt-4 h-52 w-52 items-center justify-center rounded-full border-2 border-dashed border-destructive/35">
              <View className="h-40 w-40 overflow-hidden rounded-full">
                <LinearGradient
                  colors={[THEME.dark.destructive, THEME.dark.primary, THEME.dark.background]}
                  start={{ x: 0.15, y: 0.85 }}
                  end={{ x: 0.8, y: 0.2 }}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
                <View className="h-full w-full items-center justify-center">
                  <CloudOff size={42} color={THEME.dark.destructive} />
                </View>
              </View>
            </View>

            <View className="mt-10 w-full items-center px-2">
              <View className="w-full flex-row flex-wrap items-end justify-center gap-x-2">
                <Text
                  className="text-center text-[46px] leading-[48px] font-extrabold tracking-tight text-foreground"
                  style={{ fontFamily: 'Manrope_800ExtraBold' }}>
                  Signals
                </Text>
                <Text
                  className="text-center text-[46px] leading-[48px] font-extrabold tracking-tight text-destructive"
                  style={{ fontFamily: 'Manrope_800ExtraBold' }}>
                  Dissipated.
                </Text>
              </View>
              <Text
                className="mt-5 text-center text-lg leading-8 text-muted-foreground"
                style={{ fontFamily: 'Manrope_500Medium' }}>
                Aura is unable to synchronize with the neural cloud. The connection path appears obstructed or dormant.
              </Text>
            </View>

            <View className="mt-8 w-full gap-4">
              <View className="bg-card/70 border-border/50 rounded-[24px] border px-5 py-5">
                <View className="mb-2 flex-row items-center gap-3">
                  <Box size={19} color={THEME.dark.secondary} />
                  <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                    Vault Access
                  </Text>
                </View>
                <Text className="text-sm leading-6 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
                  Your cached memory vaults and personal identities remain accessible locally.
                </Text>
              </View>

              <View className="bg-card/70 border-border/50 rounded-[24px] border px-5 py-5">
                <View className="mb-2 flex-row items-center gap-3">
                  <ZapOff size={19} color={THEME.dark.tertiary} />
                  <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                    Local Sync
                  </Text>
                </View>
                <Text className="text-sm leading-6 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
                  Drafted neural connections will be queued and synced once signals restore.
                </Text>
              </View>
            </View>

            <View className="mt-8 w-full items-center gap-4">
              <Pressable className="w-[78%] overflow-hidden rounded-full active:opacity-90">
                <LinearGradient
                  colors={[THEME.dark.gradientAuraStart, THEME.dark.gradientAuraEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="items-center justify-center rounded-full py-4">
                  <Text className="text-2xl font-extrabold text-black" style={{ fontFamily: 'Manrope_800ExtraBold' }}>
                    Retry Connection
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable className="border-border/50 bg-card/50 w-[58%] items-center rounded-full border py-3.5 active:opacity-90">
                <Text className="text-lg font-bold text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                  Explore Vault
                </Text>
              </Pressable>

              <Text className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                Network Protocol: E-404-SIG-LOST
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
