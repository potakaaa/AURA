import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraTextField } from '@/components/ui/aura-text-field';
import { Text } from '@/components/ui/text';
import { Search } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar title="Chat" />
        <View
          className="flex-1 gap-4 px-5 pb-6"
          style={{ paddingTop: appTopBarOffsetTop(insets.top) + 12 }}>
          <AuraTextField
            label="Search conversations"
            placeholder="Search"
            leadingIcon={Search}
            helperText="Quick jump to previous conversations"
          />
          <AuraCard title="Conversation Space" description="Future chat threads render here.">
            <Text variant="body" className="text-muted-foreground">
              This screen validates the tab route and component foundation.
            </Text>
          </AuraCard>
        </View>
      </View>
    </AuraScreen>
  );
}
