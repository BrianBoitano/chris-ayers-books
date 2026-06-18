import { describe, it, expect } from 'vitest';
import { defaultProgress, normalize, visitWorld, findEgg, isComplete } from '../src/lib/progress';

describe('defaultProgress', () => {
  it('starts empty', () => {
    const p = defaultProgress();
    expect(p).toEqual({ xp: 0, visited: [], eggs: [], achievements: [] });
  });
});

describe('normalize', () => {
  it('fills missing fields from defaults', () => {
    expect(normalize({ xp: 5 })).toEqual({ xp: 5, visited: [], eggs: [], achievements: [] });
  });
  it('handles junk', () => {
    expect(normalize(null)).toEqual(defaultProgress());
    expect(normalize('nope')).toEqual(defaultProgress());
  });
});

describe('visitWorld', () => {
  it('adds a new world and awards xp', () => {
    const p = visitWorld(defaultProgress(), 'the-broadcast');
    expect(p.visited).toEqual(['the-broadcast']);
    expect(p.xp).toBe(10);
  });
  it('is idempotent for repeat visits', () => {
    const once = visitWorld(defaultProgress(), 'x');
    const twice = visitWorld(once, 'x');
    expect(twice.visited).toEqual(['x']);
    expect(twice.xp).toBe(10);
  });
  it('does not mutate input', () => {
    const base = defaultProgress();
    visitWorld(base, 'x');
    expect(base.visited).toEqual([]);
  });
});

describe('findEgg', () => {
  it('adds a new egg and awards xp', () => {
    const p = findEgg(defaultProgress(), 'greg');
    expect(p.eggs).toEqual(['greg']);
    expect(p.xp).toBe(25);
  });
  it('is idempotent', () => {
    const once = findEgg(defaultProgress(), 'greg');
    expect(findEgg(once, 'greg').xp).toBe(25);
  });
});

describe('isComplete', () => {
  it('false below total, true at or over total', () => {
    expect(isComplete({ xp: 0, visited: [], eggs: ['a', 'b'], achievements: [] }, 5)).toBe(false);
    expect(isComplete({ xp: 0, visited: [], eggs: ['a','b','c','d','e'], achievements: [] }, 5)).toBe(true);
    expect(isComplete({ xp: 0, visited: [], eggs: ['a','b','c','d','e','f'], achievements: [] }, 5)).toBe(true);
  });
});
