import type { Match, Team } from '@/services/nhl/nhl.types';
import type { AppNotification, FanUser } from '@/types/social';
import { displayName } from '@/utils/text';

export function notificationPresentation(
  notification: AppNotification,
  users: FanUser[],
  teams: Team[],
  matches: Match[],
  favoriteTeamId: string,
) {
  const actor = users.find((user) => user.id === notification.actorId);
  const actorName = actor ? displayName(actor) : 'Un partisan';
  const favorite = teams.find((team) => team.id === favoriteTeamId);
  const match = matches.find((item) => item.id === notification.matchId);
  const home = teams.find((team) => team.id === match?.homeTeamId);
  const away = teams.find((team) => team.id === match?.awayTeamId);

  const presented = present(notification, actorName, favorite, match, home, away);
  return {
    ...presented,
    title: notification.title || presented.title,
    body: notification.body || presented.body,
  };
}

function present(
  notification: AppNotification,
  actorName: string,
  favorite: Team | undefined,
  match: Match | undefined,
  home: Team | undefined,
  away: Team | undefined,
) {
  switch (notification.type) {
    case 'reply':
      return {
        title: 'Nouvelle réponse',
        body: `${actorName} a répondu à votre publication.`,
        href: notification.postId ? `/post/${notification.postId}` : undefined,
      };
    case 'reaction':
      return {
        title: 'Nouvelle réaction',
        body: `${actorName} a aimé votre publication.`,
        href: notification.postId ? `/post/${notification.postId}` : undefined,
      };
    case 'mention':
      return {
        title: 'Mention',
        body: `${actorName} vous a mentionné.`,
        href: notification.postId ? `/post/${notification.postId}` : undefined,
      };
    case 'favorite_team':
      return {
        title: 'Votre équipe',
        body: favorite
          ? `Nouvelle discussion chez les partisans des ${favorite.name}.`
          : 'Nouvelle discussion autour de votre équipe.',
        href: favorite ? `/team/${favorite.id}` : '/community',
      };
    case 'game_start':
      return {
        title: "Coup d'envoi",
        body: home && away ? `${away.abbreviation} chez ${home.abbreviation} commence bientôt.` : 'Un match de votre équipe commence bientôt.',
        href: match ? `/match/${match.id}` : undefined,
      };
    case 'goal':
      return {
        title: 'But',
        body:
          match && home && away
            ? `${away.abbreviation} ${match.awayScore} – ${match.homeScore} ${home.abbreviation}`
            : 'But dans un match en direct.',
        href: match ? `/match/${match.id}` : undefined,
      };
    case 'game_result':
      return {
        title: 'Résultat',
        body:
          match && home && away && match.status !== 'scheduled'
            ? `${home.abbreviation} ${match.homeScore} – ${match.awayScore} ${away.abbreviation}`
            : 'Le résultat du match est disponible.',
        href: match ? `/match/${match.id}` : undefined,
      };
    case 'poll':
      return {
        title: 'Sondage',
        body: 'La question du jour est ouverte. Votre vote compte.',
        href: '/',
      };
  }
}
