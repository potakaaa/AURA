import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Text, View, type TextStyle } from 'react-native';

type GradientTextProps = {
  children: string;
  variant: 'aura' | 'headline';
  className?: string;
  /** Merged into mask + gradient text (e.g. size, letterSpacing, shadow). */
  textStyle?: TextStyle;
  /** Wraps the MaskedView; default `self-start`. Use `self-center` in horizontal brand rows. */
  outerClassName?: string;
};

export function GradientText({
  children,
  variant,
  className,
  textStyle,
  outerClassName,
}: GradientTextProps) {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'dark';
  const t = THEME[scheme];

  const colors =
    variant === 'aura'
      ? ([t.gradientAuraStart, t.gradientAuraEnd] as const)
      : ([t.primary, t.secondary, t.tertiary] as const);

  return (
    <View className={cn('self-start', outerClassName)}>
      <MaskedView
        maskElement={
          <Text
            className={cn(className)}
            style={[{ fontFamily: 'Manrope_800ExtraBold' }, textStyle]}>
            {children}
          </Text>
        }>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text
            className={cn(className)}
            style={[{ fontFamily: 'Manrope_800ExtraBold', opacity: 0 }, textStyle]}>
            {children}
          </Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}
