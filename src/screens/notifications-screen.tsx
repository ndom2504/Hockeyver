import { router, type Href } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { TabHeader } from '@/components/navigation/tab-header';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';
import type { NotificationType } from '@/types/social';
import { formatRelative } from '@/utils/date';
import { notificationPresentation } from '@/utils/notifications';

const ICONS: Record<NotificationType, IconName> = {
  reply: 'chat',
  reaction: 'heart',
  mention: 'person',
  favorite_team: 'nhl',
  game_start: 'nhl',
  goal: 'nhl',
  game_result: 'nhl',
  poll: 'check',
};

export function NotificationsScreen() {
  const notifications = useCommunityStore((state) => state.notifications);
  const users = useCommunityStore((state) => state.users);
  const markRead = useCommunityStore((state) => state.markNotificationRead);
  const markAll = useCommunityStore((state) => state.markAllNotificationsRead);
  const favoriteTeamId = useSessionStore((state) => state.user?.favoriteTeamId ?? '');
  const nhl = useNhlSnapshot();
  const unread = notifications.some((item) => !item.read);
  const ordered = [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <View style={styles.screen}>
      <TabHeader
        title="Notifications"
        subtitle="Réponses, matchs et votre équipe."
        actionLabel={unread ? 'Tout lire' : undefined}
        onAction={unread ? markAll : undefined}
      />
      <FlatList
        data={ordered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Rien de nouveau" body="Les réponses, réactions et matchs apparaîtront ici." />}
        renderItem={({ item }) => {
          const content = notificationPresentation(
            item,
            users,
            nhl.data?.teams ?? [],
            nhl.data?.matches ?? [],
            favoriteTeamId,
          );
          return (
            <PressableOpacity
              onPress={() => {
                markRead(item.id);
                if (content.href) router.push(content.href as Href);
              }}
              style={[styles.row, !item.read && styles.unread]}
            >
              <View style={styles.icon}>
                <Icon name={ICONS[item.type]} size={18} color={colors.navy} />
              </View>
              <View style={styles.copy}>
                <AppText variant="callout">{content.title}</AppText>
                <AppText variant="footnote" color={colors.muted}>
                  {content.body}
                </AppText>
                <AppText variant="caption" color={colors.faint}>
                  {formatRelative(item.createdAt)}
                </AppText>
              </View>
              {!item.read ? <View style={styles.dot} /> : null}
            </PressableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  unread: {
    backgroundColor: '#F3F7FC',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 3 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginTop: 6,
  },
});
