import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { rgbaWhite, VOICE_HUB } from '@/lib/raw-colors';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type VoiceHubQuickActionProps = {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  onPress?: () => void;
};

export function VoiceHubQuickAction({
  label,
  icon,
  iconClassName,
  onPress,
}: VoiceHubQuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: rgbaWhite(0.08) }}
      className="w-full overflow-hidden rounded-2xl border border-white/10 active:scale-[0.98]">
      <LinearGradient
        colors={[...VOICE_HUB.quickActionGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <View className="bg-surface-container-high/80 h-9 w-9 items-center justify-center rounded-full">
          <Icon as={icon} size={18} className={iconClassName} />
        </View>
        <Text
          className="text-on-surface flex-1 text-sm font-semibold"
          numberOfLines={2}
          style={{ fontFamily: 'Manrope_700Bold' }}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export function VoiceHubQuickActionsRow({ children }: { children: ReactNode }) {
  return <View className="w-full flex-col items-stretch gap-3">{children}</View>;
}
