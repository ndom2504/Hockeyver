import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  ink: '#12171F',
  muted: '#5E6A7A',
  faint: '#8B97A8',
  line: '#E4EAF1',
  navy: '#0A2F6B',
  navyDeep: '#071E45',
  ice: '#E7F0FA',
  red: '#C8102E',
  white: '#FFFFFF',
  success: '#1B7F4E',
  overlay: 'rgba(12, 22, 38, 0.46)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadow: { card: ViewStyle; float: ViewStyle } = {
  card: Platform.select({
    ios: {
      shadowColor: '#0A2F6B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
    },
    android: { elevation: 2 },
    default: {
      boxShadow: '0 8px 18px rgba(10, 47, 107, 0.06)',
    },
  }) as ViewStyle,
  float: Platform.select({
    ios: {
      shadowColor: '#0A2F6B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {
      boxShadow: '0 10px 16px rgba(10, 47, 107, 0.18)',
    },
  }) as ViewStyle,
};
