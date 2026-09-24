import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors, radius } from '@/constants/theme';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.block}>
          <View style={styles.brand}>
            <Image source={require('../../../assets/images/icon.png')} style={styles.mark} contentFit="cover" />
            <AppText variant="label" color={colors.navy} style={styles.centered}>
              HOCKEYVER
            </AppText>
          </View>
          <View style={styles.copy}>
            <AppText variant="title" style={styles.centered}>
              {title}
            </AppText>
            <AppText variant="body" color={colors.muted} style={styles.centered}>
              {subtitle}
            </AppText>
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  block: { width: '100%', maxWidth: 380, gap: 22 },
  brand: { alignItems: 'center', gap: 12 },
  mark: { width: 104, height: 104, borderRadius: radius.xl },
  copy: { gap: 8, alignItems: 'center' },
  centered: { textAlign: 'center' },
});
