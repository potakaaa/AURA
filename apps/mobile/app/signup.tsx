import { AuthHeaderBrand } from '@/components/auth/auth-header-brand';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthSocialProviderRow } from '@/components/auth/auth-social-provider-row';
import { AuraButton } from '@/components/ui/aura-button';
import { AuraOrDivider } from '@/components/ui/aura-or-divider';
import { AuraTextField } from '@/components/ui/aura-text-field';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { rgbaWhite } from '@/lib/raw-colors';
import { router, type Href } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const LABEL_CLASS =
  'text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground';

export default function SignupScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <View className="flex-1">
      <AuthHeaderBrand />

      <AuthScreenShell
        footer={
          <View className="mt-10 w-full items-center px-2">
            <Text
              className="w-full text-center text-sm text-muted-foreground"
              style={{ fontFamily: 'Manrope_500Medium' }}>
              Already have an account?{' '}
              <Text
                accessibilityRole="link"
                accessibilityLabel="Sign in"
                className="text-primary font-bold"
                onPress={() => router.push('/login' as Href)}
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Sign in
              </Text>
            </Text>
          </View>
        }>
        <View className="items-center gap-2">
          <Text
            className="text-center text-[2.75rem] font-extrabold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: 'Manrope_800ExtraBold' }}>
            Join AURA
          </Text>
          <Text
            className="text-muted-foreground max-w-sm text-center text-lg leading-6"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            Create your sanctuary in a few steps.
          </Text>
        </View>

        <View className="gap-5 pt-2">
          <AuraTextField
            label="Display Name"
            labelClassName={LABEL_CLASS}
            leadingIcon={User}
            autoCapitalize="words"
            autoCorrect
            placeholder="Your name"
            className="h-14 rounded-full border-border/40 bg-card"
          />
          <AuraTextField
            label="Email Address"
            labelClassName={LABEL_CLASS}
            leadingIcon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="hello@aura.io"
            className="h-14 rounded-full border-border/40 bg-card"
          />
          <AuraTextField
            label="Password"
            labelClassName={LABEL_CLASS}
            leadingIcon={Lock}
            placeholder="••••••••"
            secureTextEntry={!passwordVisible}
            className="h-14 rounded-full border-border/40 bg-card"
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                hitSlop={8}
                onPress={() => setPasswordVisible((v) => !v)}
                android_ripple={{ color: rgbaWhite(0.12) }}
                className="rounded-full p-1.5 active:opacity-70">
                <Icon
                  as={passwordVisible ? Eye : EyeOff}
                  size={20}
                  className="text-muted-foreground"
                />
              </Pressable>
            }
          />
          <AuraTextField
            label="Confirm Password"
            labelClassName={LABEL_CLASS}
            leadingIcon={Lock}
            placeholder="••••••••"
            secureTextEntry={!confirmVisible}
            className="h-14 rounded-full border-border/40 bg-card"
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={confirmVisible ? 'Hide confirm password' : 'Show confirm password'}
                hitSlop={8}
                onPress={() => setConfirmVisible((v) => !v)}
                android_ripple={{ color: rgbaWhite(0.12) }}
                className="rounded-full p-1.5 active:opacity-70">
                <Icon
                  as={confirmVisible ? Eye : EyeOff}
                  size={20}
                  className="text-muted-foreground"
                />
              </Pressable>
            }
          />
        </View>

        <AuraButton
          label="Create account"
          className="h-14 w-full rounded-full shadow-sm shadow-primary/30"
          onPress={() => undefined}
          accessibilityLabel="Create account"
        />

        <AuraOrDivider label="Or continue with" className="my-2" />

        <AuthSocialProviderRow />
      </AuthScreenShell>
    </View>
  );
}
