import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { displayName } from '@/utils/text';

type Props = {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showAvatar?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function TabHeader({ title, subtitle, showSearch, showAvatar, actionLabel, onAction }: Props) {
  const insets = useSafeAreaInsets();
  const user = useSessionStore((state) => state.user);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.copy}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.actions}>
        {actionLabel && onAction ? (
          <PressableOpacity onPress={onAction} hitSlop={8} accessibilityRole="button">
            <AppText variant="footnote" color={colors.navy}>
              {actionLabel}
            </AppText>
          </PressableOpacity>
        ) : null}
        {showSearch ? (
          <IconButton name="search" label="Rechercher" onPress={() => router.push('/search')} />
        ) : null}
        {showAvatar && user ? (
          <PressableOpacity
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le profil"
            onPress={() => router.navigate('/profile')}
          >
            <Avatar uri={user.avatarUrl} name={displayName(user)} size={38} />
          </PressableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
