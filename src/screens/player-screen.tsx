import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/feed/post-card';
import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/skeleton';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useToastStore } from '@/store/useToastStore';
import { formatDay } from '@/utils/date';
import { POSITION_LABEL, POSITION_SHORT } from '@/utils/position';
import { fold } from '@/utils/text';

export function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nhl = useNhlSnapshot();
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const following = useCommunityStore((state) => state.followedPlayerIds.includes(String(id)));
  const toggle = useCommunityStore((state) => state.toggleFollowPlayer);
  const show = useToastStore((state) => state.show);
  const player = nhl.data?.players.find((item) => item.id === id);
  const team = nhl.data?.teams.find((item) => item.id === player?.teamId);

  if (nhl.isLoading) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Joueur" />
        <View style={styles.pad}>
          <CardSkeleton />
        </View>
      </View>
    );
  }
  if (nhl.isError || !nhl.data) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Joueur" />
        <ErrorState onRetry={() => void nhl.refetch()} />
      </View>
    );
  }
  if (!player || !team) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Joueur" />
        <EmptyState title="Joueur introuvable" body="Ce joueur n’est pas dans l’effectif chargé." />
      </View>
    );
  }

  const discussions = posts.filter((post) => {
    if (hidden.includes(post.id)) return false;
    return post.playerId === player.id || post.hashtags.some((tag) => fold(tag) === fold(player.tag));
  });
  const goalie = player.position === 'G';
  const stats = goalie
    ? [
        ['PJ', String(player.stats.games)],
        ['V', String(player.stats.wins ?? 0)],
        ['%ARR', player.stats.savePct?.toFixed(3) ?? '—'],
        ['MOY', player.stats.gaa?.toFixed(2) ?? '—'],
      ]
    : [
        ['PJ', String(player.stats.games)],
        ['B', String(player.stats.goals)],
        ['A', String(player.stats.assists)],
        ['PTS', String(player.stats.points)],
        ['+/-', `${player.stats.plusMinus > 0 ? '+' : ''}${player.stats.plusMinus}`],
      ];

  return (
    <View style={styles.screen}>
      <StackHeader title={`${player.firstName} ${player.lastName}`} subtitle={team.fullName} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.bar, { backgroundColor: team.primaryColor }]} />
          <Headshot uri={player.photoUrl} name={`${player.firstName} ${player.lastName}`} />
          <AppText variant="title" style={styles.center}>
            {player.firstName} {player.lastName}
          </AppText>
          <AppText variant="footnote" color={colors.muted}>
            #{player.number} · {POSITION_LABEL[player.position]} · {player.shoots === 'L' ? 'gauche' : 'droite'}
          </AppText>
          <PressTeam teamId={team.id} name={team.name} />
          <Button
            label={following ? 'Suivi' : 'Suivre'}
            variant={following ? 'secondary' : 'primary'}
            onPress={() => {
              const now = toggle(player.id);
              show(now ? `Vous suivez ${player.lastName}` : `Vous ne suivez plus ${player.lastName}`);
            }}
            style={styles.follow}
          />
        </View>
        <AppText variant="label" color={colors.navy}>
          Statistiques
        </AppText>
        <View style={styles.stats}>
          {stats.map(([label, value]) => (
            <View key={label} style={styles.stat}>
              <AppText variant="title3">{value}</AppText>
              <AppText variant="caption" color={colors.muted}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="label" color={colors.navy}>
          Matchs récents
        </AppText>
        {player.recentGames.map((game) => {
          const opponent = nhl.data?.teams.find((item) => item.id === game.opponentId);
          const when = new Date(Date.now() - game.daysAgo * 86_400_000).toISOString();
          return (
            <View key={`${game.opponentId}-${game.daysAgo}`} style={styles.game}>
              {opponent ? <TeamLogo team={opponent} size={28} /> : null}
              <View style={styles.flex}>
                <AppText variant="callout">vs {opponent?.abbreviation ?? game.opponentId}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {formatDay(when)}
                  {goalie
                    ? ''
                    : ` · ${game.goals ?? 0} B, ${game.assists ?? 0} A`}
                </AppText>
              </View>
              <AppText variant="callout" color={game.win ? colors.success : colors.red}>
                {game.result}
              </AppText>
            </View>
          );
        })}
        <AppText variant="label" color={colors.navy}>
          Discussions
        </AppText>
        {discussions.length === 0 ? (
          <EmptyState title="Aucune discussion" body={`Parlez de ${player.lastName} depuis la communauté.`} />
        ) : (
          discussions.map((post) => <PostCard key={post.id} post={post} />)
        )}
        <AppText variant="caption" color={colors.faint}>
          {POSITION_SHORT[player.position]} · {team.abbreviation}
        </AppText>
      </ScrollView>
    </View>
  );
}

function PressTeam({ teamId, name }: { teamId: string; name: string }) {
  const nhl = useNhlSnapshot();
  const team = nhl.data?.teams.find((item) => item.id === teamId);
  if (!team) return null;
  return (
    <Button label={name} variant="ghost" onPress={() => router.push(`/team/${teamId}`)} />
  );
}

function Headshot({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={styles.headFallback}>
        <AppText variant="title3" color={colors.navy}>
          {name
            .split(' ')
            .map((part) => part[0])
            .join('')}
        </AppText>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.head}
      contentFit="cover"
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, right: 0, top: 0, height: 6 },
  center: { textAlign: 'center' },
  follow: { alignSelf: 'stretch', marginTop: 8 },
  head: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.ice },
  headFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  game: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
  },
  flex: { flex: 1 },
});
