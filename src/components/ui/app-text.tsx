import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors } from '@/constants/theme';

export type TextVariant = 'large' | 'title' | 'title3' | 'body' | 'callout' | 'footnote' | 'caption' | 'label';

type Props = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function AppText({ variant = 'body', color = colors.ink, style, ...rest }: Props) {
  return <Text {...rest} style={[styles[variant], { color }, style]} />;
}

const base: TextStyle = {
  fontFamily: undefined,
};

const styles = StyleSheet.create({
  large: { ...base, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  title: { ...base, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  title3: { ...base, fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.3 },
  body: { ...base, fontSize: 16, lineHeight: 23, fontWeight: '400' },
  callout: { ...base, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  footnote: { ...base, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { ...base, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { ...base, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});
