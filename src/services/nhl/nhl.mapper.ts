import { onColor } from '@/utils/color';
import type {
  Match,
  MatchStatus,
  Player,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawTeam,
  RecentGame,
  Standing,
  Team,
} from '@/services/nhl/nhl.types';

const ESPN_SLUG: Record<string, string> = {
  LAK: 'la',
  NJD: 'nj',
  SJS: 'sj',
  TBL: 'tb',
  UTA: 'utah',
};

const OPPONENTS = ['BOS', 'TOR', 'FLA', 'EDM', 'COL', 'NYR', 'DAL', 'VGK', 'MTL', 'CAR', 'WPG', 'VAN'];
const LIVE_WINDOW_MS = 135 * 60 * 1000;

export function teamLogoUrl(abbreviation: string) {
  const slug = ESPN_SLUG[abbreviation] ?? abbreviation.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nhl/500/${slug}.png`;
}

export function playerPhotoUrl(teamId: string, nhlId: number) {
  return `https://assets.nhle.com/mugs/nhl/20252026/${teamId}/${nhlId}.png`;
}

export function mapTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    city: raw.city,
    name: raw.name,
    fullName: raw.fullName,
    abbreviation: raw.id,
    tag: raw.tag,
    conference: raw.conference,
    division: raw.division,
    primaryColor: raw.color,
    onPrimary: onColor(raw.color),
    logoUrl: teamLogoUrl(raw.id),
  };
}

function recentGames(raw: RawPlayer): RecentGame[] {
  const seed = raw.nhlId % 9;
  const pool = OPPONENTS.filter((team) => team !== raw.team);
  return [0, 1, 2].map((index) => {
    const opponentId = pool[(seed + index) % pool.length] ?? 'BOS';
    const win = (seed + index) % 2 === 0;
    const teamGoals = 2 + ((seed + index) % 3);
    const oppGoals = win ? teamGoals - 1 : teamGoals + 1;
    const goalie = raw.pos === 'G';
    return {
      daysAgo: 2 + index * 3,
      opponentId,
      result: `${win ? 'V' : 'D'} ${teamGoals}-${oppGoals}`,
      win,
      goals: goalie ? undefined : (seed + index) % 3,
      assists: goalie ? undefined : (seed + index + 1) % 2,
      saves: goalie ? 22 + ((seed + index * 3) % 12) : undefined,
      shotsAgainst: goalie ? 26 + ((seed + index * 2) % 10) : undefined,
    };
  });
}

export function mapPlayer(raw: RawPlayer): Player {
  const tag = raw.last.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return {
    id: raw.id,
    nhlId: raw.nhlId,
    firstName: raw.first,
    lastName: raw.last,
    teamId: raw.team,
    position: raw.pos,
    number: raw.no,
    shoots: raw.shoots,
    photoUrl: playerPhotoUrl(raw.team, raw.nhlId),
    tag,
    stats: {
      games: raw.gp,
      goals: raw.g,
      assists: raw.a,
      points: raw.g + raw.a,
      plusMinus: raw.pm,
      wins: raw.w,
      savePct: raw.sv,
      gaa: raw.gaa,
    },
    recentGames: recentGames(raw),
  };
}

export function mapMatch(raw: RawMatch, now = Date.now()): Match {
  const start = now + raw.startOffsetMinutes * 60_000;
  let status: MatchStatus = 'scheduled';
  let periodLabel: string | undefined;
  let clock: string | undefined;

  if (start <= now) {
    const elapsed = now - start;
    if (elapsed < LIVE_WINDOW_MS) {
      status = 'live';
      const periodMs = 45 * 60 * 1000;
      const period = Math.min(3, Math.floor(elapsed / periodMs) + 1);
      const remain = periodMs - (elapsed % periodMs);
      const minutes = Math.floor(remain / 60_000);
      const seconds = Math.floor((remain % 60_000) / 1000);
      periodLabel = period === 1 ? '1re' : `${period}e`;
      clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
      status = 'final';
    }
  }

  return {
    id: raw.id,
    homeTeamId: raw.home,
    awayTeamId: raw.away,
    startTime: new Date(start).toISOString(),
    status,
    periodLabel,
    clock,
    homeScore: raw.homeScore ?? 0,
    awayScore: raw.awayScore ?? 0,
    venue: raw.venue,
    finishedIn: status === 'final' ? raw.finishedIn : undefined,
  };
}

export function mapStanding(raw: RawStanding): Standing {
  return {
    teamId: raw.team,
    played: raw.wins + raw.losses + raw.ot,
    wins: raw.wins,
    losses: raw.losses,
    otLosses: raw.ot,
    points: raw.wins * 2 + raw.ot,
    goalDiff: raw.diff,
    streak: raw.streak,
  };
}
