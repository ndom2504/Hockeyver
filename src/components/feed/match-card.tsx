import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { colors, radius, shadow } from '@/constants/theme';
import type { Match, Team } from '@/services/nhl/nhl.types';
import { formatDay, formatTime } from '@/utils/date';

type Props = {
  match: Match;
  home: Team;
  away: Team;
  layout?: 'tile' | 'row';
};

function statusLabel(match: Match) {
  if (match.status === 'live') return `${match.periodLabel ?? 'En cours'}${match.clock ? ` · ${match.clock}` : ''}`;
  if (match.status === 'final') {
    if (match.finishedIn === 'ot') return 'Terminé · PROL';
    if (match.finishedIn === 'so') return 'Terminé · TB';
    return 'Terminé';
  }
  return formatTime(match.startTime);
}

export function MatchCard({ match, home, away, layout = 'tile' }: Props) {
  const open = () => router.push(`/match/${match.id}`);
  const live = match.status === 'live';
  const showScore = match.status !== 'scheduled';

  if (layout === 'row') {
    return (
      <PressableOpacity accessibilityRole="button" onPress={open} style={styles.row}>
        <View style={styles.rowTeams}>
          <View style={styles.side}>
            <TeamLogo team={away} size={28} />
            <AppText variant="callout">{away.abbreviation}</AppText>
          </View>
          <AppText variant="caption" color={colors.faint}>
            chez
          </AppText>
          <View style={styles.side}>
            <TeamLogo team={home} size={28} />
            <AppText variant="callout">{home.abbreviation}</AppText>
          </View>
        </View>
        <View style={styles.rowMeta}>
          {showScore ? (
            <AppText variant="callout">
              {match.awayScore} – {match.homeScore}
            </AppText>
          ) : null}
          <AppText variant="caption" color={live ? colors.red : colors.muted}>
            {match.status === 'scheduled' ? `${formatDay(match.startTime)} · ${formatTime(match.startTime)}` : statusLabel(match)}
          </AppText>
        </View>
      </PressableOpacity>
    );
  }

  return (
    <PressableOpacity accessibilityRole="button" onPress={open} style={styles.tile}>
      <AppText variant="caption" color={live ? colors.red : colors.muted}>
        {statusLabel(match)}
      </AppText>
      <TeamLine team={away} score={showScore ? match.awayScore : undefined} />
      <TeamLine team={home} score={showScore ? match.homeScore : undefined} />
    </PressableOpacity>
  );
}

function TeamLine({ team, score }: { team: Team; score?: number }) {
  return (
    <View style={styles.line}>
      <TeamLogo team={team} size={28} />
      <AppText variant="callout" style={styles.flex} numberOfLines={1}>
        {team.abbreviation}
      </AppText>
      {score !== undefined ? <AppText variant="callout">{score}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 176,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: { flex: 1 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  rowTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
