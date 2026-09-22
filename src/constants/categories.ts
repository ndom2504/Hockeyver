import type { PostCategory } from '@/types/social';

export const CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: 'player', label: 'Joueur' },
  { id: 'team', label: 'Équipe' },
  { id: 'match', label: 'Match' },
  { id: 'nhl', label: 'NHL' },
  { id: 'society', label: 'Hockey & Société' },
];

export const FEED_FILTERS: { id: PostCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  ...CATEGORIES,
];

export function categoryLabel(category: PostCategory) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
