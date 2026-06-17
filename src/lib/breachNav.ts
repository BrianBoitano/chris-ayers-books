export type Dir = 'left' | 'right' | 'up' | 'down';
export interface NavNode { slug: string; x: number; y: number }

const VEC: Record<Dir, [number, number]> = {
  left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
};

export function neighbors(slug: string, edges: [string, string][]): string[] {
  const out: string[] = [];
  for (const [a, b] of edges) {
    if (a === slug) out.push(b);
    else if (b === slug) out.push(a);
  }
  return out;
}

export function move(
  nodes: NavNode[],
  edges: [string, string][],
  current: string,
  dir: Dir
): string | null {
  const by = new Map(nodes.map((n) => [n.slug, n]));
  const cur = by.get(current);
  if (!cur) return null;
  const [dx, dy] = VEC[dir];
  let best: string | null = null;
  let bestScore = 0;
  for (const ns of neighbors(current, edges)) {
    const nb = by.get(ns);
    if (!nb) continue;
    const vx = nb.x - cur.x;
    const vy = nb.y - cur.y;
    const len = Math.hypot(vx, vy) || 1;
    const dot = (vx / len) * dx + (vy / len) * dy; // cosine of angle to dir
    if (dot > bestScore) { bestScore = dot; best = ns; }
  }
  return best;
}
