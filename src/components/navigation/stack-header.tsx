import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function StackHeader({ title, subtitle, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <IconButton
        name="back"
        label="Retour"
        background={colors.surface}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.navigate('/');
        }}
      />
      <View style={styles.copy}>
        <AppText variant="title3" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  spacer: {
    width: 40,
  },
});
