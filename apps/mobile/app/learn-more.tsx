import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LEARN_MORE } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Fingerprint, Infinity, Lock, Sparkles, X } from 'lucide-react-native';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NEURAL_SYNC_IMAGE = require('@/assets/images/learn-more/neural-sync.png');
const AMBIENT_INTELLIGENCE_IMAGE = require('@/assets/images/learn-more/ambient-intelligence.png');
const VAULT_SECURE_IMAGE = require('@/assets/images/learn-more/vault-secure.png');

const CARD_STYLE = {
  backgroundColor: LEARN_MORE.cardBg,
  shadowColor: LEARN_MORE.cardShadow,
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 1,
  shadowRadius: 40,
  elevation: 12,
} as const;

export default function LearnMoreScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: LEARN_MORE.pageBg }}>
      <View className="absolute inset-0" style={{ backgroundColor: LEARN_MORE.pageBg }} />
      <View className="absolute -right-28 top-52 h-64 w-64 rounded-full bg-secondary/6 blur-[100px]" />
      <View className="absolute bottom-16 left-1/2 h-72 w-[92%] -translate-x-1/2 rounded-full bg-tertiary/5 blur-[120px]" />

      <SafeAreaView
        edges={['top']}
        className="border-b border-white/5 px-4"
        style={{ backgroundColor: LEARN_MORE.headerBg }}>
        <View className="h-11 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <Icon as={Sparkles} size={14} color={THEME.dark.primary} />
            <Text className="text-primary text-[21px] font-extrabold tracking-tight">AURA</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/45">
            <Icon as={X} size={12} color={THEME.dark.onSurface} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 34, paddingBottom: 26 }}>
        <View className="gap-9">
          <View className="items-center gap-5 px-3">
            <View
              className="self-center rounded-full border border-white/10 px-3 py-1.5"
              style={{ backgroundColor: LEARN_MORE.chipBg }}>
              <View className="flex-row items-center gap-1.5">
                <Icon as={Sparkles} size={12} color={THEME.dark.primary} />
                <Text className="text-primary text-[9px] font-bold uppercase tracking-[0.14em]">
                  The Ambient Oracle
                </Text>
              </View>
            </View>

            <Text className="text-center text-[52px] font-extrabold leading-[51px] tracking-tight text-foreground">
              Beyond an{`\n`}Interface.{`\n`}A Living Entity.
            </Text>

            <Text className="max-w-[290px] text-center text-[13px] leading-7 text-muted-foreground">
              AURA discards the rigid grids of the past. Discover a fluid, predictive ecosystem
              that adapts to your cognitive patterns before you even formulate a query.
            </Text>
          </View>

          <View className="gap-5">
            <View className="overflow-hidden rounded-[28px] border border-white/5" style={CARD_STYLE}>
              <Image source={NEURAL_SYNC_IMAGE} className="h-[260px] w-full" resizeMode="cover" />
            </View>

            <View className="gap-3 px-1.5">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: LEARN_MORE.chipBg }}>
                <Icon as={Sparkles} size={16} color={THEME.dark.primary} />
              </View>
              <Text className="text-foreground text-[41px] font-bold leading-[43px] tracking-tight">
                Neural Sync
              </Text>
              <Text className="text-muted-foreground text-[13px] leading-7">
                Experience real-time cognitive alignment. AURA doesn't wait for your input; it
                reads the contextual cues of your workflow, surfacing data, assets, and pathways
                exactly when your mind reaches for them.
              </Text>

              <View className="gap-2 pt-1">
                <View className="flex-row items-start gap-2.5">
                  <View className="mt-[5px] h-2 w-2 rounded-full bg-secondary" />
                  <Text className="text-muted-foreground text-[11px] leading-5">
                    Predictive asset staging based on{`\n`}historical usage.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2.5">
                  <View className="mt-[5px] h-2 w-2 rounded-full bg-secondary" />
                  <Text className="text-muted-foreground text-[11px] leading-5">
                    Zero-latency state transitions.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-5">
            <View className="overflow-hidden rounded-[28px] border border-white/5" style={CARD_STYLE}>
              <Image
                source={AMBIENT_INTELLIGENCE_IMAGE}
                className="h-[260px] w-full"
                resizeMode="cover"
              />
            </View>

            <View className="gap-3 px-1.5">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: LEARN_MORE.chipBg }}>
                <Icon as={Infinity} size={17} color={THEME.dark.secondary} />
              </View>
              <Text className="text-foreground text-[41px] font-bold leading-[43px] tracking-tight">
                Ambient Intelligence
              </Text>
              <Text className="text-muted-foreground text-[13px] leading-7">
                Your digital life, proactively managed. Operating silently in the background layer
                ( surface-container-lowest ), AURA organizes the chaos, distilling complex
                datasets into ethereal, actionable insights that appear only when relevant.
              </Text>

              <View
                className="rounded-xl border border-white/10 px-4 py-3"
                style={{ backgroundColor: LEARN_MORE.statusCardBg }}>
                <Text className="text-secondary text-[8px] font-bold uppercase tracking-[0.15em]">
                  System Status
                </Text>
                <Text className="text-foreground mt-1 text-[13px] font-bold">
                  14 Background Processes Optimized
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-4 px-1.5">
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: LEARN_MORE.chipBg }}>
              <Icon as={Fingerprint} size={16} color={THEME.dark.tertiary} />
            </View>

            <Text className="text-[42px] font-bold leading-[44px] tracking-tight text-white">
              Vault Secure
            </Text>

            <Text className="text-[13px] leading-7 text-muted-foreground">
              Impenetrable. Biometrically encrypted.{`\n`}Your personal dataset is locked within a
              quantum-resistant architecture, shielded by tonal layers of security.
            </Text>

            <View className="overflow-hidden rounded-[28px] border border-white/5" style={CARD_STYLE}>
              <Image source={VAULT_SECURE_IMAGE} className="h-[272px] w-full" resizeMode="cover" />

              <View
                className="absolute bottom-4 left-4 right-4 rounded-2xl px-4 py-3"
                style={{ backgroundColor: LEARN_MORE.vaultOverlayBg }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-md"
                      style={{ backgroundColor: LEARN_MORE.lockChipBg }}>
                      <Icon as={Lock} size={13} color={LEARN_MORE.lockIcon} />
                    </View>

                    <View>
                      <Text className="text-white/95 text-[14px] font-bold leading-4">
                        End-to-End{`\n`}Encrypted
                      </Text>
                      <Text
                        className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: LEARN_MORE.statusText }}>
                        Active Status
                      </Text>
                    </View>
                  </View>

                  <View
                    className="h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: LEARN_MORE.checkBadgeBg }}>
                    <Icon as={CheckCircle2} size={11} color={LEARN_MORE.checkIcon} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="pb-3 pt-1">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="mx-auto flex-row items-center gap-2 rounded-full bg-primary px-8 py-3.5">
              <Icon as={ArrowLeft} size={15} color={THEME.dark.onPrimary} />
              <Text className="text-on-primary text-[16px] font-semibold">Back to Start</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
