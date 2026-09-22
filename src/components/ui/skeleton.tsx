import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

type Props = {
  height: number;
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ height, width = '100%', radius: borderRadius = radius.md, style }: Props) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, { height, width, borderRadius }, animated, style]} />;
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock height={40} width={40} radius={20} />
        <View style={styles.lines}>
          <SkeletonBlock height={12} width="46%" />
          <SkeletonBlock height={10} width="28%" />
        </View>
      </View>
      <SkeletonBlock height={14} />
      <SkeletonBlock height={14} width="82%" />
      <SkeletonBlock height={160} radius={radius.md} />
    </View>
  );
}

export function MatchSkeleton() {
  return <SkeletonBlock height={132} width={168} radius={radius.lg} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E1E7EE',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  lines: {
    flex: 1,
    gap: 8,
  },
});
