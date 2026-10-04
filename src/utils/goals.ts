import type { GoalEvent, Match } from '@/services/nhl/nhl.types';

export function scorerList(match: Match, teamId: string) {
  const counts = new Map<string, number>();
  for (const goal of match.goals ?? []) {
    if (goal.teamId === teamId) counts.set(goal.scorer, (counts.get(goal.scorer) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([name, goals]) => (goals > 1 ? `${name} (${goals})` : name));
}

export function goalDetail(goal: GoalEvent) {
  const tags = [goal.strength === 'pp' ? 'AN' : goal.strength === 'sh' ? 'DN' : '', goal.emptyNet ? 'filet désert' : '']
    .filter(Boolean)
    .join(', ');
  return tags ? ` · ${tags}` : '';
}
