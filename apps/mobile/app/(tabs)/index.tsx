import { AuraButton } from '@/components/ui/aura-button';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraTopBar } from '@/components/ui/aura-top-bar';
import { Text } from '@/components/ui/text';
import { Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function HomeScreen() {
  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuraTopBar title="AURA" actionLabel="Preview" actionIcon={Sparkles} />
        <View className="flex-1 gap-4 px-5 pb-6 pt-3">
          <AuraCard
            tone="high"
            title="Ambient Intelligence"
            description="The foundational app shell is now themed and reusable.">
            <Text variant="body" className="text-muted-foreground">
              This surface is intentionally card-first and line-free to match the design system.
            </Text>
          </AuraCard>

          <AuraButton
            label="Open Component Preview"
            auraVariant="secondary"
            onPress={() => router.push('/(tabs)/preview')}
          />
        </View>
      </View>
    </AuraScreen>
  );
}
