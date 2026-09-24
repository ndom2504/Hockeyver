import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useToastStore } from '@/store/useToastStore';

function guestMayStay(segments: readonly string[]) {
  if (segments.length === 0) return true;
  if (segments[0] === '(tabs)' && (segments.length < 2 || segments[1] === 'index')) return true;
  if (segments[0] === 'auth' && (segments[1] === 'phone' || segments[1] === 'code' || segments[1] === undefined)) return true;
  return false;
}

export function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const hydrate = useSessionStore((state) => state.hydrate);
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === 'auth';
    const onProfile = segments[1] === 'profile';
    if (status === 'signedOut' && !guestMayStay(segments)) {
      useToastStore.getState().show('Connectez-vous pour continuer.');
      router.replace('/auth/phone');
    }
    if (status === 'needsProfile' && !onProfile) router.replace('/auth/profile');
    if (status === 'ready' && inAuth) router.replace('/');
  }, [status, segments]);

  if (status === 'loading') {
    return (
      <View style={styles.boot}>
        <Image source={require('../../assets/images/icon.png')} style={styles.mark} contentFit="cover" />
        <AppText variant="title" color={colors.white}>
          HOCKEYVER
        </AppText>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#000000' },
  mark: { width: 120, height: 120, borderRadius: radius.xl },
});
