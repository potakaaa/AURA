import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraButton } from '@/components/ui/aura-button';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toaster';
import {
  deleteLocalConversation,
  listLocalConversationSummaries,
  type LocalConversationSummary,
} from '@/src/db/conversation-history';
import { useFocusEffect, useRouter } from 'expo-router';
import { Clock3, MessageSquareText, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [conversations, setConversations] = useState<LocalConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshConversations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setConversations(await listLocalConversationSummaries());
    } catch {
      toast.error({
        title: 'Unable to load conversations',
        description: 'Try again in a moment.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations])
  );

  function onOpenConversation(conversationId: string) {
    router.push({
      pathname: '/(tabs)',
      params: { conversationId },
    });
  }

  function onDeleteConversation(conversation: LocalConversationSummary) {
    Alert.alert('Delete conversation?', 'This removes the local messages from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLocalConversation(conversation.id);
            await refreshConversations();
            toast.success({ title: 'Conversation deleted' });
          } catch {
            toast.error({
              title: 'Unable to delete conversation',
              description: 'Try again in a moment.',
            });
          }
        },
      },
    ]);
  }

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar title="History" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-24"
          contentContainerStyle={{ paddingTop: appTopBarOffsetTop(insets.top) + 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshConversations} />
          }>
          <AuraCard
            title="Local Conversations"
            description="Stored on this device from Voice Hub messages.">
            <View className="gap-3">
              {isLoading ? (
                <View className="min-h-[160px] items-center justify-center gap-3">
                  <ActivityIndicator />
                  <Text className="text-on-surface-variant text-sm">
                    Loading local conversations...
                  </Text>
                </View>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <View
                    key={conversation.id}
                    className="border-border/40 bg-surface-container/70 rounded-2xl border p-4">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open conversation ${conversation.title}`}
                      className="gap-3 active:opacity-80"
                      onPress={() => onOpenConversation(conversation.id)}>
                      <View className="flex-row items-start gap-3">
                        <View className="bg-primary/15 mt-0.5 h-10 w-10 items-center justify-center rounded-full">
                          <Icon as={MessageSquareText} size={18} className="text-primary" />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            className="text-on-surface text-base font-semibold"
                            numberOfLines={1}>
                            {conversation.title}
                          </Text>
                          <Text
                            className="text-on-surface-variant mt-1 text-sm leading-5"
                            numberOfLines={2}>
                            {conversation.preview}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-row items-center gap-2">
                          <Icon as={Clock3} size={14} className="text-muted-foreground" />
                          <Text className="text-muted-foreground text-xs">
                            {formatConversationTime(conversation.updatedAt)}
                          </Text>
                          <Text className="text-muted-foreground text-xs">
                            {conversation.messageCount} messages
                          </Text>
                        </View>
                        <AuraButton
                          label="Delete"
                          icon={Trash2}
                          auraVariant="tertiary"
                          className="h-9 px-3"
                          onPress={() => onDeleteConversation(conversation)}
                          accessibilityLabel={`Delete conversation ${conversation.title}`}
                        />
                      </View>
                    </Pressable>
                  </View>
                ))
              ) : (
                <View className="min-h-[160px] justify-center gap-2">
                  <Text className="text-on-surface text-base font-semibold">
                    No local conversations yet.
                  </Text>
                  <Text className="text-on-surface-variant text-sm leading-5">
                    Voice Hub messages will appear here after they are saved on this device.
                  </Text>
                </View>
              )}
            </View>
          </AuraCard>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}

function formatConversationTime(value: string): string {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return 'Recently';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) {
    return 'Just now';
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date().getFullYear() === new Date(timestamp).getFullYear() ? undefined : 'numeric',
  }).format(timestamp);
}