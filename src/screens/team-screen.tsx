import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MatchCard } from '@/components/feed/match-card';
import { PostCard } from '@/components/feed/post-card';
import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PressableOpacity } from '@/components/ui/pressable';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/skeleton';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useToastStore } from '@/store/useToastStore';
import { DIVISION_LABEL } from '@/utils/standings';
import { teamStanding } from '@/utils/standings';
import { fold } from '@/utils/text';
import { POSITION_SHORT } from '@/utils/position';

export function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nhl = useNhlSnapshot();
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const following = useCommunityStore((state) => state.followedTeamIds.includes(String(id)));
  const toggle = useCommunityStore((state) => state.toggleFollowTeam);
  const show = useToastStore((state) => state.show);
  const me = useSessionStore((state) => state.user);
  const fans = useCommunityStore((state) => state.users);
  const team = nhl.data?.teams.find((item) => item.id === id);

  if (nhl.isLoading) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Équipe" />
        <View style={styles.pad}>
          <CardSkeleton />
        </View>
      </View>
    );
  }
  if (nhl.isError || !nhl.data) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Équipe" />
        <ErrorState onRetry={() => void nhl.refetch()} />
      </View>
    );
  }
  if (!team) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Équipe" />
        <EmptyState title="Équipe introuvable" body="Cette franchise n’est pas dans la liste NHL." />
      </View>
    );
  }

  const standing = teamStanding(nhl.data.standings, nhl.data.teams, team.id);
  const games = nhl.data.matches.filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id);
  const upcoming = games.filter((match) => match.status === 'scheduled').slice(0, 3);
  const results = games.filter((match) => match.status === 'final').slice(0, 3);
  const roster = nhl.data.players.filter((player) => player.teamId === team.id);
  const fanCount = fans.filter((fan) => fan.favoriteTeamId === team.id).length + (me?.favoriteTeamId === team.id ? 1 : 0);
  const discussions = posts.filter((post) => {
    if (hidden.includes(post.id)) return false;
    return post.teamId === team.id || post.hashtags.some((tag) => fold(tag) === fold(team.tag));
  });
  const teamsById = new Map(nhl.data.teams.map((item) => [item.id, item]));

  return (
    <View style={styles.screen}>
      <StackHeader title={team.name} subtitle={team.city} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.bar, { backgroundColor: team.primaryColor }]} />
          <TeamLogo team={team} size={84} />
          <AppText variant="title" style={styles.center}>
            {team.fullName}
          </AppText>
          <AppText variant="footnote" color={colors.muted}>
            {DIVISION_LABEL[team.division]} · {team.abbreviation}
          </AppText>
          <Button
            label={following ? 'Suivi' : 'Suivre'}
            variant={following ? 'secondary' : 'primary'}
            onPress={() => {
              const nowFollowing = toggle(team.id);
              show(nowFollowing ? `Vous suivez les ${team.name}` : `Vous ne suivez plus les ${team.name}`);
            }}
            style={styles.follow}
          />
        </View>

        {standing ? (
          <View style={styles.block}>
            <AppText variant="label" color={colors.navy}>
              Classement
            </AppText>
            <AppText variant="title3">
              {standing.rank}e · {standing.standing.wins}-{standing.standing.losses}-{standing.standing.otLosses}
            </AppText>
            <AppText variant="footnote" color={colors.muted}>
              {standing.standing.points} pts · différentiel {standing.standing.goalDiff > 0 ? '+' : ''}
              {standing.standing.goalDiff} · série {standing.standing.streak}
            </AppText>
          </View>
        ) : null}

        <Section title="Prochains matchs">
          {upcoming.length === 0 ? (
            <AppText variant="footnote" color={colors.muted}>
              Aucun match à venir dans le calendrier chargé.
            </AppText>
          ) : (
            upcoming.map((match) => {
              const home = teamsById.get(match.homeTeamId);
              const away = teamsById.get(match.awayTeamId);
              if (!home || !away) return null;
              return <MatchCard key={match.id} match={match} home={home} away={away} layout="row" />;
            })
          )}
        </Section>

        <Section title="Résultats">
          {results.map((match) => {
            const home = teamsById.get(match.homeTeamId);
            const away = teamsById.get(match.awayTeamId);
            if (!home || !away) return null;
            return <MatchCard key={match.id} match={match} home={home} away={away} layout="row" />;
          })}
        </Section>

        <Section title="Joueurs">
          {roster.map((player) => (
            <PressableOpacity key={player.id} onPress={() => router.push(`/player/${player.id}`)} style={styles.playerRow}>
              <AppText variant="callout">
                #{player.number} {player.firstName} {player.lastName}
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                {POSITION_SHORT[player.position]}
              </AppText>
            </PressableOpacity>
          ))}
        </Section>

        <Section title="Fans">
          <AppText variant="body">{fanCount} partisan{fanCount > 1 ? 's' : ''} ont choisi {team.name} comme équipe favorite.</AppText>
        </Section>

        <Section title="Discussion des fans">
          {discussions.length === 0 ? (
            <EmptyState title="Le vestiaire est calme" body="Lancez la première discussion sur cette équipe." />
          ) : (
            discussions.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
  pad: { padding: 16 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  center: { textAlign: 'center' },
  follow: { alignSelf: 'stretch', marginTop: 8 },
  block: { gap: 10 },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
