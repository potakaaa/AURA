import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraThemeToggleRow } from '@/components/ui/aura-theme-toggle-row';
import { AuraTopBar } from '@/components/ui/aura-top-bar';
import { persistColorScheme } from '@/lib/color-scheme';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  async function onToggleDarkMode(nextValue: boolean) {
    const nextScheme = nextValue ? 'dark' : 'light';
    setColorScheme(nextScheme);
    await persistColorScheme(nextScheme);
  }

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuraTopBar title="Settings" />
        <View className="flex-1 px-5 pb-6 pt-3">
          <AuraCard title="Appearance" description="Material-style dark theme persistence">
            <AuraThemeToggleRow checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
          </AuraCard>
        </View>
      </View>
    </AuraScreen>
  );
}
