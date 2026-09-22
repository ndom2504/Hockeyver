import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/feed/post-card';
import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/skeleton';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { formatDay, formatTime } from '@/utils/date';

export function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nhl = useNhlSnapshot();
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const match = nhl.data?.matches.find((item) => item.id === id);
  const home = nhl.data?.teams.find((team) => team.id === match?.homeTeamId);
  const away = nhl.data?.teams.find((team) => team.id === match?.awayTeamId);

  if (nhl.isLoading) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Match" />
        <View style={styles.pad}>
          <CardSkeleton />
        </View>
      </View>
    );
  }

  if (nhl.isError) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Match" />
        <ErrorState onRetry={() => void nhl.refetch()} />
      </View>
    );
  }

  if (!match || !home || !away) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Match" />
        <EmptyState title="Match introuvable" body="Ce match ne fait pas partie du calendrier chargé." />
      </View>
    );
  }

  const showScore = match.status !== 'scheduled';
  const status =
    match.status === 'live'
      ? `En cours · ${match.periodLabel ?? ''} ${match.clock ?? ''}`.trim()
      : match.status === 'final'
        ? match.finishedIn === 'ot'
          ? 'Terminé · prolongation'
          : 'Terminé'
        : `${formatDay(match.startTime)} · ${formatTime(match.startTime)}`;

  const direct = posts.filter((post) => post.matchId === match.id && !hidden.includes(post.id));
  const related =
    direct.length > 0
      ? direct
      : posts
          .filter((post) => !hidden.includes(post.id) && (post.teamId === home.id || post.teamId === away.id))
          .slice(0, 4);

  return (
    <View style={styles.screen}>
      <StackHeader title={`${away.abbreviation} @ ${home.abbreviation}`} subtitle={match.venue} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.board}>
          <AppText variant="caption" color={match.status === 'live' ? colors.red : colors.muted}>
            {status}
          </AppText>
          <View style={styles.sides}>
            <Side teamName={away.name} logo={<TeamLogo team={away} size={64} />} score={showScore ? match.awayScore : undefined} />
            <AppText variant="title" color={colors.faint}>
              {showScore ? '–' : 'vs'}
            </AppText>
            <Side teamName={home.name} logo={<TeamLogo team={home} size={64} />} score={showScore ? match.homeScore : undefined} />
          </View>
          <AppText variant="footnote" color={colors.muted}>
            {match.venue}
          </AppText>
        </View>
        <AppText variant="label" color={colors.navy}>
          Discussions
        </AppText>
        {related.length === 0 ? (
          <EmptyState title="Pas encore de discussion" body="Le match attend ses premiers partisans." />
        ) : (
          related.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </ScrollView>
    </View>
  );
}

function Side({ teamName, logo, score }: { teamName: string; logo: ReactNode; score?: number }) {
  return (
    <View style={styles.side}>
      {logo}
      <AppText variant="footnote" numberOfLines={2} style={styles.center}>
        {teamName}
      </AppText>
      {score !== undefined ? <AppText variant="title">{score}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  board: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  sides: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  side: { width: 120, alignItems: 'center', gap: 8 },
  center: { textAlign: 'center' },
});
