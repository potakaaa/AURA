import { AuraLogo } from '@/components/brand';
import { GradientText } from '@/components/welcome/gradient-text';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TOP_BAR } from '@/lib/raw-colors';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Settings, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTopBar } from './app-top-bar';

export type AuthenticatedAppTopBarProps = {
  /** Opaque bar background; defaults to app background. */
  backgroundColor?: string;
  /** When set, shows this title instead of the AURA wordmark. */
  title?: string;
  /** Renders the settings action; default true. Use false on the settings screen. */
  showSettingsAction?: boolean;
};

/**
 * Shared top bar for signed-in routes: avatar, AURA (or screen title), settings.
 * Uses {@link AppTopBar} with a solid (opaque) background — no translucent /88 scrim.
 */
export function AuthenticatedAppTopBar({
  backgroundColor = THEME.dark.background,
  title,
  showSettingsAction = true,
}: AuthenticatedAppTopBarProps) {
  return (
    <AppTopBar
      backgroundColor={backgroundColor}
      leading={
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View
            className="h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px]"
            style={styles.brandMark}>
            <LinearGradient
              colors={[...TOP_BAR.brandMark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[...TOP_BAR.brandMarkSheen]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <AuraLogo width={28} height={25} />
          </View>
          <View className="min-w-0 flex-1 justify-center">
            {title ? (
              <Text
                className="text-foreground shrink text-[21px] font-bold tracking-tight"
                numberOfLines={1}
                style={{ fontFamily: 'Manrope_700Bold' }}>
                {title}
              </Text>
            ) : (
              <GradientText
                variant="aura"
                className="text-2xl font-black tracking-tight"
                outerClassName="self-start">
                AURA
              </GradientText>
            )}
            
          </View>
        </View>
      }
      trailing={
        <View
          className="h-11 flex-row items-center overflow-hidden rounded-[22px]"
          style={styles.actionCluster}>
          <View accessibilityLabel="Profile" className="h-11 w-11 items-center justify-center">
            <View
              className="h-8 w-8 items-center justify-center overflow-hidden rounded-full"
              style={styles.avatar}>
              <LinearGradient
                colors={[...TOP_BAR.brandMark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Icon as={UserRound} size={17} className="text-foreground" />
            </View>
          </View>
          <View style={styles.actionDivider} />
          {showSettingsAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={8}
              android_ripple={{ color: TOP_BAR.surfacePressed, borderless: false }}
              onPress={() => router.push('/(tabs)/settings' as Href)}
              className="h-11 w-11 items-center justify-center active:opacity-80">
              <Icon as={Settings} size={20} className="text-foreground" />
            </Pressable>
          ) : (
            <View className="h-11 w-11 items-center justify-center">
              <Icon as={Settings} size={19} className="text-muted-foreground" />
            </View>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  actionCluster: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOP_BAR.controlBorder,
    backgroundColor: TOP_BAR.surfaceRaised,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: TOP_BAR.controlDivider,
  },
  avatar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOP_BAR.controlHighlight,
  },
  brandMark: {
    shadowColor: TOP_BAR.statusGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  statusDot: {
    backgroundColor: TOP_BAR.statusDot,
    shadowColor: TOP_BAR.statusGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});
