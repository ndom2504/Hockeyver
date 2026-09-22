import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getNhlSnapshot } from '@/services/nhl/nhl.service';

export function useNhlSnapshot() {
  return useQuery({
    queryKey: ['nhl'],
    queryFn: getNhlSnapshot,
    staleTime: 5 * 60_000,
  });
}

export function useNhlIndex() {
  const query = useNhlSnapshot();
  const index = useMemo(() => {
    return {
      teams: new Map(query.data?.teams.map((team) => [team.id, team]) ?? []),
      players: new Map(query.data?.players.map((player) => [player.id, player]) ?? []),
      matches: new Map(query.data?.matches.map((match) => [match.id, match]) ?? []),
    };
  }, [query.data]);
  return { ...query, index };
}
