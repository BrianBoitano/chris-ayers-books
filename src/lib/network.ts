import { sortWorks } from './works';

export interface NetNode { slug: string; x: number; y: number; data: any }
export interface Wire { from: string; to: string; points: [number, number][] }
export interface NetworkModel { nodes: NetNode[]; wires: Wire[]; viewBox: { w: number; h: number } }

const MARGIN_X = 12;
const BANDS = [32, 64, 48]; // zig-zag y bands (percent)

export function layoutNetwork(
  works: { slug: string; data: { order: number; position?: { x: number; y: number } } }[]
): NetworkModel {
  const sorted = sortWorks(works);
  const n = sorted.length;
  const usable = 100 - MARGIN_X * 2;
  const step = n > 1 ? usable / (n - 1) : 0;

  const nodes: NetNode[] = sorted.map((w, i) => {
    const pos = w.data.position;
    if (pos) return { slug: w.slug, x: pos.x, y: pos.y, data: w.data };
    const x = n > 1 ? MARGIN_X + i * step : 50;
    const y = BANDS[i % BANDS.length];
    return { slug: w.slug, x, y, data: w.data };
  });

  const wires: Wire[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const midX = (a.x + b.x) / 2;
    // orthogonal route: horizontal to midX, vertical to b.y, horizontal to b.x
    wires.push({
      from: a.slug,
      to: b.slug,
      points: [[a.x, a.y], [midX, a.y], [midX, b.y], [b.x, b.y]],
    });
  }

  return { nodes, wires, viewBox: { w: 100, h: 100 } };
}
