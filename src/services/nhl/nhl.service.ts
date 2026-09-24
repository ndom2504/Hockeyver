import { apiRequest } from '@/api/client';
import { RAW_MATCHES, RAW_PLAYERS, RAW_STANDINGS, RAW_TEAMS } from '@/services/nhl/nhl.mock';
import { mapMatch, mapPlayer, mapStanding, mapTeam } from '@/services/nhl/nhl.mapper';
import type { OfficialBoard } from '@/services/nhl/nhl.live';
import type { NhlSnapshot } from '@/services/nhl/nhl.types';

/**
 * Seule porte d'entrée des données NHL.
 * Le calendrier et le classement viennent du fil officiel, via le serveur de l'app.
 * Les équipes et les joueurs restent le répertoire local.
 * Tant qu'un match est en direct, l'app relance cette fonction toutes les 15 s.
 */
export async function getNhlSnapshot(): Promise<NhlSnapshot> {
  const teams = RAW_TEAMS.map(mapTeam);
  const players = RAW_PLAYERS.map(mapPlayer);
  const fallback = {
    teams,
    players,
    matches: RAW_MATCHES.map((match) => mapMatch(match)),
    standings: RAW_STANDINGS.map(mapStanding),
  };
  try {
    const board = await apiRequest<OfficialBoard>('/api/nhl/snapshot', { method: 'GET' });
    if (board.matches.length === 0) return fallback;
    return {
      teams,
      players,
      matches: board.matches,
      standings: board.standings.length > 0 ? board.standings : fallback.standings,
    };
  } catch {
    return fallback;
  }
}
