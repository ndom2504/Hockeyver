import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, shadow } from '@/constants/theme';
import { useToastStore } from '@/store/useToastStore';

export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(message ? 1 : 0, { duration: 180 });
    translateY.value = withTiming(message ? 0 : 12, { duration: 180 });
  }, [message, opacity, translateY]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { bottom: Math.max(insets.bottom, 16) + 64 }, animated]}>
      <AppText variant="callout" color={colors.white}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.navyDeep,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow.float,
  },
});
