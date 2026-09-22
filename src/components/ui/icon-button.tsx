import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors } from '@/constants/theme';

type Props = {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  background?: string;
};

export function IconButton({ name, label, onPress, color = colors.navy, background = colors.ice }: Props) {
  return (
    <PressableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[styles.button, { backgroundColor: background }]}
    >
      <Icon name={name} size={20} color={color} />
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
