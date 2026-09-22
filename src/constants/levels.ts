export const POINTS = {
  post: 5,
  comment: 2,
  reactionReceived: 1,
  poll: 1,
} as const;

export const LEVELS = [
  { id: 'rookie', label: 'Rookie', min: 0 },
  { id: 'fan', label: 'Fan', min: 40 },
  { id: 'passionate', label: 'Passionné', min: 120 },
  { id: 'expert', label: 'Expert', min: 280 },
  { id: 'legend', label: 'Légende', min: 600 },
] as const;

export type LevelId = (typeof LEVELS)[number]['id'];
