import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { CommentRow } from '@/components/feed/comment-row';
import { PostCard } from '@/components/feed/post-card';
import { TabHeader } from '@/components/navigation/tab-header';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterRow } from '@/components/ui/filter-row';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { POINTS } from '@/constants/levels';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useToastStore } from '@/store/useToastStore';
import { ApiError } from '@/api/client';
import type { Comment, Post } from '@/types/social';
import { getLevel } from '@/utils/level';
import { displayName } from '@/utils/text';

const SECTIONS = [
  { id: 'posts', label: 'Publications' },
  { id: 'comments', label: 'Commentaires' },
  { id: 'likes', label: "J'aime" },
];

export function ProfileScreen() {
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const removeAccount = useSessionStore((state) => state.removeAccount);
  const show = useToastStore((state) => state.show);
  const posts = useCommunityStore((state) => state.posts);
  const comments = useCommunityStore((state) => state.comments);
  const likes = useCommunityStore((state) => state.likes);
  const nhl = useNhlSnapshot();
  const [section, setSection] = useState('posts');
  const team = nhl.data?.teams.find((item) => item.id === user?.favoriteTeamId);
  const level = getLevel(user?.points ?? 0);
  const mine = posts.filter((post) => post.authorId === user?.id);
  const myComments = comments.filter((comment) => comment.authorId === user?.id);
  const likedIds = new Set(likes.filter((like) => like.userId === user?.id && like.targetType === 'post').map((like) => like.targetId));
  const likedPosts = posts.filter((post) => likedIds.has(post.id));
  const received = likes.filter((like) => like.targetType === 'post' && mine.some((post) => post.id === like.targetId)).length;

  type ProfileRow =
    | { kind: 'post'; id: string; post: Post }
    | { kind: 'comment'; id: string; comment: Comment };

  const rows = useMemo<ProfileRow[]>(() => {
    if (section === 'comments') return myComments.map((comment) => ({ kind: 'comment', id: comment.id, comment }));
    const list = section === 'likes' ? likedPosts : mine;
    return list.map((post) => ({ kind: 'post', id: post.id, post }));
  }, [section, myComments, likedPosts, mine]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <TabHeader title="Profil" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TabHeader title="Profil" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              <Avatar uri={user.avatarUrl} name={displayName(user)} size={72} />
              <View style={styles.identityCopy}>
                <AppText variant="title3">{displayName(user)}</AppText>
                <AppText variant="footnote" color={colors.muted}>
                  @{user.username}
                </AppText>
                <AppText variant="body" color={colors.muted}>
                  {user.bio}
                </AppText>
              </View>
            </View>
            <View style={styles.stats}>
              <Stat value={String(mine.length)} label="Publications" />
              <Stat value={String(myComments.length)} label="Commentaires" />
              <Stat value={String(received)} label="J'aime reçus" />
            </View>
            <View style={styles.level}>
              <View style={styles.levelTop}>
                <AppText variant="callout">{level.current.label}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {user.points} pts
                </AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(level.progress * 100)}%` }]} />
              </View>
              <AppText variant="caption" color={colors.muted}>
                {level.next
                  ? `${level.pointsToNext} pts avant ${level.next.label}`
                  : 'Vous avez atteint le dernier niveau.'}
              </AppText>
              <AppText variant="caption" color={colors.faint}>
                Publication +{POINTS.post} · Commentaire +{POINTS.comment} · Sondage +{POINTS.poll}
              </AppText>
            </View>
            <PressableOpacity style={styles.favorite} onPress={() => router.push('/favorite-team')}>
              {team ? <TeamLogo team={team} size={36} /> : null}
              <View style={styles.flex}>
                <AppText variant="caption" color={colors.muted}>
                  Équipe favorite
                </AppText>
                <AppText variant="callout">{team?.fullName ?? 'Choisir une équipe'}</AppText>
              </View>
              <AppText variant="footnote" color={colors.navy}>
                Modifier
              </AppText>
            </PressableOpacity>
            <PressableOpacity style={styles.signOut} onPress={() => router.push('/legal')}>
              <AppText variant="footnote" color={colors.navy}>
                Confidentialité et stores
              </AppText>
            </PressableOpacity>
            <PressableOpacity
              style={styles.signOut}
              onPress={() => {
                signOut();
                router.replace('/auth/phone');
              }}
            >
              <AppText variant="footnote" color={colors.muted}>
                Se déconnecter
              </AppText>
            </PressableOpacity>
            <PressableOpacity style={styles.signOut} onPress={() => confirmDelete(removeAccount, show)}>
              <AppText variant="footnote" color={colors.red}>
                Supprimer mon compte
              </AppText>
            </PressableOpacity>
            <FilterRow options={SECTIONS} value={section} onChange={setSection} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={section === 'comments' ? 'Aucun commentaire' : section === 'likes' ? 'Aucun j’aime' : 'Aucune publication'}
            body={
              section === 'posts'
                ? 'Votre première publication apparaîtra ici.'
                : 'Cette section se remplira avec votre activité.'
            }
          />
        }
        renderItem={({ item }) =>
          item.kind === 'post' ? (
            <PostCard post={item.post} layout="full" />
          ) : (
            <View style={styles.pad}>
              <View style={styles.commentCard}>
                <CommentRow comment={item.comment} onReply={() => router.push(`/post/${item.comment.postId}`)} />
              </View>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
      />
    </View>
  );
}

function confirmDelete(removeAccount: () => Promise<void>, show: (message: string) => void) {
  Alert.alert(
    'Supprimer le compte',
    'Votre numéro, votre profil et votre session seront effacés. Cette action est définitive.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          removeAccount()
            .then(() => router.replace('/auth/phone'))
            .catch((error: unknown) => {
              show(error instanceof ApiError ? error.message : 'Le compte n’a pas pu être supprimé.');
            });
        },
      },
    ],
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title3">{value}</AppText>
      <AppText variant="caption" color={colors.muted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 32 },
  header: { gap: 14, paddingTop: 4 },
  identity: { flexDirection: 'row', gap: 14, paddingHorizontal: 16 },
  identityCopy: { flex: 1, gap: 2 },
  stats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  level: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.ice, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.navy, borderRadius: 3 },
  favorite: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: { flex: 1 },
  signOut: { alignSelf: 'flex-start', marginHorizontal: 16, paddingVertical: 4 },
  pad: { paddingHorizontal: 16 },
  gap: { height: 12 },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
  },
});
