import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors } from '@/constants/theme';
import { useCommunityStore } from '@/store/useCommunityStore';
import { tap } from '@/utils/haptics';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Accueil', icon: 'home' },
  nhl: { label: 'NHL', icon: 'nhl' },
  community: { label: 'Communauté', icon: 'community' },
  notifications: { label: 'Notifications', icon: 'bell' },
  profile: { label: 'Profil', icon: 'person' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useCommunityStore((store) => store.notifications.filter((item) => !item.read).length);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name] ?? { label: route.name, icon: 'home' as const };
        const color = focused ? colors.navy : colors.faint;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            tap();
            navigation.navigate(route.name);
          }
        };
        return (
          <PressableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={onPress}
            style={styles.item}
          >
            <View>
              <Icon name={tab.icon} size={22} color={color} active={focused} />
              {route.name === 'notifications' && unread > 0 ? (
                <View style={styles.badge}>
                  <AppText variant="caption" color={colors.white} style={styles.badgeText}>
                    {unread > 9 ? '9+' : String(unread)}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="caption" color={color} numberOfLines={1} style={styles.label}>
              {tab.label}
            </AppText>
          </PressableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minHeight: 46,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
  },
});
