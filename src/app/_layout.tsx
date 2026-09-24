import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

import { Providers } from '@/components/providers';
import { SessionGate } from '@/components/session-gate';
import { ToastHost } from '@/components/ui/toast';
import { colors } from '@/constants/theme';

import '@/global.css';

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="dark" />
      <View style={styles.canvas}>
        <View style={styles.frame}>
          <SessionGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          />
          </SessionGate>
          <ToastHost />
        </View>
      </View>
    </Providers>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#D5DDE6' : colors.bg,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
});
