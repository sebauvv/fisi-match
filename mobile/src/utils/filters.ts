import type { Advisor } from '../../types/advisor';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u');
}

export function filterAdvisorsByName(
  advisors: Advisor[],
  query: string,
): Advisor[] {
  const normalized = normalizeText(query.trim());
  if (!normalized) return advisors;
  return advisors.filter((a) =>
    normalizeText(a.full_name).includes(normalized),
  );
}

export function filterAdvisorsByArea(
  advisors: Advisor[],
  area: string,
): Advisor[] {
  const normalized = normalizeText(area.trim());
  if (!normalized) return advisors;
  return advisors.filter((a) =>
    a.research_areas.some((r) => normalizeText(r).includes(normalized)),
  );
}

export function groupByFirstLetter(items: { name: string }[]): Map<string, { name: string }[]> {
  const groups = new Map<string, { name: string }[]>();
  for (const item of items) {
    const letter = item.name.charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(item);
  }
  const sorted = new Map(
    [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es')),
  );
  return sorted;
}
