import { AuraScreen } from '@/components/ui/aura-screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import {
  AudioLines,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Waves,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VoiceOption = {
  key: string;
  label: string;
  icon: LucideIcon;
};

const VOICE_OPTIONS: VoiceOption[] = [
  { key: 'elysian', label: 'Elysian', icon: AudioLines },
  { key: 'vortex', label: 'Vortex', icon: Shield },
  { key: 'aeon', label: 'Aeon', icon: Waves },
  { key: 'custom', label: 'Custom', icon: SlidersHorizontal },
];

const LOG_ITEMS = [
  {
    title: 'AURA accessed Calendar',
    detail: 'Permission: Scheduling intent detection',
    time: '2m ago',
    icon: CalendarDays,
    iconBgClass: 'bg-secondary/20',
    iconTextClass: 'text-secondary',
  },
  {
    title: 'Location Geo-Sync',
    detail: 'Permission: Contextual morning briefing',
    time: '1h ago',
    icon: MapPin,
    iconBgClass: 'bg-primary/20',
    iconTextClass: 'text-primary',
  },
  {
    title: 'Inbound Analysis',
    detail: 'Permission: Gmail integration filter',
    time: '4h ago',
    icon: Mail,
    iconBgClass: 'bg-tertiary/20',
    iconTextClass: 'text-tertiary',
  },
];

export default function PreviewScreen() {
  const [selectedVoice, setSelectedVoice] = useState('elysian');

  return (
    <AuraScreen>
      <View className="bg-background flex-1">
        <SafeAreaView edges={['top']} className="bg-background/90 border-border/30 border-b">
          <View className="flex-row items-center justify-between px-5 py-3">
            <View className="flex-row items-center gap-3">
              <View className="bg-primary/20 border-primary/30 h-9 w-9 items-center justify-center rounded-full border">
                <Icon as={ShieldCheck} size={17} className="text-primary" />
              </View>
              <Text className="text-muted-foreground text-sm font-bold tracking-tight">
                Privacy &amp; Settings Hub
              </Text>
            </View>
            <Pressable className="bg-primary/20 h-10 w-10 items-center justify-center rounded-full">
              <Icon as={Settings} size={18} className="text-primary" />
            </Pressable>
          </View>
        </SafeAreaView>

        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-10 pt-4">
          <View className="bg-surface-low border-primary/35 gap-5 rounded-[28px] border p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="border-primary/35 from-primary/35 to-tertiary/35 h-12 w-12 items-center justify-center rounded-full border bg-gradient-to-br">
                  <Icon as={UserRound} size={20} className="text-foreground" />
                </View>
                <Text className="text-primary text-3xl font-extrabold tracking-tight">AURA</Text>
              </View>
              <Pressable className="bg-primary/20 h-10 w-10 items-center justify-center rounded-full">
                <Icon as={Settings} size={18} className="text-primary" />
              </Pressable>
            </View>

            <View className="gap-4">
              <View className="self-start">
                <View className="border-primary/30 bg-surface-highest h-28 w-28 items-center justify-center rounded-3xl border">
                  <Icon as={UserRound} size={40} className="text-muted-foreground" />
                </View>
                <View className="bg-primary absolute -bottom-2 -right-2 rounded-full p-2">
                  <Icon as={Pencil} size={14} className="text-primary-foreground" />
                </View>
              </View>

              <View className="gap-1">
                <Text className="text-4xl font-extrabold tracking-tight">Synthesized User</Text>
                <Text className="text-muted-foreground text-base font-semibold">
                  Aura Level: Prime • Status: Online
                </Text>
                <View className="bg-surface-highest mt-2 self-start rounded-full px-3 py-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-secondary h-2 w-2 rounded-full" />
                    <Text className="text-secondary text-xs font-bold">Neural Sync Active</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="bg-surface-low gap-5 rounded-[28px] p-6">
            <View>
              <Text className="text-3xl font-extrabold">Voice Synthesis</Text>
              <Text className="text-muted-foreground mt-1 text-base font-semibold">
                Choose the auditory persona for your assistant&apos;s neural output.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {VOICE_OPTIONS.map((option) => {
                const isSelected = option.key === selectedVoice;
                const OptionIcon = option.icon;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedVoice(option.key)}
                    className={cn(
                      'bg-surface-highest w-[48%] items-center gap-2 rounded-3xl px-4 py-5',
                      isSelected && 'bg-primary/20 border-primary/25 border'
                    )}>
                    <Icon
                      as={OptionIcon}
                      size={18}
                      className={cn(isSelected ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <Text
                      className={cn(
                        'text-xs font-extrabold uppercase tracking-[0.18em]',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="from-primary/25 to-background border-primary/20 rounded-[28px] border bg-gradient-to-br p-6">
            <Icon as={ShieldCheck} size={24} className="text-primary" />
            <Text className="mt-3 text-4xl font-extrabold">98.2%</Text>
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
              Privacy Integrity Score
            </Text>
          </View>

          <View className="bg-surface-low overflow-hidden rounded-[28px]">
            <View className="border-border/30 flex-row items-center justify-between border-b px-6 py-5">
              <View className="pr-4">
                <Text className="text-3xl font-extrabold">Transparency Logs</Text>
                <Text className="text-muted-foreground mt-1 text-base font-semibold">
                  Real-time trace of AURA&apos;s data interaction.
                </Text>
              </View>
              <Pressable>
                <Text className="text-secondary text-sm font-extrabold tracking-wide">Export Report</Text>
              </Pressable>
            </View>

            {LOG_ITEMS.map((item, index) => {
              const RowIcon = item.icon;

              return (
                <View
                  key={item.title}
                  className={cn(
                    'flex-row items-center justify-between px-6 py-4',
                    index > 0 && 'border-border/30 border-t'
                  )}>
                  <View className="flex-row items-center gap-3 pr-3">
                    <View className={cn('h-10 w-10 items-center justify-center rounded-full', item.iconBgClass)}>
                      <Icon as={RowIcon} size={16} className={item.iconTextClass} />
                    </View>
                    <View className="max-w-[220px]">
                      <Text className="text-base font-bold">{item.title}</Text>
                      <Text className="text-muted-foreground text-xs font-semibold">{item.detail}</Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    {item.time}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="bg-destructive/10 border-destructive/25 gap-4 rounded-[28px] border p-6">
            <View>
              <Text className="text-destructive text-3xl font-extrabold">Memory Liquidation</Text>
              <Text className="text-muted-foreground mt-1 text-base font-semibold">
                Permanently erase all neural history and learned patterns. This cannot be undone.
              </Text>
            </View>
            <Pressable className="bg-destructive self-start rounded-full px-7 py-3">
              <Text className="text-destructive-foreground text-sm font-extrabold uppercase tracking-[0.2em]">
                Delete History
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
