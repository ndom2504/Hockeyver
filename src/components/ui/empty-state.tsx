import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="title3" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.center}>
        {body}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="Impossible de charger"
      body="Le fil NHL n’a pas pu s’afficher. Réessayez dans un instant."
      actionLabel="Réessayer"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 28,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  center: {
    textAlign: 'center',
  },
});
