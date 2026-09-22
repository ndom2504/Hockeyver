import { ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
};

export function FilterRow({ options, value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <PressableOpacity
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[styles.pill, selected && styles.selected]}
          >
            <AppText variant="footnote" color={selected ? colors.white : colors.ink}>
              {option.label}
            </AppText>
          </PressableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    height: 48,
  },
  content: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
});
