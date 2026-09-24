import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';
import { sendOtp, verifyOtp } from '@/services/auth/auth.api';
import { useSessionStore } from '@/store/useSessionStore';

export function AuthCodeScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const establish = useSessionStore((state) => state.establish);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (value = code) => {
    if (!phone || value.length < 4 || pending) return;
    setError('');
    setPending(true);
    try {
      const session = await verifyOtp(phone, value);
      await establish(session.token, session.user, session.needsProfile);
      router.replace(session.needsProfile ? '/auth/profile' : '/');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Code refusé.');
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (!phone) return;
    setError('');
    try {
      await sendOtp(phone);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Impossible de renvoyer le code.');
    }
  };

  return (
    <AuthShell title="Entrez le code" subtitle={`Texto envoyé au ${phone ?? 'votre numéro'}.`}>
      <TextInput
        value={code}
        onChangeText={(value) => {
          const next = value.replace(/\D/g, '').slice(0, 6);
          setCode(next);
          if (next.length === 6) submit(next);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        placeholder="000000"
        placeholderTextColor={colors.faint}
        style={styles.code}
      />
      {error ? (
        <AppText variant="footnote" color={colors.red}>
          {error}
        </AppText>
      ) : null}
      <Button label={pending ? 'Vérification…' : 'Continuer'} onPress={() => submit()} disabled={pending || code.length < 4} />
      <View style={styles.links}>
        <PressableOpacity onPress={resend}>
          <AppText variant="footnote" color={colors.navy}>
            Renvoyer le code
          </AppText>
        </PressableOpacity>
        <PressableOpacity onPress={() => router.back()}>
          <AppText variant="footnote" color={colors.muted}>
            Changer de numéro
          </AppText>
        </PressableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  code: {
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 8,
    color: colors.ink,
  },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
});
