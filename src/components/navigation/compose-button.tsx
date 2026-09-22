import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, shadow } from '@/constants/theme';
import { tap } from '@/utils/haptics';

export function ComposeButton() {
  return (
    <PressableOpacity
      accessibilityRole="button"
      accessibilityLabel="Créer une publication"
      onPress={() => {
        tap();
        router.push('/compose');
      }}
      style={styles.fab}
    >
      <Icon name="add" size={28} color={colors.white} />
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
});
