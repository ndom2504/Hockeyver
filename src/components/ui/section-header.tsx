import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color={colors.navy}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText variant="footnote" color={colors.navy}>
            {actionLabel}
          </AppText>
        </PressableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
