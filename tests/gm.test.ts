import { describe, it, expect } from 'vitest';
import { pickLine, randomLine } from '../src/lib/gm';
import { GM_LINES } from '../src/data/gmLines';

describe('pickLine', () => {
  it('is deterministic for the same index', () => {
    const a = pickLine('greeting', 0);
    const b = pickLine('greeting', 0);
    expect(a).toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
  });
  it('wraps with modulo of the pool length', () => {
    const len = GM_LINES.greeting.length;
    expect(pickLine('greeting', 0)).toBe(pickLine('greeting', len));
    expect(pickLine('greeting', 1)).toBe(pickLine('greeting', len + 1));
  });
  it('never throws for any context', () => {
    for (const c of ['greeting','tileHover','lockedTile','idle','eggFound','signup','notFound'] as const) {
      expect(typeof pickLine(c, 0)).toBe('string');
    }
  });
});

describe('randomLine', () => {
  it('uses the injected rng', () => {
    const line = randomLine('greeting', () => 0);
    expect(line).toBe(pickLine('greeting', 0));
  });
});
