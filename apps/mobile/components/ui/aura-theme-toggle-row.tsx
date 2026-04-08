import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type AuraThemeToggleRowProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function AuraThemeToggleRow({ checked, onCheckedChange }: AuraThemeToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text variant="label">Dark mode</Text>
        <Text className="text-muted-foreground text-sm">Persisted across app launches</Text>
      </View>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  );
}
