import { AuraButton } from '@/components/ui/aura-button';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuraTopBarProps = {
  title: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onActionPress?: () => void;
};

export function AuraTopBar({ title, actionLabel, actionIcon, onActionPress }: AuraTopBarProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-background">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text variant="headline">{title}</Text>
        {actionLabel ? (
          <AuraButton
            label={actionLabel}
            size="sm"
            auraVariant="secondary"
            icon={actionIcon}
            onPress={onActionPress}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
