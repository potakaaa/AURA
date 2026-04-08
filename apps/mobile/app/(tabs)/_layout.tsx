import { Icon } from '@/components/ui/icon';
import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarActiveTintColor: THEME[scheme].primary,
        tabBarInactiveTintColor: THEME[scheme].mutedForeground,
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: THEME[scheme].card,
          borderTopWidth: 0,
          elevation: 0,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon as={Home} size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Icon as={MessageCircle} size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon as={Settings} size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
