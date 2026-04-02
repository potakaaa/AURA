import type { PropsWithChildren } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export function AuraScreen({ children }: PropsWithChildren) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} className="flex-1">
      {children}
    </Animated.View>
  );
}
