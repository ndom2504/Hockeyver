import type { Match, NewsItem, NhlSnapshot, Standing, Team } from '@/services/nhl/nhl.types';
import type { Comment, FanUser, Like, Poll, Post } from '@/types/social';
import { formatTime } from '@/utils/date';
import { scorerList as scorers } from '@/utils/goals';

export type LiveCommunity = { posts: Post[]; comments: Comment[]; likes: Like[]; polls: Poll[] };

const LIVE_PREFIX = 'live-';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function isLiveId(id: string) {
  return id.startsWith(LIVE_PREFIX);
}

function involves(match: Match, teamId?: string) {
  return Boolean(teamId) && (match.homeTeamId === teamId || match.awayTeamId === teamId);
}

type Context = {
  now: number;
  fans: FanUser[];
  teams: Map<string, Team>;
  records: Map<string, Standing>;
  news: NewsItem[];
};

/**
 * Publications et sondages tirés du fil officiel : résultats, matchs en direct,
 * matchs du soir, classement et nouvelles de LNH.com. Les identifiants sont stables,
 * donc une même nouvelle ou un même match produit toujours la même publication.
 */
export function buildLiveCommunity(snapshot: NhlSnapshot, fans: FanUser[], favoriteTeamId?: string, now = Date.now()): LiveCommunity {
  if (snapshot.source !== 'live') return { posts: [], comments: [], likes: [], polls: [] };
  const ctx: Context = {
    now,
    fans,
    teams: new Map(snapshot.teams.map((team) => [team.id, team])),
    records: new Map(snapshot.standings.map((row) => [row.teamId, row])),
    news: snapshot.news,
  };
  const posts: Post[] = [];
  const comments: Comment[] = [];

  const finals = snapshot.matches
    .filter((match) => match.status === 'final' && !match.preseason)
    .filter((match) => now - new Date(match.startTime).getTime() < 40 * HOUR)
    .sort((a, b) => Number(involves(b, favoriteTeamId)) - Number(involves(a, favoriteTeamId)) || +new Date(b.startTime) - +new Date(a.startTime))
    .slice(0, 16);
  for (const match of finals) {
    const recap = recapPost(match, ctx);
    if (!recap) continue;
    posts.push(recap.post);
    if (recap.comment) comments.push(recap.comment);
  }

  for (const match of snapshot.matches.filter((item) => item.status === 'live')) {
    const post = livePost(match, ctx);
    if (post) posts.push(post);
  }

  const tonight = snapshot.matches
    .filter((match) => match.status === 'scheduled' && sameDay(match.startTime, now))
    .sort((a, b) => Number(involves(b, favoriteTeamId)) - Number(involves(a, favoriteTeamId)) || +new Date(a.startTime) - +new Date(b.startTime))
    .slice(0, 8);
  for (const match of tonight) {
    const preview = previewPost(match, ctx);
    if (!preview) continue;
    posts.push(preview.post);
    if (preview.comment) comments.push(preview.comment);
  }

  for (const item of snapshot.news.filter((entry) => !entry.recap).slice(0, 6)) {
    const post = newsPost(item, ctx);
    if (post) posts.push(post);
  }

  const standings = standingsPost(snapshot.standings, ctx);
  if (standings) posts.push(standings);

  return {
    posts,
    comments,
    likes: posts.flatMap((post) => fanLikes(post, fans)),
    polls: buildPolls(snapshot, ctx, favoriteTeamId),
  };
}

function recapPost(match: Match, ctx: Context) {
  const home = ctx.teams.get(match.homeTeamId);
  const away = ctx.teams.get(match.awayTeamId);
  if (!home || !away) return null;
  const homeWon = match.homeScore > match.awayScore;
  const winner = homeWon ? home : away;
  const loser = homeWon ? away : home;
  const ws = Math.max(match.homeScore, match.awayScore);
  const ls = Math.min(match.homeScore, match.awayScore);
  const seed = match.id;
  const author = fanOf(winner.id, ctx, seed) ?? fanOf(loser.id, ctx, seed) ?? anyFan(ctx, seed);
  if (!author) return null;
  const suffix = match.finishedIn === 'ot' ? ' en prolongation' : match.finishedIn === 'so' ? ' en tirs de barrage' : '';
  const extraTime = match.finishedIn === 'ot' || match.finishedIn === 'so';

  let opening: string;
  if (author.favoriteTeamId === winner.id) {
    opening = pick(
      [
        `Deux points de plus pour ${the(winner)}. Victoire de ${ws}-${ls}${suffix} contre ${the(loser)}.`,
        `${cap(the(winner))} ${verb(winner, 'l’emporte', 'l’emportent')} ${ws}-${ls}${suffix} face ${to(loser)}. Belle soirée.`,
        `${winner.name} ${ws}, ${loser.name} ${ls}${suffix}. C’est le genre de match qu’il fallait gagner.`,
      ],
      seed,
    );
  } else if (author.favoriteTeamId === loser.id) {
    opening = extraTime
      ? `Au moins un point au classement. ${cap(the(loser))} ${verb(loser, 's’incline', 's’inclinent')} ${ws}-${ls}${suffix} contre ${the(winner)}.`
      : pick(
          [
            `Soirée difficile : ${the(loser)} ${verb(loser, 's’incline', 's’inclinent')} ${ws}-${ls} contre ${the(winner)}.`,
            `Défaite de ${ws}-${ls} face ${to(winner)}. Il faudra réagir dès le prochain match.`,
          ],
          seed,
        );
  } else {
    opening = `Résultat : ${away.name} ${match.awayScore}, ${home.name} ${match.homeScore}${suffix}.`;
  }

  const lines = [opening];
  const winners = scorers(match, winner.id);
  const losers = scorers(match, loser.id);
  if (winners.length > 0) lines.push(`Buts ${of(winner)} : ${list(winners)}.`);
  if (losers.length > 0) lines.push(`Pour ${the(loser)} : ${list(losers)}.`);

  const story = ctx.news.find(
    (item) =>
      item.recap &&
      [item.recap.homeTeamId, item.recap.awayTeamId].sort().join() === [home.id, away.id].sort().join() &&
      Math.abs(new Date(item.publishedAt).getTime() - new Date(match.startTime).getTime()) < 18 * HOUR,
  );
  let body = lines.join(' ');
  if (story?.lead) body += `\n\n« ${story.lead} » (LNH.com)`;

  const createdAt = capTime(new Date(match.startTime).getTime() + 165 * MINUTE, ctx.now);
  const post: Post = {
    id: `${LIVE_PREFIX}recap-${match.id}`,
    authorId: author.id,
    body,
    imageUrl: story?.imageUrl,
    category: 'match',
    teamId: author.favoriteTeamId === loser.id ? loser.id : winner.id,
    matchId: match.id,
    hashtags: [winner.tag, loser.tag],
    createdAt,
  };

  const commenter =
    fanOf(author.favoriteTeamId === winner.id ? loser.id : winner.id, ctx, `${seed}-c`) ?? anyFan(ctx, `${seed}-c`, author.id);
  const star = topScorer(match, winner.id);
  let comment: Comment | undefined;
  if (commenter) {
    const text =
      commenter.favoriteTeamId === winner.id
        ? pick([star ? `${star} était partout ce soir.` : 'On prend ça. Belle réaction de l’équipe.', 'Une victoire qui fait du bien.'], seed)
        : commenter.favoriteTeamId === loser.id
          ? pick(['Dur à avaler. On se reprend au prochain match.', 'La saison est longue, on regarde en avant.'], seed)
          : pick(
              [
                star ? `${star} a fait la différence.` : 'Un match à revoir.',
                `Belle soirée pour ${the(winner)}.`,
                ls === 0
                  ? 'Gros travail du gardien, zéro but accordé.'
                  : ws - ls === 1
                    ? 'Match serré jusqu’à la fin.'
                    : ws + ls >= 7
                      ? `${ws + ls} buts, on en a eu pour notre argent.`
                      : `Victoire convaincante ${of(winner)}.`,
                star ? `Surveillez ${star} cette saison.` : 'On verra la suite.',
              ],
              `${seed}-n`,
            );
    comment = {
      id: `${LIVE_PREFIX}c-recap-${match.id}`,
      postId: post.id,
      authorId: commenter.id,
      body: text,
      createdAt: capTime(new Date(createdAt).getTime() + 25 * MINUTE, ctx.now),
    };
  }
  return { post, comment };
}

function livePost(match: Match, ctx: Context): Post | null {
  const home = ctx.teams.get(match.homeTeamId);
  const away = ctx.teams.get(match.awayTeamId);
  if (!home || !away) return null;
  const author = fanOf(home.id, ctx, match.id) ?? fanOf(away.id, ctx, match.id) ?? anyFan(ctx, match.id);
  if (!author) return null;
  const clock = [match.periodLabel, match.clock].filter(Boolean).join(' · ');
  const lines = [`En direct : ${away.abbreviation} ${match.awayScore}, ${home.abbreviation} ${match.homeScore}${clock ? ` (${clock})` : ''}.`];
  const last = match.goals?.at(-1);
  if (last) {
    const team = ctx.teams.get(last.teamId);
    const detail = last.strength === 'pp' ? ', en avantage numérique' : last.strength === 'sh' ? ', en infériorité numérique' : '';
    lines.push(`Dernier but : ${last.scorer} (${team?.abbreviation ?? last.teamId}${detail}).`);
  }
  const mine = author.favoriteTeamId === home.id ? match.homeScore - match.awayScore : author.favoriteTeamId === away.id ? match.awayScore - match.homeScore : null;
  if (mine !== null) lines.push(mine > 0 ? 'On garde le rythme.' : mine < 0 ? 'Il reste du temps, on y croit.' : 'Tout reste à jouer.');
  return {
    id: `${LIVE_PREFIX}now-${match.id}`,
    authorId: author.id,
    body: lines.join(' '),
    category: 'match',
    teamId: author.favoriteTeamId === away.id ? away.id : home.id,
    matchId: match.id,
    hashtags: [away.tag, home.tag],
    createdAt: new Date(ctx.now - MINUTE).toISOString(),
  };
}

function previewPost(match: Match, ctx: Context) {
  const home = ctx.teams.get(match.homeTeamId);
  const away = ctx.teams.get(match.awayTeamId);
  if (!home || !away) return null;
  const posted = startOfDay(ctx.now) + 8 * HOUR;
  if (posted > ctx.now || posted > new Date(match.startTime).getTime()) return null;
  const author = fanOf(home.id, ctx, match.id) ?? fanOf(away.id, ctx, match.id) ?? anyFan(ctx, match.id);
  if (!author) return null;
  const when = new Date(match.startTime).getHours() >= 16 ? 'Ce soir' : 'Aujourd’hui';
  const lines = [`${when} ${formatTime(match.startTime)} : ${the(away)}${record(away, ctx)} chez ${the(home)}${record(home, ctx)}.`];
  const fav = ctx.teams.get(author.favoriteTeamId);
  if (fav && (fav.id === home.id || fav.id === away.id)) {
    lines.push(pick([`Je veux voir ${the(fav)} imposer le rythme dès la première période.`, 'Deux points importants à aller chercher.'], match.id));
  } else {
    lines.push('Un match à surveiller.');
  }
  lines.push('Votre pronostic ?');
  const post: Post = {
    id: `${LIVE_PREFIX}preview-${match.id}`,
    authorId: author.id,
    body: lines.join(' '),
    category: 'match',
    teamId: fav && (fav.id === home.id || fav.id === away.id) ? fav.id : home.id,
    matchId: match.id,
    hashtags: [away.tag, home.tag],
    createdAt: new Date(posted).toISOString(),
  };
  const rival = fanOf(author.favoriteTeamId === home.id ? away.id : home.id, ctx, `${match.id}-p`);
  const comment: Comment | undefined = rival
    ? {
        id: `${LIVE_PREFIX}c-preview-${match.id}`,
        postId: post.id,
        authorId: rival.id,
        body: pick([`Je prends ${the(ctx.teams.get(rival.favoriteTeamId) ?? home)}, sans hésiter.`, 'Ça va se jouer en troisième période.'], match.id),
        createdAt: capTime(posted + 40 * MINUTE, ctx.now),
      }
    : undefined;
  return { post, comment };
}

function newsPost(item: NewsItem, ctx: Context): Post | null {
  if (ctx.now - new Date(item.publishedAt).getTime() > 72 * HOUR) return null;
  const team = item.teamIds.map((id) => ctx.teams.get(id)).find((entry): entry is Team => Boolean(entry));
  const author = (team ? fanOf(team.id, ctx, item.id) : undefined) ?? anyFan(ctx, item.id);
  if (!author) return null;
  const body = [item.title, item.lead, 'Source : LNH.com'].filter(Boolean).join('\n\n');
  return {
    id: `${LIVE_PREFIX}news-${item.id}`,
    authorId: author.id,
    body,
    imageUrl: item.imageUrl,
    category: team ? 'team' : 'nhl',
    teamId: team?.id,
    hashtags: team ? [team.tag] : ['LNH'],
    createdAt: capTime(new Date(item.publishedAt).getTime(), ctx.now),
  };
}

function standingsPost(standings: Standing[], ctx: Context): Post | null {
  const played = standings.filter((row) => row.played > 0);
  if (played.length < 8) return null;
  const posted = startOfDay(ctx.now) + 9 * HOUR;
  if (posted > ctx.now) return null;
  const key = new Date(posted).toISOString().slice(0, 10);
  const author = anyFan(ctx, `standings-${key}`);
  if (!author) return null;
  const maxPlayed = Math.max(...played.map((row) => row.played));
  const unbeaten = played.filter((row) => row.losses === 0 && row.otLosses === 0);
  let body: string;
  if (maxPlayed <= 6 && unbeaten.length > 0 && unbeaten.length <= 8) {
    const names = unbeaten.map((row) => ctx.teams.get(row.teamId)).filter((team): team is Team => Boolean(team));
    const lone = names.length === 1 && SINGULAR[names[0].id];
    body = `Début de saison : ${list(names.map(the))} ${lone ? 'n’a' : 'n’ont'} pas encore perdu. Qui tiendra le plus longtemps ?`;
  } else {
    const leader = (conference: Team['conference']) =>
      played
        .filter((row) => ctx.teams.get(row.teamId)?.conference === conference)
        .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)[0];
    const east = leader('Eastern');
    const west = leader('Western');
    const eastTeam = east ? ctx.teams.get(east.teamId) : undefined;
    const westTeam = west ? ctx.teams.get(west.teamId) : undefined;
    if (!east || !west || !eastTeam || !westTeam) return null;
    body = `${cap(the(eastTeam))} ${verb(eastTeam, 'mène', 'mènent')} l’Est avec ${east.points} points. Dans l’Ouest, ${the(westTeam)} ${verb(westTeam, 'occupe', 'occupent')} le premier rang avec ${west.points} points.`;
  }
  return {
    id: `${LIVE_PREFIX}standings-${key}`,
    authorId: author.id,
    body,
    category: 'nhl',
    hashtags: ['Classement'],
    createdAt: new Date(posted).toISOString(),
  };
}

function buildPolls(snapshot: NhlSnapshot, ctx: Context, favoriteTeamId?: string): Poll[] {
  const polls: Poll[] = [];
  const upcoming = snapshot.matches
    .filter((match) => match.status === 'live' || (match.status === 'scheduled' && new Date(match.startTime).getTime() - ctx.now < 72 * HOUR))
    .sort((a, b) => {
      const aFav = a.homeTeamId === favoriteTeamId || a.awayTeamId === favoriteTeamId;
      const bFav = b.homeTeamId === favoriteTeamId || b.awayTeamId === favoriteTeamId;
      if (aFav !== bFav) return aFav ? -1 : 1;
      if (a.status !== b.status) return a.status === 'live' ? -1 : 1;
      return +new Date(a.startTime) - +new Date(b.startTime);
    });
  const featured = upcoming[0];
  const home = featured ? ctx.teams.get(featured.homeTeamId) : undefined;
  const away = featured ? ctx.teams.get(featured.awayTeamId) : undefined;
  if (featured && home && away) {
    const id = `poll-${featured.id}`;
    const when =
      featured.status === 'live'
        ? 'Le match est en cours :'
        : sameDay(featured.startTime, ctx.now)
          ? new Date(featured.startTime).getHours() >= 16
            ? 'Ce soir,'
            : 'Aujourd’hui,'
          : sameDay(featured.startTime, ctx.now + 24 * HOUR)
            ? 'Demain,'
            : `${cap(new Intl.DateTimeFormat('fr-CA', { weekday: 'long' }).format(new Date(featured.startTime)))},`;
    polls.push({
      id,
      kind: 'match',
      matchId: featured.id,
      question: `${when} qui l’emporte entre ${the(away)} et ${the(home)} ?`,
      note: featured.status === 'scheduled' ? `${formatTime(featured.startTime)} · ${featured.venue}` : undefined,
      options: [
        { id: `${id}-${away.id}`, label: away.name, votes: votes(`${id}-${away.id}`) },
        { id: `${id}-${home.id}`, label: home.name, votes: votes(`${id}-${home.id}`) + 20 },
      ],
    });
  }

  const key = new Date(startOfDay(ctx.now)).toISOString().slice(0, 10);
  const recent = snapshot.matches.filter(
    (match) => match.status === 'final' && !match.preseason && ctx.now - new Date(match.startTime).getTime() < 36 * HOUR,
  );
  const tally = new Map<string, { label: string; goals: number }>();
  for (const match of recent) {
    for (const goal of match.goals ?? []) {
      const team = ctx.teams.get(goal.teamId);
      const label = `${goal.scorer} (${team?.abbreviation ?? goal.teamId})`;
      const entry = tally.get(label) ?? { label, goals: 0 };
      entry.goals += 1;
      tally.set(label, entry);
    }
  }
  const stars = [...tally.values()].sort((a, b) => b.goals - a.goals || a.label.localeCompare(b.label)).slice(0, 4);
  const tonight = snapshot.matches.filter((match) => match.status === 'scheduled' && sameDay(match.startTime, ctx.now));

  if (stars.length >= 3 && stars[0].goals >= 2) {
    const id = `qotd-${key}-vedette`;
    polls.push({
      id,
      kind: 'qotd',
      question: 'Qui a été la vedette de la dernière soirée ?',
      note: 'Selon les buts marqués lors des derniers matchs.',
      options: stars.map((star, index) => ({
        id: `${id}-${index}`,
        label: `${star.label} · ${star.goals} but${star.goals > 1 ? 's' : ''}`,
        votes: votes(`${id}-${index}`) + star.goals * 40,
      })),
    });
  } else if (tonight.length >= 2) {
    const id = `qotd-${key}-soiree`;
    polls.push({
      id,
      kind: 'qotd',
      question: 'Quel match vous intéresse le plus aujourd’hui ?',
      options: tonight.slice(0, 4).map((match) => {
        const a = ctx.teams.get(match.awayTeamId);
        const h = ctx.teams.get(match.homeTeamId);
        return { id: `${id}-${match.id}`, label: `${a?.name ?? match.awayTeamId} chez ${h?.name ?? match.homeTeamId}`, votes: votes(`${id}-${match.id}`) };
      }),
    });
  } else {
    const top = snapshot.standings
      .filter((row) => row.played > 0)
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
      .slice(0, 4);
    if (top.length === 4) {
      const id = `qotd-${key}-sommet`;
      polls.push({
        id,
        kind: 'qotd',
        question: 'Quelle équipe finira au sommet de la LNH ?',
        options: top.map((row) => ({
          id: `${id}-${row.teamId}`,
          label: ctx.teams.get(row.teamId)?.name ?? row.teamId,
          votes: votes(`${id}-${row.teamId}`),
        })),
      });
    }
  }
  return polls;
}

function fanLikes(post: Post, fans: FanUser[]): Like[] {
  const count = 2 + (hash(post.id) % 8);
  const start = hash(`${post.id}-likes`) % fans.length;
  const likes: Like[] = [];
  for (let index = 0; index < fans.length && likes.length < count; index += 1) {
    const fan = fans[(start + index) % fans.length];
    if (fan.id === post.authorId) continue;
    likes.push({ targetType: 'post', targetId: post.id, userId: fan.id });
  }
  return likes;
}

function topScorer(match: Match, teamId: string) {
  const counts = new Map<string, number>();
  for (const goal of match.goals ?? []) {
    if (goal.teamId === teamId) counts.set(goal.scorer, (counts.get(goal.scorer) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function record(team: Team, ctx: Context) {
  const row = ctx.records.get(team.id);
  if (!row || row.played === 0) return '';
  return ` (${row.wins}-${row.losses}-${row.otLosses})`;
}

function fanOf(teamId: string, ctx: Context, seed: string) {
  const options = ctx.fans.filter((fan) => fan.favoriteTeamId === teamId);
  return options.length > 0 ? pick(options, seed) : undefined;
}

function anyFan(ctx: Context, seed: string, excludeId?: string) {
  const options = ctx.fans.filter((fan) => fan.id !== excludeId);
  return options.length > 0 ? pick(options, seed) : undefined;
}

const SINGULAR: Record<string, 'l’' | 'le '> = { COL: 'l’', MIN: 'le ', SEA: 'le ', TBL: 'le ', UTA: 'le ' };

function the(team: Team) {
  const article = SINGULAR[team.id];
  return article ? `${article}${team.name}` : `les ${team.name}`;
}

function of(team: Team) {
  const article = SINGULAR[team.id];
  if (article === 'l’') return `de l’${team.name}`;
  if (article) return `du ${team.name}`;
  return `des ${team.name}`;
}

function to(team: Team) {
  const article = SINGULAR[team.id];
  if (article === 'l’') return `à l’${team.name}`;
  if (article) return `au ${team.name}`;
  return `aux ${team.name}`;
}

function verb(team: Team, singular: string, plural: string) {
  return SINGULAR[team.id] ? singular : plural;
}

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function list(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

function votes(seed: string) {
  return 60 + (hash(seed) % 240);
}

function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T>(items: T[], seed: string): T {
  return items[hash(seed) % items.length];
}

function startOfDay(time: number) {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function sameDay(iso: string, time: number) {
  return startOfDay(new Date(iso).getTime()) === startOfDay(time);
}

function capTime(time: number, now: number) {
  return new Date(Math.min(time, now - MINUTE)).toISOString();
}
