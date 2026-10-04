import { RAW_TEAMS } from './nhl.mock';
import type { FinishType, GoalEvent, Match, MatchStatus, NewsItem, Standing } from './nhl.types';

const NHL = 'https://api-web.nhle.com/v1';
const NEWS = 'https://forge-dapi.d3.nhle.com/v2/content/fr-ca/stories?tags.slug=news&$limit=20';
const TEAM_IDS = new Set(RAW_TEAMS.map((team) => team.id));

type Side = { abbrev?: string; score?: number };
type Game = {
  id?: number;
  gameType?: number;
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
type Label = { default?: string };
type ScoreGoal = {
  periodDescriptor?: { number?: number; periodType?: string };
  timeInPeriod?: string;
  firstName?: Label;
  lastName?: Label;
  name?: Label;
  teamAbbrev?: string | Label;
  strength?: string;
  goalModifier?: string;
};
type Score = { currentDate?: string; prevDate?: string; games?: { id?: number; goals?: ScoreGoal[] }[] };
type Story = {
  slug?: string;
  headline?: string;
  title?: string;
  summary?: string;
  contentDate?: string;
  tags?: { slug?: string; extraData?: { abbreviation?: string } | null }[];
  thumbnail?: { templateUrl?: string };
};
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

export type OfficialBoard = { matches: Match[]; standings: Standing[]; news: NewsItem[] };

export async function loadOfficialBoard(): Promise<OfficialBoard> {
  const [schedule, standings, score, stories] = await Promise.all([
    fetchJson<Schedule>(`${NHL}/schedule/now`),
    fetchJson<{ standings?: StandingRow[] }>(`${NHL}/standings/now`),
    fetchJson<Score>(`${NHL}/score/now`).catch(() => null),
    fetchJson<{ items?: Story[] }>(NEWS).catch(() => null),
  ]);
  const firstDay = schedule.gameWeek?.[0]?.date;
  const prevDate = score?.prevDate;
  const [lastWeek, twoWeeks, prevScore, olderScore] = await Promise.all([
    firstDay ? fetchJson<Schedule>(`${NHL}/schedule/${shiftDate(firstDay, -7)}`).catch(() => null) : null,
    firstDay ? fetchJson<Schedule>(`${NHL}/schedule/${shiftDate(firstDay, -14)}`).catch(() => null) : null,
    prevDate ? fetchJson<Score>(`${NHL}/score/${prevDate}`).catch(() => null) : null,
    prevDate ? fetchJson<Score>(`${NHL}/score/${shiftDate(prevDate, -1)}`).catch(() => null) : null,
  ]);
  const games = [twoWeeks, lastWeek, schedule].flatMap((week) => (week?.gameWeek ?? []).flatMap((day) => day.games ?? []));
  const goals = goalIndex([score, prevScore, olderScore]);
  return {
    matches: unique(games)
      .map(mapGame)
      .filter((match): match is Match => match !== null)
      .map((match) => (goals.has(match.id) ? { ...match, goals: goals.get(match.id) } : match)),
    standings: (standings.standings ?? []).map(mapStanding).filter((row): row is Standing => row !== null),
    news: (stories?.items ?? []).map(mapStory).filter((item): item is NewsItem => item !== null),
  };
}

function goalIndex(scores: (Score | null)[]) {
  const index = new Map<string, GoalEvent[]>();
  for (const score of scores) {
    for (const game of score?.games ?? []) {
      if (!game.id || index.has(String(game.id))) continue;
      const goals = (game.goals ?? []).map(mapGoal).filter((goal): goal is GoalEvent => goal !== null);
      index.set(String(game.id), goals);
    }
  }
  return index;
}

function mapGoal(goal: ScoreGoal): GoalEvent | null {
  const abbrev = typeof goal.teamAbbrev === 'string' ? goal.teamAbbrev : goal.teamAbbrev?.default;
  const id = teamId(abbrev);
  const type = goal.periodDescriptor?.periodType;
  if (!id || type === 'SO') return null;
  const first = goal.firstName?.default ?? '';
  const last = goal.lastName?.default ?? '';
  const scorer = `${first} ${last}`.trim() || goal.name?.default || '';
  if (!scorer) return null;
  const strength = goal.strength === 'pp' || goal.strength === 'sh' ? goal.strength : 'ev';
  return {
    teamId: id,
    scorer,
    period: type === 'OT' ? 'Prol.' : periodLabel(goal.periodDescriptor),
    time: goal.timeInPeriod ?? '',
    strength,
    emptyNet: goal.goalModifier === 'empty-net',
  };
}

function mapStory(story: Story): NewsItem | null {
  const title = (story.headline || story.title || '').trim();
  if (!story.slug || !title || !story.contentDate) return null;
  const teamIds = [
    ...new Set(
      (story.tags ?? [])
        .map((tag) => teamId(tag.extraData?.abbreviation))
        .filter((id): id is string => id !== null),
    ),
  ];
  const matchup = /^([A-Z]{2,3})@([A-Z]{2,3})/.exec(title);
  const isRecap = (story.tags ?? []).some((tag) => tag.slug === 'game-recap') || story.slug.startsWith('resume-du-match');
  const pair = !matchup && teamIds.length === 2 ? teamIds : null;
  const awayTeamId = matchup ? teamId(matchup[1]) : (pair?.[0] ?? null);
  const homeTeamId = matchup ? teamId(matchup[2]) : (pair?.[1] ?? null);
  const template = story.thumbnail?.templateUrl;
  return {
    id: story.slug,
    title,
    lead: firstParagraph(story.summary ?? ''),
    url: `https://www.nhl.com/fr/news/${story.slug}`,
    imageUrl: template ? template.replace('{formatInstructions}', 't_ratio16_9-size40') : undefined,
    teamIds: [...new Set([...teamIds, awayTeamId, homeTeamId].filter((id): id is string => Boolean(id)))],
    publishedAt: story.contentDate,
    recap: isRecap && awayTeamId && homeTeamId ? { awayTeamId, homeTeamId } : undefined,
  };
}

function firstParagraph(summary: string) {
  const paragraph = summary.split(/\n+/).map((part) => part.trim()).find((part) => part.length > 40) ?? summary.trim();
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph];
  let lead = '';
  for (const sentence of sentences) {
    if ((lead + sentence).length > 280 && lead) break;
    lead += sentence;
  }
  return lead.trim();
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
    preseason: game.gameType === 1 ? true : undefined,
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
