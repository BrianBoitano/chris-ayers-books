import { GM_LINES } from '../data/gmLines';

export type GmContext =
  | 'greeting' | 'tileHover' | 'lockedTile' | 'idle' | 'eggFound' | 'signup' | 'notFound';

export function pickLine(context: GmContext, index: number): string {
  const pool = GM_LINES[context] ?? [];
  if (pool.length === 0) return '';
  const i = ((index % pool.length) + pool.length) % pool.length;
  return pool[i];
}

export function randomLine(context: GmContext, rnd: () => number = Math.random): string {
  const pool = GM_LINES[context] ?? [];
  if (pool.length === 0) return '';
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}
