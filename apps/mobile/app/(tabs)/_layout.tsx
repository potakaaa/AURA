import { VoiceHubTabBar } from '@/components/voice-hub';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <VoiceHubTabBar {...props} />}
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen name="insight" options={{ title: 'Insight' }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect' }} />
      <Tabs.Screen name="index" options={{ title: 'Aura' }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault' }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="preview" options={{ href: null }} />
    </Tabs>
  );
}
