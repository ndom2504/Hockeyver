import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

import { Providers } from '@/components/providers';
import { ToastHost } from '@/components/ui/toast';
import { colors } from '@/constants/theme';

import '@/global.css';

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="dark" />
      <View style={styles.canvas}>
        <View style={styles.frame}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          />
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
