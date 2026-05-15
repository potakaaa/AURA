import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toaster';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ToastLabScreen() {
  const insets = useSafeAreaInsets();
  const notify = useToast();

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar title="Toast Lab" showSettingsAction={false} />
        <View className="flex-1 gap-4 px-5 pb-6" style={{ paddingTop: appTopBarOffsetTop(insets.top) + 12 }}>
          <AuraCard
            title="Temporary Sonner-Style Toast Preview"
            description="Use these buttons to preview success, error, info, and default toast states.">
            <View className="gap-3">
              <Button
                onPress={() =>
                  notify.success({
                    title: 'Changes saved',
                    description: 'Your profile preferences were synced successfully.',
                  })
                }>
                <Text>Show Success</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={() =>
                  notify.error({
                    title: 'Action failed',
                    description: 'Could not reach server. Please try again.',
                  })
                }>
                <Text>Show Error</Text>
              </Button>
              <Button
                variant="secondary"
                onPress={() =>
                  notify.info({
                    title: 'Heads up',
                    description: 'Background sync is currently in progress.',
                  })
                }>
                <Text>Show Info</Text>
              </Button>
              <Button
                variant="outline"
                onPress={() =>
                  notify.show({
                    title: 'New update available',
                    description: 'AURA can install this later when you are idle.',
                  })
                }>
                <Text>Show Default</Text>
              </Button>
              <Button variant="ghost" onPress={() => notify.dismissAll()}>
                <Text>Dismiss All</Text>
              </Button>
            </View>
          </AuraCard>
        </View>
      </View>
    </AuraScreen>
  );
}
