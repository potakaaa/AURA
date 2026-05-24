import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraButton } from '@/components/ui/aura-button';
import { AuraCard } from '@/components/ui/aura-card';
import { AuraScreen } from '@/components/ui/aura-screen';
import { AuraThemeToggleRow } from '@/components/ui/aura-theme-toggle-row';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toaster';
import { persistColorScheme } from '@/lib/color-scheme';
import { supabase } from '@/lib/supabase';
import { clearLocalConversationData } from '@/src/db/conversation-history';
import {
  clearPreferenceMemories,
  deletePreferenceMemory,
  getPreferenceMemorySettings,
  listPreferenceMemories,
  setInferredPreferenceMemoryEnabled,
} from '@/src/db/preference-memory';
import type { PreferenceMemoryRecord } from '@/src/db/repositories';
import { Href, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isClearingConversations, setIsClearingConversations] = useState(false);
  const [isInferredMemoryEnabled, setIsInferredMemoryEnabled] = useState(false);
  const [preferenceMemories, setPreferenceMemories] = useState<PreferenceMemoryRecord[]>([]);
  const [isLoadingPreferenceMemory, setIsLoadingPreferenceMemory] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydratePreferenceMemory() {
      try {
        const [settings, memories] = await Promise.all([
          getPreferenceMemorySettings(),
          listPreferenceMemories(),
        ]);

        if (isMounted) {
          setIsInferredMemoryEnabled(settings.inferredMemoryEnabled);
          setPreferenceMemories(memories);
        }
      } catch {
        if (isMounted) {
          setPreferenceMemories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreferenceMemory(false);
        }
      }
    }

    void hydratePreferenceMemory();

    return () => {
      isMounted = false;
    };
  }, []);

  async function onToggleDarkMode(nextValue: boolean) {
    const nextScheme = nextValue ? 'dark' : 'light';
    setColorScheme(nextScheme);
    await persistColorScheme(nextScheme);
  }

  async function onSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error({
          title: 'Unable to log out',
          description: 'Try again in a moment.',
        });
      }
    } catch {
      toast.error({
        title: 'Unable to log out',
        description: 'Try again in a moment.',
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  async function onClearConversationData() {
    if (isClearingConversations) {
      return;
    }

    Alert.alert(
      'Clear all local conversations?',
      'This permanently removes local Voice Hub history from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear history',
          style: 'destructive',
          onPress: async () => {
            setIsClearingConversations(true);
            try {
              await clearLocalConversationData();
              toast.success({
                title: 'Conversation data cleared',
                description: 'Local Voice Hub messages were removed.',
              });
            } catch {
              toast.error({
                title: 'Unable to clear data',
                description: 'Try again in a moment.',
              });
            } finally {
              setIsClearingConversations(false);
            }
          },
        },
      ]
    );
  }

  async function onToggleInferredMemory(nextValue: boolean) {
    setIsInferredMemoryEnabled(nextValue);
    try {
      await setInferredPreferenceMemoryEnabled(nextValue);
      toast.success({
        title: 'Preference memory updated',
        description: nextValue
          ? 'Aura can now store inferred preferences locally.'
          : 'Aura will only store explicit preferences.',
      });
    } catch {
      setIsInferredMemoryEnabled(!nextValue);
      toast.error({
        title: 'Unable to update preference memory',
        description: 'Try again in a moment.',
      });
    }
  }

  async function refreshPreferenceMemories() {
    setPreferenceMemories(await listPreferenceMemories());
  }

  async function onDeletePreferenceMemory(id: string) {
    try {
      await deletePreferenceMemory(id);
      await refreshPreferenceMemories();
      toast.success({ title: 'Preference deleted' });
    } catch {
      toast.error({
        title: 'Unable to delete preference',
        description: 'Try again in a moment.',
      });
    }
  }

  async function onClearPreferenceMemories() {
    try {
      await clearPreferenceMemories();
      setPreferenceMemories([]);
      toast.success({ title: 'Preference memories cleared' });
    } catch {
      toast.error({
        title: 'Unable to clear preferences',
        description: 'Try again in a moment.',
      });
    }
  }

  return (
    <AuraScreen>
      <View className="flex-1 bg-background">
        <AuthenticatedAppTopBar title="Settings" showSettingsAction={false} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-6"
          style={{ paddingTop: appTopBarOffsetTop(insets.top) + 12 }}>
          <AuraCard title="Appearance" description="Material-style dark theme persistence">
            <AuraThemeToggleRow checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
          </AuraCard>
          <AuraCard
            title="Temporary UI Lab"
            description="Preview the temporary Sonner-like toast component and different states.">
            <Button variant="outline" onPress={() => router.push('/(tabs)/toast-lab' as Href)}>
              <Text>Open Toast Lab</Text>
            </Button>
            <View className="mt-4">
              <AuraButton
                label="Open STT Test (Temporary)"
                auraVariant="secondary"
                className="h-12 rounded-full"
                onPress={() => router.push('/dev/stt-test')}
                accessibilityLabel="Open STT Test"
              />
            </View>
          </AuraCard>
          <AuraCard
            className="mt-4"
            title="Privacy"
            description="Manage local conversation history stored on this device.">
            <AuraButton
              label={isClearingConversations ? 'Clearing...' : 'Clear local conversations'}
              auraVariant="secondary"
              className="h-12 rounded-full"
              onPress={onClearConversationData}
              disabled={isClearingConversations}
              accessibilityLabel="Clear local conversations"
            />
          </AuraCard>
          <AuraCard
            className="mt-4"
            title="Preference Memory"
            description="Explicit settings are saved locally. Inferred memories stay off until enabled.">
            <View className="gap-4">
              <View className="flex-row items-center justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-on-surface text-sm font-semibold">
                    Store inferred preferences
                  </Text>
                  <Text className="text-on-surface-variant mt-1 text-xs leading-5">
                    When off, Aura only stores preferences you explicitly set.
                  </Text>
                </View>
                <Switch
                  checked={isInferredMemoryEnabled}
                  onCheckedChange={onToggleInferredMemory}
                  disabled={isLoadingPreferenceMemory}
                />
              </View>

              <View className="gap-3">
                {preferenceMemories.length > 0 ? (
                  preferenceMemories.map((memory) => (
                    <View
                      key={memory.id}
                      className="border-border/40 bg-surface-container/70 gap-3 rounded-2xl border p-3">
                      <View className="min-w-0">
                        <Text className="text-on-surface text-sm font-semibold">
                          {memory.key}
                        </Text>
                        <Text className="text-on-surface-variant mt-1 text-xs leading-5">
                          {memory.value}
                        </Text>
                        <Text className="text-on-surface-variant mt-2 text-[11px] uppercase">
                          {memory.source} · confidence {Math.round(memory.confidence * 100)}%
                        </Text>
                      </View>
                      <AuraButton
                        label="Delete"
                        auraVariant="tertiary"
                        className="h-10 self-start rounded-full"
                        onPress={() => onDeletePreferenceMemory(memory.id)}
                        accessibilityLabel={`Delete preference ${memory.key}`}
                      />
                    </View>
                  ))
                ) : (
                  <Text className="text-on-surface-variant text-sm leading-5">
                    No stored preference memories.
                  </Text>
                )}
              </View>

              <AuraButton
                label="Clear preference memories"
                auraVariant="secondary"
                className="h-12 rounded-full"
                onPress={onClearPreferenceMemories}
                disabled={preferenceMemories.length === 0}
                accessibilityLabel="Clear preference memories"
              />
            </View>
          </AuraCard>
          <AuraCard className="mt-4" title="Account" description="Manage your current session">
            <AuraButton
              label={isSigningOut ? 'Signing out...' : 'Log out'}
              auraVariant="secondary"
              className="h-12 rounded-full"
              onPress={onSignOut}
              disabled={isSigningOut}
              accessibilityLabel="Log out"
            />
          </AuraCard>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
