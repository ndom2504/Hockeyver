export function fold(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-CA').format(value);
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function displayName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function extractHashtags(body: string) {
  const found = body.match(/#([\p{L}0-9_]+)/gu) ?? [];
  const tags = new Map<string, string>();
  for (const token of found) {
    const clean = token.slice(1);
    const key = fold(clean);
    if (!tags.has(key)) tags.set(key, clean);
  }
  return [...tags.values()];
}

export function mergeTags(body: string, extra: string[] = []) {
  const tags = extractHashtags(body);
  const keys = new Set(tags.map((tag) => fold(tag)));
  for (const tag of extra) {
    const key = fold(tag);
    if (!keys.has(key)) {
      tags.push(tag);
      keys.add(key);
    }
  }
  return tags;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
