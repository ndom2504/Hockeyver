import { RAW_TEAMS } from '@/services/nhl/nhl.mock';
import type { FinishType, Match, MatchStatus, Standing } from '@/services/nhl/nhl.types';

const NHL = 'https://api-web.nhle.com/v1';
const TEAM_IDS = new Set(RAW_TEAMS.map((team) => team.id));

type Side = { abbrev?: string; score?: number };
type Game = {
  id?: number;
  startTimeUTC?: string;
  gameState?: string;
  venue?: { default?: string };
  awayTeam?: Side;
  homeTeam?: Side;
  periodDescriptor?: { number?: number; periodType?: string };
  clock?: { timeRemaining?: string };
  gameOutcome?: { lastPeriodType?: string };
};
type Schedule = { gameWeek?: { date?: string; games?: Game[] }[] };
type StandingRow = {
  teamAbbrev?: { default?: string };
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  points?: number;
  goalDifferential?: number;
  streakCode?: string;
  streakCount?: number;
};

export type OfficialBoard = { matches: Match[]; standings: Standing[] };

export async function loadOfficialBoard(): Promise<OfficialBoard> {
  const [schedule, standings] = await Promise.all([
    fetchJson<Schedule>(`${NHL}/schedule/now`),
    fetchJson<{ standings?: StandingRow[] }>(`${NHL}/standings/now`),
  ]);
  const firstDay = schedule.gameWeek?.[0]?.date;
  const previous = firstDay ? await fetchJson<Schedule>(`${NHL}/schedule/${shiftDate(firstDay, -7)}`).catch(() => null) : null;
  const games = [...(previous?.gameWeek ?? []), ...(schedule.gameWeek ?? [])].flatMap((day) => day.games ?? []);
  return {
    matches: unique(games).map(mapGame).filter((match): match is Match => match !== null),
    standings: (standings.standings ?? []).map(mapStanding).filter((row): row is Standing => row !== null),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`NHL ${response.status}`);
  return response.json() as Promise<T>;
}

function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function unique(games: Game[]) {
  const seen = new Set<number>();
  return games.filter((game) => {
    if (!game.id || seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

function teamId(abbrev?: string) {
  if (!abbrev) return null;
  const alias: Record<string, string> = { LA: 'LAK', NJ: 'NJD', SJ: 'SJS', TB: 'TBL' };
  const id = alias[abbrev] ?? abbrev;
  return TEAM_IDS.has(id) ? id : null;
}

function mapGame(game: Game): Match | null {
  const homeTeamId = teamId(game.homeTeam?.abbrev);
  const awayTeamId = teamId(game.awayTeam?.abbrev);
  if (!game.id || !homeTeamId || !awayTeamId || !game.startTimeUTC) return null;
  const status = matchStatus(game.gameState);
  const period = game.periodDescriptor?.periodType;
  const outcome = game.gameOutcome?.lastPeriodType ?? period;
  return {
    id: String(game.id),
    homeTeamId,
    awayTeamId,
    startTime: game.startTimeUTC,
    status,
    periodLabel: status === 'live' ? periodLabel(game.periodDescriptor) : undefined,
    clock: status === 'live' ? game.clock?.timeRemaining : undefined,
    homeScore: game.homeTeam?.score ?? 0,
    awayScore: game.awayTeam?.score ?? 0,
    venue: game.venue?.default ?? '',
    finishedIn: status === 'final' ? finishType(outcome) : undefined,
  };
}

function matchStatus(state?: string): MatchStatus {
  if (state === 'LIVE' || state === 'CRIT') return 'live';
  if (state === 'OFF' || state === 'FINAL' || state === 'OVER') return 'final';
  return 'scheduled';
}

function periodLabel(period?: { number?: number; periodType?: string }) {
  if (period?.periodType === 'OT') return 'Prol.';
  if (period?.periodType === 'SO') return 'Tirs';
  if (period?.number === 1) return '1re';
  if (period?.number) return `${period.number}e`;
  return 'En cours';
}

function finishType(period?: string): FinishType {
  if (period === 'OT') return 'ot';
  if (period === 'SO') return 'so';
  return 'regulation';
}

function mapStanding(row: StandingRow): Standing | null {
  const teamIdValue = teamId(row.teamAbbrev?.default);
  if (!teamIdValue) return null;
  const code = row.streakCode === 'W' ? 'V' : row.streakCode === 'L' ? 'D' : 'N';
  return {
    teamId: teamIdValue,
    played: row.gamesPlayed ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    otLosses: row.otLosses ?? 0,
    points: row.points ?? 0,
    goalDiff: row.goalDifferential ?? 0,
    streak: `${code}${row.streakCount ?? 0}`,
  };
}
