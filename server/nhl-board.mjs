// src/services/nhl/nhl.mock.ts
var RAW_TEAMS = [
  { id: "ANA", city: "Anaheim", name: "Ducks", fullName: "Ducks d'Anaheim", tag: "Ducks", conference: "Western", division: "Pacific", color: "#F47A38" },
  { id: "BOS", city: "Boston", name: "Bruins", fullName: "Bruins de Boston", tag: "Bruins", conference: "Eastern", division: "Atlantic", color: "#FFB81C" },
  { id: "BUF", city: "Buffalo", name: "Sabres", fullName: "Sabres de Buffalo", tag: "Sabres", conference: "Eastern", division: "Atlantic", color: "#003087" },
  { id: "CGY", city: "Calgary", name: "Flames", fullName: "Flames de Calgary", tag: "Flames", conference: "Western", division: "Pacific", color: "#D2001C" },
  { id: "CAR", city: "Caroline", name: "Hurricanes", fullName: "Hurricanes de la Caroline", tag: "Hurricanes", conference: "Eastern", division: "Metropolitan", color: "#CC0000" },
  { id: "CHI", city: "Chicago", name: "Blackhawks", fullName: "Blackhawks de Chicago", tag: "Blackhawks", conference: "Western", division: "Central", color: "#CF0A2C" },
  { id: "COL", city: "Colorado", name: "Avalanche", fullName: "Avalanche du Colorado", tag: "Avalanche", conference: "Western", division: "Central", color: "#6F263D" },
  { id: "CBJ", city: "Columbus", name: "Blue Jackets", fullName: "Blue Jackets de Columbus", tag: "BlueJackets", conference: "Eastern", division: "Metropolitan", color: "#002654" },
  { id: "DAL", city: "Dallas", name: "Stars", fullName: "Stars de Dallas", tag: "Stars", conference: "Western", division: "Central", color: "#006847" },
  { id: "DET", city: "D\xE9troit", name: "Red Wings", fullName: "Red Wings de D\xE9troit", tag: "RedWings", conference: "Eastern", division: "Atlantic", color: "#CE1126" },
  { id: "EDM", city: "Edmonton", name: "Oilers", fullName: "Oilers d'Edmonton", tag: "Oilers", conference: "Western", division: "Pacific", color: "#041E42" },
  { id: "FLA", city: "Floride", name: "Panthers", fullName: "Panthers de la Floride", tag: "Panthers", conference: "Eastern", division: "Atlantic", color: "#041E42" },
  { id: "LAK", city: "Los Angeles", name: "Kings", fullName: "Kings de Los Angeles", tag: "Kings", conference: "Western", division: "Pacific", color: "#111111" },
  { id: "MIN", city: "Minnesota", name: "Wild", fullName: "Wild du Minnesota", tag: "Wild", conference: "Western", division: "Central", color: "#154734" },
  { id: "MTL", city: "Montr\xE9al", name: "Canadiens", fullName: "Canadiens de Montr\xE9al", tag: "Canadiens", conference: "Eastern", division: "Atlantic", color: "#AF1E2D" },
  { id: "NSH", city: "Nashville", name: "Predators", fullName: "Predators de Nashville", tag: "Predators", conference: "Western", division: "Central", color: "#FFB81C" },
  { id: "NJD", city: "New Jersey", name: "Devils", fullName: "Devils du New Jersey", tag: "Devils", conference: "Eastern", division: "Metropolitan", color: "#CE1126" },
  { id: "NYI", city: "Long Island", name: "Islanders", fullName: "Islanders de New York", tag: "Islanders", conference: "Eastern", division: "Metropolitan", color: "#00539B" },
  { id: "NYR", city: "New York", name: "Rangers", fullName: "Rangers de New York", tag: "Rangers", conference: "Eastern", division: "Metropolitan", color: "#0038A8" },
  { id: "OTT", city: "Ottawa", name: "S\xE9nateurs", fullName: "S\xE9nateurs d'Ottawa", tag: "Senateurs", conference: "Eastern", division: "Atlantic", color: "#E31837" },
  { id: "PHI", city: "Philadelphie", name: "Flyers", fullName: "Flyers de Philadelphie", tag: "Flyers", conference: "Eastern", division: "Metropolitan", color: "#F74902" },
  { id: "PIT", city: "Pittsburgh", name: "Penguins", fullName: "Penguins de Pittsburgh", tag: "Penguins", conference: "Eastern", division: "Metropolitan", color: "#FCB514" },
  { id: "SJS", city: "San Jose", name: "Sharks", fullName: "Sharks de San Jose", tag: "Sharks", conference: "Western", division: "Pacific", color: "#006D75" },
  { id: "SEA", city: "Seattle", name: "Kraken", fullName: "Kraken de Seattle", tag: "Kraken", conference: "Western", division: "Pacific", color: "#001628" },
  { id: "STL", city: "Saint-Louis", name: "Blues", fullName: "Blues de Saint-Louis", tag: "Blues", conference: "Western", division: "Central", color: "#002F87" },
  { id: "TBL", city: "Tampa", name: "Lightning", fullName: "Lightning de Tampa", tag: "Lightning", conference: "Eastern", division: "Atlantic", color: "#002868" },
  { id: "TOR", city: "Toronto", name: "Maple Leafs", fullName: "Maple Leafs de Toronto", tag: "MapleLeafs", conference: "Eastern", division: "Atlantic", color: "#00205B" },
  { id: "UTA", city: "Utah", name: "Mammoth", fullName: "Mammoth de l'Utah", tag: "Mammoth", conference: "Western", division: "Central", color: "#6CACE4" },
  { id: "VAN", city: "Vancouver", name: "Canucks", fullName: "Canucks de Vancouver", tag: "Canucks", conference: "Western", division: "Pacific", color: "#00205B" },
  { id: "VGK", city: "Las Vegas", name: "Golden Knights", fullName: "Golden Knights de Vegas", tag: "Vegas", conference: "Western", division: "Pacific", color: "#B4975A" },
  { id: "WSH", city: "Washington", name: "Capitals", fullName: "Capitals de Washington", tag: "Capitals", conference: "Eastern", division: "Metropolitan", color: "#C8102E" },
  { id: "WPG", city: "Winnipeg", name: "Jets", fullName: "Jets de Winnipeg", tag: "Jets", conference: "Western", division: "Central", color: "#041E42" }
];
var RAW_MATCHES = [
  { id: "m-bos-buf", home: "BOS", away: "BUF", startOffsetMinutes: -160, homeScore: 4, awayScore: 1, venue: "TD Garden" },
  { id: "m-mtl-tor", home: "MTL", away: "TOR", startOffsetMinutes: -38, homeScore: 2, awayScore: 1, venue: "Centre Bell" },
  { id: "m-edm-vgk", home: "VGK", away: "EDM", startOffsetMinutes: 130, venue: "T-Mobile Arena" },
  { id: "m-col-dal", home: "DAL", away: "COL", startOffsetMinutes: 290, venue: "American Airlines Center" },
  { id: "m-nyr-car", home: "CAR", away: "NYR", startOffsetMinutes: -60 * 26, homeScore: 3, awayScore: 2, venue: "PNC Arena", finishedIn: "ot" },
  { id: "m-wpg-min", home: "MIN", away: "WPG", startOffsetMinutes: -60 * 28, homeScore: 1, awayScore: 2, venue: "Xcel Energy Center" },
  { id: "m-fla-tbl", home: "TBL", away: "FLA", startOffsetMinutes: -60 * 32, homeScore: 5, awayScore: 2, venue: "Amalie Arena" },
  { id: "m-pit-wsh", home: "WSH", away: "PIT", startOffsetMinutes: 60 * 22, venue: "Capital One Arena" },
  { id: "m-chi-det", home: "DET", away: "CHI", startOffsetMinutes: 60 * 26, venue: "Little Caesars Arena" },
  { id: "m-van-sea", home: "SEA", away: "VAN", startOffsetMinutes: 60 * 30, venue: "Climate Pledge Arena" },
  { id: "m-lak-ana", home: "ANA", away: "LAK", startOffsetMinutes: 60 * 50, venue: "Honda Center" },
  { id: "m-ott-phi", home: "PHI", away: "OTT", startOffsetMinutes: 60 * 54, venue: "Xfinity Mobile Arena" }
];

// src/services/nhl/nhl.live.ts
var NHL = "https://api-web.nhle.com/v1";
var TEAM_IDS = new Set(RAW_TEAMS.map((team) => team.id));
async function loadOfficialBoard() {
  const [schedule, standings] = await Promise.all([
    fetchJson(`${NHL}/schedule/now`),
    fetchJson(`${NHL}/standings/now`)
  ]);
  const firstDay = schedule.gameWeek?.[0]?.date;
  const previous = firstDay ? await fetchJson(`${NHL}/schedule/${shiftDate(firstDay, -7)}`).catch(() => null) : null;
  const games = [...previous?.gameWeek ?? [], ...schedule.gameWeek ?? []].flatMap((day) => day.games ?? []);
  return {
    matches: unique(games).map(mapGame).filter((match) => match !== null),
    standings: (standings.standings ?? []).map(mapStanding).filter((row) => row !== null)
  };
}
async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8e3) });
  if (!response.ok) throw new Error(`NHL ${response.status}`);
  return response.json();
}
function shiftDate(isoDate, days) {
  const date = /* @__PURE__ */ new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function unique(games) {
  const seen = /* @__PURE__ */ new Set();
  return games.filter((game) => {
    if (!game.id || seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}
function teamId(abbrev) {
  if (!abbrev) return null;
  const alias = { LA: "LAK", NJ: "NJD", SJ: "SJS", TB: "TBL" };
  const id = alias[abbrev] ?? abbrev;
  return TEAM_IDS.has(id) ? id : null;
}
function mapGame(game) {
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
    periodLabel: status === "live" ? periodLabel(game.periodDescriptor) : void 0,
    clock: status === "live" ? game.clock?.timeRemaining : void 0,
    homeScore: game.homeTeam?.score ?? 0,
    awayScore: game.awayTeam?.score ?? 0,
    venue: game.venue?.default ?? "",
    finishedIn: status === "final" ? finishType(outcome) : void 0
  };
}
function matchStatus(state) {
  if (state === "LIVE" || state === "CRIT") return "live";
  if (state === "OFF" || state === "FINAL" || state === "OVER") return "final";
  return "scheduled";
}
function periodLabel(period) {
  if (period?.periodType === "OT") return "Prol.";
  if (period?.periodType === "SO") return "Tirs";
  if (period?.number === 1) return "1re";
  if (period?.number) return `${period.number}e`;
  return "En cours";
}
function finishType(period) {
  if (period === "OT") return "ot";
  if (period === "SO") return "so";
  return "regulation";
}
function mapStanding(row) {
  const teamIdValue = teamId(row.teamAbbrev?.default);
  if (!teamIdValue) return null;
  const code = row.streakCode === "W" ? "V" : row.streakCode === "L" ? "D" : "N";
  return {
    teamId: teamIdValue,
    played: row.gamesPlayed ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    otLosses: row.otLosses ?? 0,
    points: row.points ?? 0,
    goalDiff: row.goalDifferential ?? 0,
    streak: `${code}${row.streakCount ?? 0}`
  };
}
export {
  loadOfficialBoard
};
