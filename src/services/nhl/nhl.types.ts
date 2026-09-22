export type Conference = 'Eastern' | 'Western';
export type Division = 'Atlantic' | 'Metropolitan' | 'Central' | 'Pacific';
export type SkaterPosition = 'C' | 'LW' | 'RW' | 'D' | 'G';
export type MatchStatus = 'scheduled' | 'live' | 'final';
export type FinishType = 'regulation' | 'ot' | 'so';

export type Team = {
  id: string;
  city: string;
  name: string;
  fullName: string;
  abbreviation: string;
  tag: string;
  conference: Conference;
  division: Division;
  primaryColor: string;
  onPrimary: string;
  logoUrl: string;
};

export type PlayerStats = {
  games: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  wins?: number;
  savePct?: number;
  gaa?: number;
};

export type RecentGame = {
  daysAgo: number;
  opponentId: string;
  result: string;
  win: boolean;
  goals?: number;
  assists?: number;
  saves?: number;
  shotsAgainst?: number;
};

export type Player = {
  id: string;
  nhlId: number;
  firstName: string;
  lastName: string;
  teamId: string;
  position: SkaterPosition;
  number: number;
  shoots: 'L' | 'R';
  photoUrl: string;
  tag: string;
  stats: PlayerStats;
  recentGames: RecentGame[];
};

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: MatchStatus;
  periodLabel?: string;
  clock?: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  finishedIn?: FinishType;
};

export type Standing = {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  goalDiff: number;
  streak: string;
};

export type NhlSnapshot = {
  teams: Team[];
  players: Player[];
  matches: Match[];
  standings: Standing[];
};

export type RawTeam = {
  id: string;
  city: string;
  name: string;
  fullName: string;
  tag: string;
  conference: Conference;
  division: Division;
  color: string;
};

export type RawPlayer = {
  id: string;
  nhlId: number;
  first: string;
  last: string;
  team: string;
  pos: SkaterPosition;
  no: number;
  shoots: 'L' | 'R';
  gp: number;
  g: number;
  a: number;
  pm: number;
  w?: number;
  sv?: number;
  gaa?: number;
};

export type RawMatch = {
  id: string;
  home: string;
  away: string;
  startOffsetMinutes: number;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  finishedIn?: FinishType;
};

export type RawStanding = {
  team: string;
  wins: number;
  losses: number;
  ot: number;
  diff: number;
  streak: string;
};
