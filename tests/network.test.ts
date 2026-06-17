import { describe, it, expect } from 'vitest';
import { layoutNetwork } from '../src/lib/network';

const w = (slug: string, order: number, position?: { x: number; y: number }) =>
  ({ slug, data: { order, position } } as any);

describe('layoutNetwork', () => {
  it('returns a node per work, sorted by order', () => {
    const m = layoutNetwork([w('b', 2), w('a', 1), w('c', 3)]);
    expect(m.nodes.map((n) => n.slug)).toEqual(['a', 'b', 'c']);
  });
  it('keeps all coordinates within the viewBox', () => {
    const m = layoutNetwork([w('a', 1), w('b', 2), w('c', 3), w('d', 4)]);
    for (const n of m.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(100);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(100);
    }
    expect(m.viewBox).toEqual({ w: 100, h: 100 });
  });
  it('honors a position override verbatim', () => {
    const m = layoutNetwork([w('a', 1, { x: 12, y: 88 }), w('b', 2)]);
    const a = m.nodes.find((n) => n.slug === 'a')!;
    expect(a.x).toBe(12);
    expect(a.y).toBe(88);
  });
  it('wires connect consecutive nodes with orthogonal right-angle points', () => {
    const m = layoutNetwork([w('a', 1), w('b', 2), w('c', 3)]);
    expect(m.wires.map((e) => [e.from, e.to])).toEqual([['a', 'b'], ['b', 'c']]);
    // orthogonal: first segment shares y with start, last shares y with end
    const e = m.wires[0];
    const start = m.nodes.find((n) => n.slug === 'a')!;
    const end = m.nodes.find((n) => n.slug === 'b')!;
    expect(e.points[0]).toEqual([start.x, start.y]);
    expect(e.points[e.points.length - 1]).toEqual([end.x, end.y]);
  });
  it('centers a single node and makes no wires', () => {
    const m = layoutNetwork([w('only', 1)]);
    expect(m.nodes[0].x).toBe(50);
    expect(m.nodes[0].y).toBe(32);
    expect(m.wires).toEqual([]);
  });
  it('two nodes produce exactly one wire', () => {
    const m = layoutNetwork([w('a', 1), w('b', 2)]);
    expect(m.wires.length).toBe(1);
    expect([m.wires[0].from, m.wires[0].to]).toEqual(['a', 'b']);
  });
  it('handles empty input', () => {
    const m = layoutNetwork([]);
    expect(m.nodes).toEqual([]);
    expect(m.wires).toEqual([]);
  });
});
