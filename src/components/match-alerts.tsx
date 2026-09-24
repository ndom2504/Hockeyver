import { useEffect, useRef } from 'react';

import { useNhlSnapshot } from '@/hooks/use-nhl';
import type { Match } from '@/services/nhl/nhl.types';
import { useCommunityStore } from '@/store/useCommunityStore';

type Seen = { status: Match['status']; home: number; away: number };

export function MatchAlerts() {
  const { data } = useNhlSnapshot();
  const seen = useRef<Map<string, Seen> | null>(null);

  useEffect(() => {
    if (!data) return;
    const next = new Map(data.matches.map((match) => [match.id, snapshot(match)]));
    const previous = seen.current;
    seen.current = next;
    if (!previous) return;

    const receive = useCommunityStore.getState().receiveAlert;
    for (const match of data.matches) {
      const before = previous.get(match.id);
      if (!before) continue;
      const home = data.teams.find((team) => team.id === match.homeTeamId);
      const away = data.teams.find((team) => team.id === match.awayTeamId);
      if (!home || !away) continue;

      const liveScore = `${away.abbreviation} ${match.awayScore} – ${match.homeScore} ${home.abbreviation}`;
      const finalScore = `${home.abbreviation} ${match.homeScore} – ${match.awayScore} ${away.abbreviation}`;
      const scored = match.homeScore > before.home || match.awayScore > before.away;

      if (match.status === 'live' && scored) {
        receive({ type: 'goal', matchId: match.id, title: 'But', body: liveScore });
      } else if (before.status !== 'final' && match.status === 'final') {
        receive({ type: 'game_result', matchId: match.id, title: 'Résultat', body: finalScore });
      } else if (before.status === 'scheduled' && match.status === 'live') {
        receive({
          type: 'game_start',
          matchId: match.id,
          title: "Coup d'envoi",
          body: `${away.abbreviation} chez ${home.abbreviation}`,
        });
      }
    }
  }, [data]);

  return null;
}

function snapshot(match: Match): Seen {
  return { status: match.status, home: match.homeScore, away: match.awayScore };
}
