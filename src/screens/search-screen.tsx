import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { hotTopics } from '@/utils/topics';
import { displayName, fold } from '@/utils/text';

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const nhl = useNhlSnapshot();
  const posts = useCommunityStore((state) => state.posts);
  const users = useCommunityStore((state) => state.users);
  const comments = useCommunityStore((state) => state.comments);
  const likes = useCommunityStore((state) => state.likes);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const me = useSessionStore((state) => state.user);
  const needle = fold(query.trim());
  const topics = useMemo(() => hotTopics(posts.filter((post) => !hidden.includes(post.id)), comments, likes), [posts, comments, likes, hidden]);

  const teams = (nhl.data?.teams ?? []).filter((team) =>
    needle.length > 0 && fold(`${team.city} ${team.name} ${team.fullName} ${team.abbreviation}`).includes(needle),
  );
  const players = (nhl.data?.players ?? []).filter((player) =>
    needle.length > 0 && fold(`${player.firstName} ${player.lastName}`).includes(needle),
  );
  const discussions = posts.filter(
    (post) =>
      needle.length > 0 &&
      !hidden.includes(post.id) &&
      fold(`${post.body} ${post.hashtags.join(' ')}`).includes(needle),
  );
  const tags = [
    ...new Set(
      posts
        .flatMap((post) => post.hashtags)
        .filter((tag) => needle.length > 0 && fold(tag).includes(needle)),
    ),
  ];
  const people = [me, ...users].filter((user): user is NonNullable<typeof me> => Boolean(user)).filter((user) => {
    if (needle.length === 0) return false;
    const wrote = [...posts, ...comments.map((comment) => ({ body: comment.body, authorId: comment.authorId }))].some(
      (item) => item.authorId === user.id && fold(item.body).includes(needle),
    );
    return wrote || fold(`${user.firstName} ${user.lastName} ${user.username}`).includes(needle);
  });
  const quiet = needle.length >= 2 && teams.length + players.length + discussions.length + tags.length + people.length === 0;

  return (
    <View style={styles.screen}>
      <StackHeader title="Recherche" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Joueurs, équipes, discussions, partisans"
        placeholderTextColor={colors.faint}
        autoFocus
        style={styles.input}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {needle.length < 2 ? (
          <View style={styles.block}>
            <AppText variant="label" color={colors.navy}>
              Tendances
            </AppText>
            {topics.map((topic) => (
              <PressableOpacity key={topic.tag} onPress={() => router.push(`/topic/${encodeURIComponent(topic.tag)}`)}>
                <AppText variant="callout" color={colors.navy}>
                  #{topic.tag}
                </AppText>
              </PressableOpacity>
            ))}
          </View>
        ) : null}
        {quiet ? <EmptyState title="Aucun résultat" body={`Rien ne correspond à « ${query.trim()} ».`} /> : null}
        <ResultGroup title="Joueurs">
          {players.map((player) => (
            <PressableOpacity key={player.id} style={styles.row} onPress={() => router.push(`/player/${player.id}`)}>
              <AppText variant="callout">
                {player.firstName} {player.lastName}
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                {player.teamId}
              </AppText>
            </PressableOpacity>
          ))}
        </ResultGroup>
        <ResultGroup title="Équipes">
          {teams.map((team) => (
            <PressableOpacity key={team.id} style={styles.row} onPress={() => router.push(`/team/${team.id}`)}>
              <TeamLogo team={team} size={28} />
              <AppText variant="callout">{team.fullName}</AppText>
            </PressableOpacity>
          ))}
        </ResultGroup>
        <ResultGroup title="Hashtags">
          {tags.map((tag) => (
            <PressableOpacity key={tag} onPress={() => router.push(`/topic/${encodeURIComponent(tag)}`)}>
              <AppText variant="callout" color={colors.navy}>
                #{tag}
              </AppText>
            </PressableOpacity>
          ))}
        </ResultGroup>
        <ResultGroup title="Discussions">
          {discussions.slice(0, 6).map((post) => (
            <PressableOpacity key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
              <AppText variant="body" numberOfLines={2}>
                {post.body}
              </AppText>
            </PressableOpacity>
          ))}
        </ResultGroup>
        <ResultGroup title="Partisans">
          {people.map((user) => (
            <View key={user.id} style={styles.row}>
              <Avatar uri={user.avatarUrl} name={displayName(user)} size={36} />
              <View>
                <AppText variant="callout">{displayName(user)}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  @{user.username}
                </AppText>
              </View>
            </View>
          ))}
        </ResultGroup>
      </ScrollView>
    </View>
  );
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) {
  const list = Array.isArray(children) ? children : [children];
  if (list.every((child) => child == null || child === false)) return null;
  if (list.length === 0) return null;
  return (
    <View style={styles.block}>
      <AppText variant="label" color={colors.navy}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  input: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  block: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
