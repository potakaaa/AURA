import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { rgbaWhite } from '@/lib/raw-colors';
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
      className="border-border/40 bg-surface-container w-full flex-row items-center justify-center gap-2 rounded-full border px-6 py-3 active:scale-[0.98]">
      <Icon as={icon} size={18} className={iconClassName} />
      <Text
        className="text-muted-foreground text-sm font-medium"
        style={{ fontFamily: 'Manrope_500Medium' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function VoiceHubQuickActionsRow({ children }: { children: ReactNode }) {
  return (
    <View className="w-full flex-col items-stretch gap-3">{children}</View>
  );
}
