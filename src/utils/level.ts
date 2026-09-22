import { LEVELS } from '@/constants/levels';

export function getLevel(points: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.min) current = level;
  }
  const index = LEVELS.findIndex((level) => level.id === current.id);
  const next = LEVELS[index + 1];
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(1, Math.max(0, (points - current.min) / span)) : 1;
  return {
    current,
    next,
    progress,
    pointsToNext: next ? Math.max(0, next.min - points) : 0,
  };
}
