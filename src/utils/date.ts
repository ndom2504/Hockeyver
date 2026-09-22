function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayDiff(iso: string, now = new Date()) {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / 86_400_000);
}

export function isToday(iso: string) {
  return dayDiff(iso) === 0;
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-CA', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function formatDay(iso: string) {
  const diff = dayDiff(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short' }).format(new Date(iso));
}

export function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return formatDay(iso);
}

export function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
