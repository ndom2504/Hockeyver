import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { MatchCard } from '@/components/feed/match-card';
import { PollCard } from '@/components/feed/poll-card';
import { PostCard } from '@/components/feed/post-card';
import { ComposeButton } from '@/components/navigation/compose-button';
import { TabHeader } from '@/components/navigation/tab-header';
import { AppText } from '@/components/ui/app-text';
import { FilterRow } from '@/components/ui/filter-row';
import { PressableOpacity } from '@/components/ui/pressable';
import { MatchSkeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ui/section-header';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { isToday } from '@/utils/date';
import { activityScore, hotTopics } from '@/utils/topics';

export function HomeScreen() {
  const nhl = useNhlSnapshot();
  const favoriteTeamId = useSessionStore((state) => state.user?.favoriteTeamId);
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const comments = useCommunityStore((state) => state.comments);
  const likes = useCommunityStore((state) => state.likes);
  const poll = useCommunityStore((state) => state.polls.find((item) => item.id === 'qotd'));

  const visible = useMemo(() => posts.filter((post) => !hidden.includes(post.id)), [posts, hidden]);
  const meId = useSessionStore((state) => state.user?.id);
  const popular = useMemo(() => {
    const ranked = [...visible].sort((a, b) => activityScore(b, comments, likes) - activityScore(a, comments, likes));
    const mine = visible
      .filter((post) => post.authorId === meId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const picked: typeof visible = [];
    const seen = new Set<string>();
    for (const post of [...mine, ...ranked]) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      picked.push(post);
      if (picked.length >= 8) break;
    }
    return picked;
  }, [visible, comments, likes, meId]);
  const topics = useMemo(() => hotTopics(visible, comments, likes), [visible, comments, likes]);
  const teams = nhl.data?.teams ?? [];
  const today = useMemo(() => {
    const matches = (nhl.data?.matches ?? []).filter((match) => isToday(match.startTime));
    return [...matches].sort((a, b) => {
      const aFav = a.homeTeamId === favoriteTeamId || a.awayTeamId === favoriteTeamId;
      const bFav = b.homeTeamId === favoriteTeamId || b.awayTeamId === favoriteTeamId;
      if (aFav !== bFav) return aFav ? -1 : 1;
      return +new Date(a.startTime) - +new Date(b.startTime);
    });
  }, [nhl.data?.matches, favoriteTeamId]);

  const favorite = teams.find((team) => team.id === favoriteTeamId);
  const favoriteGame = (nhl.data?.matches ?? []).find(
    (match) =>
      (match.homeTeamId === favoriteTeamId || match.awayTeamId === favoriteTeamId) &&
      (isToday(match.startTime) || match.status === 'scheduled'),
  );

  return (
    <View style={styles.screen}>
      <TabHeader title="HOCKEYVER" subtitle="The community for NHL fans." showSearch showAvatar />
      <FlatList
        data={popular}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={nhl.isRefetching} onRefresh={() => void nhl.refetch()} tintColor={colors.navy} colors={[colors.navy]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {poll ? (
              <View style={styles.pad}>
                <PollCard poll={poll} variant="hero" />
              </View>
            ) : null}
            {favorite && favoriteGame ? (
              <PressableOpacity style={styles.banner} onPress={() => router.push(`/match/${favoriteGame.id}`)}>
                <AppText variant="footnote" color={colors.navy}>
                  {favorite.name} · {favoriteGame.status === 'live' ? 'en cours' : favoriteGame.status === 'final' ? 'résultat' : 'au programme'}
                </AppText>
              </PressableOpacity>
            ) : null}
            <SectionHeader title="Matchs du jour" actionLabel="Calendrier" onAction={() => router.navigate('/nhl')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.matches, styles.matchesPad]}>
              {nhl.isLoading
                ? [0, 1, 2].map((item) => <MatchSkeleton key={item} />)
                : today.map((match) => {
                    const home = teams.find((team) => team.id === match.homeTeamId);
                    const away = teams.find((team) => team.id === match.awayTeamId);
                    if (!home || !away) return null;
                    return <MatchCard key={match.id} match={match} home={home} away={away} />;
                  })}
            </ScrollView>
            <SectionHeader title="Hot topics" />
            <FilterRow
              options={topics.map((topic) => ({ id: topic.tag, label: `#${topic.tag}` }))}
              value=""
              onChange={(tag) => router.push(`/topic/${encodeURIComponent(tag)}`)}
            />
            <SectionHeader title="Discussions populaires" actionLabel="Communauté" onAction={() => router.navigate('/community')} />
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} layout="full" />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
      />
      <ComposeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: 96,
  },
  header: {
    gap: 4,
    paddingBottom: 4,
  },
  pad: {
    paddingHorizontal: 16,
  },
  matches: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  matchesPad: {
    paddingRight: 84,
  },
  gap: {
    height: 8,
    backgroundColor: colors.bg,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.ice,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
