export interface Progress {
  xp: number;
  visited: string[];
  eggs: string[];
  achievements: string[];
}

export const SAVE_KEY = 'hub.progress.v1';

export function defaultProgress(): Progress {
  return { xp: 0, visited: [], eggs: [], achievements: [] };
}

export function normalize(raw: unknown): Progress {
  const d = defaultProgress();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Progress>;
  return {
    xp: typeof r.xp === 'number' && Number.isFinite(r.xp) ? r.xp : 0,
    visited: Array.isArray(r.visited) ? r.visited.slice() : [],
    eggs: Array.isArray(r.eggs) ? r.eggs.slice() : [],
    achievements: Array.isArray(r.achievements) ? r.achievements.slice() : [],
  };
}

export function visitWorld(p: Progress, slug: string): Progress {
  if (p.visited.includes(slug)) return p;
  return { ...p, visited: [...p.visited, slug], xp: p.xp + 10 };
}

export function findEgg(p: Progress, id: string): Progress {
  if (p.eggs.includes(id)) return p;
  return { ...p, eggs: [...p.eggs, id], xp: p.xp + 25 };
}

export function isComplete(p: Progress, total: number): boolean {
  return p.eggs.length >= total;
}
