import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Cloud, FileText, Link2, Mail, MessageSquare, Shield, Video } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VOICE_HUB_TAB_CONTENT_INSET } from '@/components/voice-hub';

const INTEGRATIONS = [
  {
    name: 'Google Calendar',
    description: 'Sync meetings, daily schedules, and set reminders via voice commands.',
    connected: true,
    actionLabel: 'Manage Access',
    icon: Calendar,
    iconClassName: 'text-primary',
  },
  {
    name: 'Gmail',
    description: 'Draft emails, summarize long threads, and prioritize your inbox through AI analysis.',
    connected: true,
    actionLabel: 'Manage Access',
    icon: Mail,
    iconClassName: 'text-secondary',
  },
  {
    name: 'Slack',
    description: "Bridge your workspace communication with AURA's contextual intelligence.",
    connected: false,
    actionLabel: 'Connect Slack',
    icon: MessageSquare,
    iconClassName: 'text-tertiary',
  },
  {
    name: 'Notion',
    description: 'Create new pages, update databases, and search your workspace instantly.',
    connected: true,
    actionLabel: 'Manage Access',
    icon: FileText,
    iconClassName: 'text-primary',
  },
  {
    name: 'Google Drive',
    description: 'Search through documents and allow AURA to reference your PDF files for context.',
    connected: false,
    actionLabel: 'Authorize Drive',
    icon: Cloud,
    iconClassName: 'text-secondary',
  },
  {
    name: 'Zoom',
    description: 'Automatically generate meeting summaries and track action items from calls.',
    connected: false,
    actionLabel: 'Connect Zoom',
    icon: Video,
    iconClassName: 'text-tertiary',
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
            <View className="mt-2 flex-row gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                <Icon as={Calendar} size={16} className="text-primary" />
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                <Icon as={Mail} size={16} className="text-secondary" />
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                <Icon as={MessageSquare} size={16} className="text-tertiary" />
              </View>
            </View>
          </View>

          <View className="mt-6 flex-row items-start gap-4 rounded-[34px] border border-white/10 bg-surface-container p-6">
            <View className="h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
              <Icon as={Shield} size={22} className="text-primary" />
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-xl font-bold leading-tight text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                Privacy Focused by Design
              </Text>
              <Text className="mt-2 text-sm leading-6 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
                AURA uses end-to-end encryption for all external integrations. We never store your login credentials;
                authentication is handled via secure OAuth protocols.
              </Text>
            </View>
          </View>

          <View className="mt-5 gap-5">
            {INTEGRATIONS.map((item) => (
              <View key={item.name} className="aspect-square rounded-[34px] border border-white/10 bg-surface-container px-9 py-7">
                <View className="h-full">
                  <View className="flex-row items-start justify-between">
                    <View className="h-14 w-14 items-center justify-center rounded-[16px] bg-surface-container-high">
                      <Icon as={item.icon} size={22} className={item.iconClassName} />
                    </View>
                    <View
                      className={item.connected
                        ? 'flex-row items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/20 px-2.5 py-1'
                        : 'flex-row items-center gap-1.5 rounded-full border border-white/10 bg-surface-container-high px-2.5 py-1'}>
                      <View className={item.connected ? 'h-1.5 w-1.5 rounded-full bg-secondary' : 'h-1.5 w-1.5 rounded-full bg-muted-foreground'} />
                      <Text
                        className={item.connected ? 'text-[9px] uppercase tracking-[1.2px] text-secondary' : 'text-[9px] uppercase tracking-[1.2px] text-muted-foreground'}
                        style={{ fontFamily: 'Manrope_700Bold' }}>
                        {item.connected ? 'Connected' : 'Not Connected'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 items-start justify-center px-3">
                    <Text className="text-[29px] font-bold leading-[1.04] tracking-tight text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                      {item.name}
                    </Text>
                    <Text className="mt-2.5 text-sm leading-6 text-muted-foreground" style={{ fontFamily: 'Manrope_500Medium' }}>
                      {item.description}
                    </Text>
                  </View>

                  {item.connected ? (
                    <View className="mt-auto h-12 items-center justify-center rounded-full border border-white/10 bg-surface-container-high">
                      <Text className="text-xs font-semibold text-foreground" style={{ fontFamily: 'Manrope_700Bold' }}>
                        {item.actionLabel}
                      </Text>
                    </View>
                  ) : (
                    <View className="mt-auto h-12 overflow-hidden rounded-full">
                      <LinearGradient
                        colors={[THEME.dark.gradientAuraStart, THEME.dark.gradientAuraEnd]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        className="h-full flex-row items-center justify-center gap-1.5 rounded-full">
                        <Icon as={Link2} size={14} className="text-white" />
                        <Text className="text-xs font-semibold text-white" style={{ fontFamily: 'Manrope_700Bold' }}>
                          {item.actionLabel}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
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
