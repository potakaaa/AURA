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
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const LABEL_CLASS =
  'text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground';

/** Demo credentials only — no real auth. */
const MOCK_EMAIL = 'sample@aura.io';
const MOCK_PASSWORD = 'sample';

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSignIn() {
    setSubmitError(null);
    const trimmed = email.trim().toLowerCase();
    if (trimmed === MOCK_EMAIL.toLowerCase() && password === MOCK_PASSWORD) {
      router.replace('/(tabs)' as Href);
      return;
    }
    setSubmitError('Try sample@aura.io / sample.');
  }

  return (
    <View className="flex-1">
      <AuthHeaderBrand />

      <AuthScreenShell
        footer={
          <View className="mt-10 w-full items-center px-2">
            <Text
              className="w-full text-center text-sm text-muted-foreground"
              style={{ fontFamily: 'Manrope_500Medium', textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Text
                accessibilityRole="link"
                accessibilityLabel="Join AURA"
                className="text-primary font-bold"
                onPress={() => router.push('/signup' as Href)}
                style={{ fontFamily: 'Manrope_700Bold' }}>
                Join AURA
              </Text>
            </Text>
          </View>
        }>
        <View className="items-center gap-2">
          <Text
            className="text-center text-[3.25rem] font-extrabold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: 'Manrope_800ExtraBold' }}>
            Welcome{'\n'}Back
          </Text>
          <Text
            className="text-muted-foreground max-w-sm text-center text-lg leading-6"
            style={{ fontFamily: 'Manrope_500Medium' }}>
            Enter your details to access your sanctuary.
          </Text>
        </View>

        <View className="gap-5 pt-2">
          <AuraTextField
            label="Email Address"
            labelClassName={LABEL_CLASS}
            leadingIcon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="hello@aura.io"
            className="h-14 rounded-full border-border/40 bg-card"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSubmitError(null);
            }}
          />
          <AuraTextField
            label="Password"
            labelClassName={LABEL_CLASS}
            leadingIcon={Lock}
            placeholder="••••••••"
            secureTextEntry={!passwordVisible}
            errorText={submitError ?? undefined}
            className="h-14 rounded-full border-border/40 bg-card"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setSubmitError(null);
            }}
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
          <View className="flex-row justify-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recover password"
              android_ripple={{ color: rgbaWhite(0.12) }}
              hitSlop={8}>
              <Text
                className="text-secondary text-sm font-semibold"
                style={{ fontFamily: 'Manrope_600SemiBold' }}>
                Recover Password?
              </Text>
            </Pressable>
          </View>
        </View>

        <AuraButton
          label="Sign In"
          className="h-14 w-full rounded-full shadow-sm shadow-primary/30"
          onPress={handleSignIn}
          accessibilityLabel="Sign in"
        />

        <AuraOrDivider label="Or continue with" className="my-2" />

        <AuthSocialProviderRow />
      </AuthScreenShell>
    </View>
  );
}
