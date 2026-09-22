import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, icon, style }: Props) {
  const palette = {
    primary: { bg: colors.navy, text: colors.white, border: colors.navy },
    secondary: { bg: colors.surface, text: colors.navy, border: colors.line },
    ghost: { bg: 'transparent', text: colors.navy, border: 'transparent' },
  }[variant];

  return (
    <PressableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={18} color={palette.text} /> : null}
        <AppText variant="callout" color={palette.text}>
          {label}
        </AppText>
      </View>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
