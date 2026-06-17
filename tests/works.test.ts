import { describe, it, expect } from 'vitest';
import { sortWorks, worldHref, isExternal } from '../src/lib/works';

const mk = (slug: string, order: number, extra = {}) =>
  ({ slug, data: { order, status: 'live', ...extra } } as any);

describe('sortWorks', () => {
  it('orders ascending by order', () => {
    const out = sortWorks([mk('b', 2), mk('a', 1)]);
    expect(out.map((w) => w.slug)).toEqual(['a', 'b']);
  });
});

describe('worldHref', () => {
  it('returns externalUrl when present', () => {
    expect(worldHref(mk('x', 1, { externalUrl: 'https://e.com' }))).toBe('https://e.com');
  });
  it('returns internal path for hosted live works', () => {
    expect(worldHref(mk('new-series', 1))).toBe('/works/new-series');
  });
  it('returns internal path for coming-soon works', () => {
    expect(worldHref(mk('soon', 1, { status: 'coming-soon' }))).toBe('/works/soon');
  });
  it('returns null for locked works', () => {
    expect(worldHref(mk('locked', 1, { status: 'locked' }))).toBeNull();
  });
});

describe('isExternal', () => {
  it('true only when externalUrl set', () => {
    expect(isExternal(mk('x', 1, { externalUrl: 'https://e.com' }))).toBe(true);
    expect(isExternal(mk('y', 1))).toBe(false);
  });
});
