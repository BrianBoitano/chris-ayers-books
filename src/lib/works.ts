export function sortWorks<T extends { data: { order: number } }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.data.order - b.data.order);
}

export function isExternal(w: { data: { externalUrl?: string } }): boolean {
  return typeof w.data.externalUrl === 'string' && w.data.externalUrl.length > 0;
}

export function worldHref(
  w: { slug: string; data: { externalUrl?: string; status: string } }
): string | null {
  if (isExternal(w)) return w.data.externalUrl as string;
  if (w.data.status === 'locked') return null;
  return `/works/${w.slug}`;
}
