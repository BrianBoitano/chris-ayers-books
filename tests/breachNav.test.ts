import { describe, it, expect } from 'vitest';
import { neighbors, move } from '../src/lib/breachNav';

// a(10,50) - b(50,30) - c(90,50) ; chain edges
const nodes = [
  { slug: 'a', x: 10, y: 50 },
  { slug: 'b', x: 50, y: 30 },
  { slug: 'c', x: 90, y: 50 },
];
const edges: [string, string][] = [['a', 'b'], ['b', 'c']];

describe('neighbors', () => {
  it('lists connected nodes in either direction', () => {
    expect(neighbors('b', edges).sort()).toEqual(['a', 'c']);
    expect(neighbors('a', edges)).toEqual(['b']);
  });
});

describe('move', () => {
  it('moves right from a to b', () => {
    expect(move(nodes, edges, 'a', 'right')).toBe('b');
  });
  it('moves right from b to c and left from b to a', () => {
    expect(move(nodes, edges, 'b', 'right')).toBe('c');
    expect(move(nodes, edges, 'b', 'left')).toBe('a');
  });
  it('returns null when no neighbor lies in that direction', () => {
    expect(move(nodes, edges, 'a', 'left')).toBeNull();
  });
  it('uses vertical intent: up from c reaches b (b is up-left of c)', () => {
    // b is up and to the left of c; "up" should still pick b since it is the
    // only connected neighbor with a positive upward component
    expect(move(nodes, edges, 'c', 'up')).toBe('b');
  });
});
