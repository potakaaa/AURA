import { RIPPLE } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

const PROVIDERS = [
  { id: 'google', icon: 'google' as const, label: 'Continue with Google' },
  { id: 'apple', icon: 'apple' as const, label: 'Continue with Apple' },
] as const;

/**
 * OAuth actions are disabled for MVP until providers are fully wired.
 */
export function AuthSocialProviderRow() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'dark';
  const iconColor = THEME[scheme].mutedForeground;

  return (
    <View className="flex-row justify-center gap-4">
      {PROVIDERS.map(({ id, icon, label }) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: true }}
          disabled
          android_ripple={{ color: RIPPLE.onPrimary }}
          className="h-14 max-w-[48%] flex-1 items-center justify-center rounded-full border border-border/40 bg-card opacity-50">
          <FontAwesome5 name={icon} brand size={22} color={iconColor} />
        </Pressable>
      ))}
    </View>
  );
}
