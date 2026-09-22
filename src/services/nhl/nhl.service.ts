import { RAW_MATCHES, RAW_PLAYERS, RAW_STANDINGS, RAW_TEAMS } from '@/services/nhl/nhl.mock';
import { mapMatch, mapPlayer, mapStanding, mapTeam } from '@/services/nhl/nhl.mapper';
import type { NhlSnapshot } from '@/services/nhl/nhl.types';
import { delay } from '@/utils/text';

/**
 * Seule porte d'entrée des données NHL.
 * Remplacer le corps de getNhlSnapshot pour brancher un fournisseur réel,
 * sans toucher aux écrans.
 */
export async function getNhlSnapshot(): Promise<NhlSnapshot> {
  await delay(320);
  return {
    teams: RAW_TEAMS.map(mapTeam),
    players: RAW_PLAYERS.map(mapPlayer),
    matches: RAW_MATCHES.map((match) => mapMatch(match)),
    standings: RAW_STANDINGS.map(mapStanding),
  };
}
