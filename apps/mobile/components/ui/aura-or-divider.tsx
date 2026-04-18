import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type AuraOrDividerProps = {
  /** Center label, e.g. "Or continue with" */
  label: string;
  className?: string;
};

export function AuraOrDivider({ label, className }: AuraOrDividerProps) {
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <View className="h-px flex-1 bg-border/40" />
      <Text
        className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ fontFamily: 'Manrope_600SemiBold' }}>
        {label}
      </Text>
      <View className="h-px flex-1 bg-border/40" />
    </View>
  );
}
