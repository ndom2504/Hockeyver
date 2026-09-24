import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/app-text';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';
import { sendOtp, signInWithApple } from '@/services/auth/auth.api';
import { useSessionStore } from '@/store/useSessionStore';

type AppleModule = typeof import('expo-apple-authentication');

export function AuthPhoneScreen() {
  const establish = useSessionStore((state) => state.establish);
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'phone' | 'apple' | null>(null);
  const [apple, setApple] = useState<AppleModule | null>(null);
  const phone = digits.length === 10 ? `+1${digits}` : digits.startsWith('+') ? digits : '';

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void import('expo-apple-authentication')
      .then(async (module) => {
        if (!active) return;
        setApple(module);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const continueWithApple = async () => {
    if (pending) return;
    setError('');
    setPending('apple');
    try {
      const module = apple ?? (await import('expo-apple-authentication'));
      if (!apple) setApple(module);
      if (!(await module.isAvailableAsync())) {
        setError('Sign in with Apple n’est pas disponible sur cet iPhone. Réessayez avec la dernière version d’Expo Go.');
        return;
      }
      const credential = await module.signInAsync({
        requestedScopes: [module.AppleAuthenticationScope.FULL_NAME, module.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) {
        setError('Apple n’a pas confirmé la connexion.');
        return;
      }
      const session = await signInWithApple({
        identityToken: credential.identityToken,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
      });
      await establish(session.token, session.user, session.needsProfile);
      router.replace(session.needsProfile ? '/auth/profile' : '/');
    } catch (caught) {
      const canceled = typeof caught === 'object' && caught !== null && 'code' in caught && caught.code === 'ERR_REQUEST_CANCELED';
      if (!canceled) setError(caught instanceof ApiError ? caught.message : 'La connexion Apple a échoué.');
    } finally {
      setPending(null);
    }
  };

  const submit = async () => {
    if (pending) return;
    setError('');
    setPending('phone');
    try {
      const result = await sendOtp(digits);
      router.push({ pathname: '/auth/code', params: { phone: result.phone } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Impossible d’envoyer le code.');
    } finally {
      setPending(null);
    }
  };

  return (
    <AuthShell title="Entrez votre numéro" subtitle="Nous envoyons un code par texto pour ouvrir votre compte de partisan.">
      <View style={styles.field}>
        <View style={styles.prefix}>
          <AppText variant="callout">+1</AppText>
        </View>
        <TextInput
          value={digits}
          onChangeText={(value) => setDigits(value.replace(/[^\d+]/g, '').slice(0, 16))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder="514 555 1234"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
      </View>
      {error ? (
        <AppText variant="footnote" color={colors.red} style={styles.centered}>
          {error}
        </AppText>
      ) : null}
      <Button
        label={pending === 'phone' ? 'Envoi…' : 'Recevoir le code'}
        onPress={submit}
        disabled={pending !== null || phone.length < 11}
      />
      {Platform.OS === 'ios' ? (
        <View style={styles.apple}>
          <AppText variant="caption" color={colors.faint} style={styles.centered}>
            ou
          </AppText>
          <PressableOpacity onPress={() => void continueWithApple()} style={styles.appleFallback} disabled={pending !== null}>
            <AppText variant="callout" color={colors.white}>
              {pending === 'apple' ? 'Connexion…' : 'Continuer avec Apple'}
            </AppText>
          </PressableOpacity>
        </View>
      ) : null}
      <Button label="Revenir à l'accueil" variant="ghost" onPress={() => router.replace('/')} />
      <AppText variant="caption" color={colors.faint} style={styles.centered}>
        {apple
          ? 'Le texto vérifie le numéro. Sign in with Apple ouvre le compte sans texto. Apple ne partage le nom qu’une fois.'
          : 'En continuant, vous recevez un texto de vérification. Des frais de votre opérateur peuvent s’appliquer.'}
      </AppText>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  prefix: {
    paddingRight: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.line,
  },
  input: { flex: 1, fontSize: 18, color: colors.ink, paddingVertical: 12, textAlign: 'center' },
  centered: { textAlign: 'center' },
  apple: { width: '100%', gap: 12, alignItems: 'center' },
  appleFallback: {
    width: '100%',
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
