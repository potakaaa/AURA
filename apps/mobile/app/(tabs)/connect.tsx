import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Calendar, Cloud, Mail, MessageSquare, Video } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VOICE_HUB_TAB_CONTENT_INSET } from '@/components/voice-hub';

const INTEGRATIONS = [
  {
    name: 'Google Calendar',
    description: 'Sync meetings, schedules, and reminders via voice commands.',
    connected: true,
    actionLabel: 'Manage Access',
    icon: Calendar,
  },
  {
    name: 'Gmail',
    description: 'Draft emails, summarize long threads, and prioritize your inbox.',
    connected: true,
    actionLabel: 'Manage Access',
    icon: Mail,
  },
  {
    name: 'Slack',
    description: 'Bridge workspace communication with contextual intelligence.',
    connected: false,
    actionLabel: 'Connect Slack',
    icon: MessageSquare,
  },
  {
    name: 'Google Drive',
    description: 'Search documents and let AURA reference your files for context.',
    connected: false,
    actionLabel: 'Authorize Drive',
    icon: Cloud,
  },
  {
    name: 'Zoom',
    description: 'Generate meeting summaries and capture action items from calls.',
    connected: false,
    actionLabel: 'Connect Zoom',
    icon: Video,
  },
] as const;

export default function ConnectTabScreen() {
  const insets = useSafeAreaInsets();

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: appTopBarOffsetTop(insets.top),
            paddingBottom: VOICE_HUB_TAB_CONTENT_INSET + insets.bottom,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-5xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Manrope_800ExtraBold' }}>
              Integrations
            </Text>
            <Text className="text-base leading-6 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
              Expand AURA's intelligence by connecting your digital ecosystem.
            </Text>
          </View>

          <View className="mt-4 rounded-3xl border border-white/10 bg-surface-container p-4">
            <Text className="text-base font-bold text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
              Privacy Focused by Design
            </Text>
            <Text className="mt-1 text-xs leading-5 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
              End-to-end encryption protects external integrations. Authentication is handled through secure OAuth flows.
            </Text>
          </View>

          <View className="mt-4 gap-3">
            {INTEGRATIONS.map((item) => (
              <View key={item.name} className="rounded-3xl border border-white/10 bg-surface-container p-4">
                <View className="flex-row items-center justify-between">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-high">
                    <Icon as={item.icon} size={20} className={item.connected ? 'text-primary' : 'text-tertiary'} />
                  </View>
                  <View
                    className={item.connected
                      ? 'rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1'
                      : 'rounded-full border border-white/10 bg-surface-container-high px-3 py-1'}>
                    <Text
                      className={item.connected ? 'text-[10px] uppercase tracking-wider text-emerald-300' : 'text-[10px] uppercase tracking-wider text-muted-foreground'}
                      style={{ fontFamily: 'Manrope_700Bold' }}>
                      {item.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-2xl font-bold leading-tight text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                  {item.name}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
                  {item.description}
                </Text>

                <View
                  className={item.connected
                    ? 'mt-3 h-10 items-center justify-center rounded-full border border-white/15 bg-surface-container-high'
                    : 'mt-3 h-10 items-center justify-center rounded-full bg-primary'}>
                  <Text className={item.connected ? 'text-xs font-semibold text-foreground' : 'text-xs font-semibold text-primary-foreground'} style={{ fontFamily: 'Manrope_700Bold' }}>
                    {item.actionLabel}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-8 gap-3 pb-2">
            <Text className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
              Coming Soon
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {['Airtable', 'GitHub', 'Shopify', 'DocuSign'].map((name) => (
                <View key={name} className="min-w-[46%] grow rounded-full border border-white/10 bg-surface-container px-4 py-3">
                  <Text className="text-center text-xs text-muted-foreground" style={{ fontFamily: 'Manrope_600SemiBold' }}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
