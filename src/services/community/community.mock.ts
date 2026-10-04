import { CURRENT_USER_ID } from '@/constants/session';
import type { AppNotification, Comment, FanUser, Like, Poll, Post } from '@/types/social';
import { minutesAgo } from '@/utils/date';

const portrait = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&backgroundColor=e7f0fa`;

const arena =
  'https://images.unsplash.com/photo-1473976345543-9ffc928e648d?auto=format&fit=crop&w=1400&q=80';

export const seedUser: FanUser = {
  id: CURRENT_USER_ID,
  firstName: 'Léa',
  lastName: 'Moreau',
  username: 'lea.moreau',
  avatarUrl: portrait('LeaMoreau'),
  favoriteTeamId: 'MTL',
  bio: 'Au Centre Bell dès que je peux. Le hockey est une langue, pas seulement un score.',
  points: 186,
};

function fan(id: string, firstName: string, lastName: string, favoriteTeamId: string, bio: string, points: number): FanUser {
  const username = `${firstName}${lastName[0]}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return {
    id,
    firstName,
    lastName,
    username,
    avatarUrl: portrait(`${firstName}${lastName}`),
    favoriteTeamId,
    bio,
    points,
  };
}

export const seedFans: FanUser[] = [
  fan('u1', 'Camille', 'Bergeron', 'MTL', 'Le CH, même les soirs de semaine.', 460),
  fan('u2', 'Alexis', 'Gagnon', 'TOR', 'Scotiabank Arena, section 315.', 310),
  fan('u3', 'Noah', 'Pelletier', 'EDM', 'Je regarde McDavid comme on étudie un match.', 388),
  fan('u4', 'Sofia', 'Marin', 'COL', 'Avalanche depuis le déménagement.', 274),
  fan('u5', 'Ethan', 'Roy', 'BOS', 'Le marché des transactions, c’est mon sport d’hiver.', 512),
  fan('u6', 'Maya', 'Chen', 'WPG', 'Le hockey appartient à tout le monde, ou il n’appartient à personne.', 241),
  fan('u7', 'Louis', 'Hébert', 'CHI', 'Chicago, la patience et Bedard.', 198),
  fan('u8', 'Inès', 'Bouchard', 'VGK', 'Vegas le soir, la LPHF le lendemain.', 356),
  fan('u9', 'Gabriel', 'Tremblay', 'OTT', 'Abonné au Centre Canadian Tire depuis 2011.', 289),
  fan('u10', 'Rosalie', 'Lavoie', 'PIT', 'Crosby m’a appris à aimer le jeu sans la rondelle.', 233),
  fan('u11', 'Olivier', 'Côté', 'NYR', 'Rangers par héritage familial.', 207),
  fan('u12', 'Zoé', 'Girard', 'TBL', 'Le Lightning, le soleil et les séries.', 264),
  fan('u13', 'William', 'Morin', 'VAN', 'Canucks, café et matchs de fin de soirée.', 221),
  fan('u14', 'Juliette', 'Fortin', 'FLA', 'Les Panthers, une culture de gagnants.', 302),
  fan('u15', 'Félix', 'Gauthier', 'DET', 'Hockeytown, toujours.', 248),
  fan('u16', 'Émilie', 'Ouellet', 'UTA', 'Le Mammoth, un projet à suivre de près.', 176),
];

export const seedPosts: Post[] = [
  {
    id: 'p6',
    authorId: 'u2',
    category: 'society',
    hashtags: ['HockeyJeunesse'],
    createdAt: minutesAgo(60 * 30),
    body: 'Au Québec, inscrire un enfant au hockey compétitif coûte maintenant le prix d’un loyer. On ne peut pas parler de relève si seules certaines familles peuvent jouer.',
  },
  {
    id: 'p7',
    authorId: 'u8',
    category: 'society',
    hashtags: ['HockeyFeminin'],
    imageUrl: arena,
    createdAt: minutesAgo(60 * 40),
    body: 'Le hockey féminin n’a pas besoin d’être « la prochaine chose à surveiller ». Il a besoin d’un calendrier, de diffusion et de respect. La LPHF fait déjà le travail.',
  },
  {
    id: 'p10',
    authorId: 'u6',
    category: 'society',
    hashtags: ['Inclusion'],
    createdAt: minutesAgo(60 * 52),
    body: 'Les vestiaires ont changé, pas assez vite. L’inclusion n’est pas un thème de semaine. C’est qui a le droit de se sentir chez soi dans ce sport.',
  },
];

export const seedComments: Comment[] = [
  {
    id: 'c6',
    postId: 'p6',
    authorId: 'u1',
    createdAt: minutesAgo(60 * 29),
    body: 'Même constat à Montréal. Le hockey de quartier disparaît tranquillement.',
  },
  {
    id: 'c7',
    postId: 'p6',
    authorId: 'u2',
    parentId: 'c6',
    createdAt: minutesAgo(60 * 28),
    body: 'Et les écoles ne compensent plus. Le coût est devenu le vrai filtre.',
  },
  {
    id: 'c10',
    postId: 'p7',
    authorId: 'u4',
    createdAt: minutesAgo(60 * 38),
    body: 'La diffusion reste le vrai test cette saison. Sans ça, le respect reste un slogan.',
  },
];

export const seedLikes: Like[] = [
  ['p6', ['u1', 'u6', 'u8', 'u9']],
  ['p7', ['u1', 'u2', 'u4', 'u6', 'u12']],
  ['p10', ['u1', 'u8', 'u13']],
].flatMap(([targetId, userIds]) =>
  (userIds as string[]).map((userId) => ({
    targetType: 'post' as const,
    targetId: targetId as string,
    userId,
  })),
);

export const seedPolls: Poll[] = [
  {
    id: 'qotd-saison',
    kind: 'qotd',
    question: 'Quelle équipe canadienne ira le plus loin cette saison ?',
    options: [
      { id: 'qotd-saison-mtl', label: 'Canadiens', votes: 212 },
      { id: 'qotd-saison-tor', label: 'Maple Leafs', votes: 174 },
      { id: 'qotd-saison-edm', label: 'Oilers', votes: 198 },
      { id: 'qotd-saison-ott', label: 'Sénateurs', votes: 96 },
      { id: 'qotd-saison-wpg', label: 'Jets', votes: 88 },
    ],
  },
];

export const seedNotifications: AppNotification[] = [
  { id: 'n4', type: 'favorite_team', createdAt: minutesAgo(60 * 3), read: false },
  { id: 'n7', type: 'poll', createdAt: minutesAgo(60 * 5), read: false },
];
