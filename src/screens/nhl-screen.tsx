import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MatchCard } from '@/components/feed/match-card';
import { TabHeader } from '@/components/navigation/tab-header';
import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/empty-state';
import { FilterRow } from '@/components/ui/filter-row';
import { PressableOpacity } from '@/components/ui/pressable';
import { CardSkeleton } from '@/components/ui/skeleton';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius } from '@/constants/theme';
import { useNhlSnapshot } from '@/hooks/use-nhl';
import type { Conference, Match, Player, Standing, Team } from '@/services/nhl/nhl.types';
import { dayDiff, formatDay } from '@/utils/date';
import { POSITION_SHORT } from '@/utils/position';
import { CONFERENCE_LABEL, groupStandings } from '@/utils/standings';
import { fold } from '@/utils/text';

const PANES = [
  { id: 'matches', label: 'Matchs' },
  { id: 'standings', label: 'Classement' },
  { id: 'teams', label: 'Équipes' },
  { id: 'players', label: 'Joueurs' },
];

export function NhlScreen() {
  const [pane, setPane] = useState('matches');
  const query = useNhlSnapshot();

  return (
    <View style={styles.screen}>
      <TabHeader title="NHL" subtitle="Matchs, classement, équipes et joueurs." />
      <FilterRow options={PANES} value={pane} onChange={setPane} />
      {query.isLoading ? (
        <View style={styles.pad}>
          <CardSkeleton />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : pane === 'matches' ? (
        <MatchesPane teams={query.data.teams} matches={query.data.matches} />
      ) : pane === 'standings' ? (
        <StandingsPane teams={query.data.teams} standings={query.data.standings} />
      ) : pane === 'teams' ? (
        <TeamsPane teams={query.data.teams} />
      ) : (
        <PlayersPane players={query.data.players} teams={query.data.teams} />
      )}
    </View>
  );
}

function MatchesPane({ teams, matches }: { teams: Team[]; matches: Match[] }) {
  const byId = new Map(teams.map((team) => [team.id, team]));
  const today = matches.filter((match) => dayDiff(match.startTime) === 0);
  const upcoming = matches.filter((match) => dayDiff(match.startTime) > 0);
  const recent = matches.filter((match) => dayDiff(match.startTime) < 0);
  const sections = [
    { title: "Aujourd'hui", data: today },
    { title: 'Prochains matchs', data: upcoming },
    { title: 'Résultats récents', data: recent },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <AppText variant="label" color={colors.navy}>
            {section.title}
          </AppText>
          {section.data.map((match) => {
            const home = byId.get(match.homeTeamId);
            const away = byId.get(match.awayTeamId);
            if (!home || !away) return null;
            return (
              <View key={match.id} style={styles.matchBlock}>
                <AppText variant="caption" color={colors.faint}>
                  {formatDay(match.startTime)} · {match.venue}
                </AppText>
                <MatchCard match={match} home={home} away={away} layout="row" />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function StandingsPane({ teams, standings }: { teams: Team[]; standings: Standing[] }) {
  const [conference, setConference] = useState<Conference>('Eastern');
  const groups = useMemo(() => groupStandings(standings, teams, conference), [standings, teams, conference]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FilterRow
        options={[
          { id: 'Eastern', label: 'Est' },
          { id: 'Western', label: 'Ouest' },
        ]}
        value={conference}
        onChange={(id) => setConference(id as Conference)}
      />
      <AppText variant="footnote" color={colors.muted} style={styles.note}>
        {CONFERENCE_LABEL[conference]} · saison 2026-27
      </AppText>
      {groups.map((group) => (
        <View key={group.division} style={styles.section}>
          <AppText variant="label" color={colors.navy}>
            {group.label}
          </AppText>
          <View style={styles.tableHead}>
            <AppText variant="caption" color={colors.faint} style={styles.teamCol}>
              Équipe
            </AppText>
            {['PJ', 'V', 'D', 'DP', 'PTS'].map((label) => (
              <AppText key={label} variant="caption" color={colors.faint} style={styles.stat}>
                {label}
              </AppText>
            ))}
          </View>
          {group.rows.map((row) => (
            <PressableOpacity key={row.team.id} style={styles.standing} onPress={() => router.push(`/team/${row.team.id}`)}>
              <AppText variant="caption" color={colors.faint} style={styles.rank}>
                {row.rank}
              </AppText>
              <TeamLogo team={row.team} size={24} />
              <AppText variant="footnote" style={styles.teamCol} numberOfLines={1}>
                {row.team.name}
              </AppText>
              {[row.standing.played, row.standing.wins, row.standing.losses, row.standing.otLosses, row.standing.points].map(
                (value, index) => (
                  <AppText key={`${row.team.id}-${index}`} variant="footnote" style={[styles.stat, index === 4 && styles.points]}>
                    {value}
                  </AppText>
                ),
              )}
            </PressableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function TeamsPane({ teams }: { teams: Team[] }) {
  const ordered = [...teams].sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  return (
    <FlatList
      data={ordered}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <PressableOpacity style={styles.teamCard} onPress={() => router.push(`/team/${item.id}`)}>
          <View style={[styles.accent, { backgroundColor: item.primaryColor }]} />
          <TeamLogo team={item} size={52} />
          <AppText variant="caption" color={colors.muted}>
            {item.city}
          </AppText>
          <AppText variant="callout" numberOfLines={1}>
            {item.name}
          </AppText>
          <AppText variant="caption" color={colors.faint}>
            {item.abbreviation}
          </AppText>
        </PressableOpacity>
      )}
    />
  );
}

function PlayersPane({ players, teams }: { players: Player[]; teams: Team[] }) {
  const [query, setQuery] = useState('');
  const byId = new Map(teams.map((team) => [team.id, team]));
  const filtered = players
    .filter((player) => {
      const team = byId.get(player.teamId);
      const haystack = fold(`${player.firstName} ${player.lastName} ${team?.name ?? ''} ${team?.city ?? ''} ${player.position}`);
      return haystack.includes(fold(query.trim()));
    })
    .sort((a, b) => {
      if (a.position === 'G' && b.position !== 'G') return 1;
      if (b.position === 'G' && a.position !== 'G') return -1;
      if (a.position === 'G' && b.position === 'G') return (b.stats.wins ?? 0) - (a.stats.wins ?? 0);
      return b.stats.points - a.stats.points;
    });

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.playerList}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un joueur"
          placeholderTextColor={colors.faint}
          style={styles.search}
        />
      }
      renderItem={({ item }) => {
        const team = byId.get(item.teamId);
        const stat =
          item.position === 'G'
            ? `${item.stats.wins ?? 0} V · ${item.stats.savePct?.toFixed(3) ?? '—'} · ${item.stats.gaa?.toFixed(2) ?? '—'}`
            : `${item.stats.points} PTS · ${item.stats.goals} B · ${item.stats.assists} A`;
        return (
          <PressableOpacity style={styles.player} onPress={() => router.push(`/player/${item.id}`)}>
            <PlayerAvatar player={item} />
            <View style={styles.playerCopy}>
              <AppText variant="callout" numberOfLines={1}>
                {item.firstName} {item.lastName}
              </AppText>
              <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                {team?.abbreviation ?? item.teamId} · {POSITION_SHORT[item.position]} · #{item.number}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.navy}>
              {stat}
            </AppText>
          </PressableOpacity>
        );
      }}
    />
  );
}

function PlayerAvatar({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={styles.photoFallback}>
        <AppText variant="caption" color={colors.navy}>
          {player.firstName[0]}
          {player.lastName[0]}
        </AppText>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: player.photoUrl }}
      style={styles.photo}
      contentFit="cover"
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  scroll: { paddingBottom: 28, gap: 8 },
  section: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  matchBlock: { gap: 6 },
  note: { paddingHorizontal: 16, marginBottom: 8 },
  tableHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  standing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  rank: { width: 16, textAlign: 'center' },
  teamCol: { flex: 1 },
  stat: { width: 28, textAlign: 'right' },
  points: { fontWeight: '700', color: colors.navy },
  grid: { padding: 16, gap: 12, paddingBottom: 28 },
  columns: { gap: 12 },
  teamCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  accent: { position: 'absolute', left: 0, right: 0, top: 0, height: 4 },
  playerList: { paddingHorizontal: 16, paddingBottom: 28, gap: 8 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  playerCopy: { flex: 1, gap: 2 },
  photo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ice },
  photoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
