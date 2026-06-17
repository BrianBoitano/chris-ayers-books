# Home Overworld Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's static world-tile grid with a walkable Cyberpunk-2077 neon-noir NETWORK where each work is a breach-able node, auto-laid-out from the `works` collection, with a keyboard/touch breach-cursor and a first-class accessible fallback.

**Architecture:** A pure layout module turns the `works` list into node coordinates + orthogonal wire polylines (deterministic, with optional per-work override). An `Overworld.astro` stage renders the SVG wires, positioned `NetworkNode` terminals (real accessible links), the deck HUD, and gritty decorative layers. A pure `breachNav` module computes directional node-to-node movement; a bundled client script wires it to keyboard/touch and "jack in" navigation, degrading to plain links with no JS.

**Tech Stack:** Astro 5, TypeScript, Vitest, SVG, CSS (scoped component styles). Reuses `src/lib/works.ts` (`sortWorks`, `worldHref`, `isExternal`), `src/lib/progress.ts`, `src/lib/gm.ts`.

## Global Constraints

- No Dungeon Crawler Carl / DCC references anywhere.
- No em dashes in reader-facing copy (titles, aria-labels, node labels, GM lines). Use ':' or ' | ' or restructure.
- GM voice sarcastic but never mean.
- Real-name author brand (Christopher Ayers); not a "The Broadcast" property.
- The overworld is an enhancement over a working list of real links; never a barrier. Keyboard + no-JS + reduced-motion must all work.
- Client behavior goes in a BUNDLED Astro `<script>` (supports `import`), never a `define:vars` inline script.
- Aesthetic reference of record: the approved mockup `.superpowers/brainstorm/2337236-1781729890/content/neon-noir-network.html` (palette `--yel:#fcee0a; --cy:#00e5ff; --red:#ff2e4d`; base `#040406`; clipped angular terminals; glitch title; grain + scanlines + vignette + neon skyline).
- Vitest `environment: 'node'`; pure libs are unit-tested, Astro components verified by `npm run build`.
- Commit after every task. Repo `~/chris-ayers-books`, remote `origin` (auto-deploys on push) — do NOT push except in the final task.

---

### Task 1: Add optional `position` to the work schema

**Files:**
- Modify: `src/content/schema.ts`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `workSchema` accepts an optional `position: { x: number; y: number }`. `Work` type gains `position?`.

- [ ] **Step 1: Add a failing test to `tests/content-schema.test.ts`**

Append inside the existing `describe('workSchema', ...)`:

```ts
  it('accepts an optional position override', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1,
      position: { x: 20, y: 60 },
    });
    expect(r.success).toBe(true);
  });
  it('rejects a malformed position', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1,
      position: { x: 'nope' },
    });
    expect(r.success).toBe(false);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- content-schema`
Expected: FAIL (position not in schema yet, so the malformed case may pass-through unexpectedly / the typed field is absent).

- [ ] **Step 3: Add the field in `src/content/schema.ts`**

Inside `workSchema = z.object({ ... })`, after the `externalUrl` line, add:

```ts
  // Optional node placement override for the overworld map, in 0..100 viewBox
  // units on each axis. Absent = auto-placed by network layout.
  position: z.object({ x: z.number(), y: z.number() }).optional(),
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- content-schema`
Expected: PASS (all content-schema tests).

- [ ] **Step 5: Verify content still compiles**

Run: `npx astro sync && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/content/schema.ts tests/content-schema.test.ts
git commit -m "feat: add optional position override to work schema"
```

---

### Task 2: Network layout module

**Files:**
- Create: `src/lib/network.ts`
- Test: `tests/network.test.ts`

**Interfaces:**
- Consumes: `sortWorks` from `src/lib/works.ts`.
- Produces: `src/lib/network.ts` exporting:
  - `interface NetNode { slug: string; x: number; y: number; data: any }`
  - `interface Wire { from: string; to: string; points: [number, number][] }`
  - `interface NetworkModel { nodes: NetNode[]; wires: Wire[]; viewBox: { w: number; h: number } }`
  - `layoutNetwork(works: { slug: string; data: { order: number; position?: { x: number; y: number } } }[]): NetworkModel`
  - Coordinates are in 0..100 units on BOTH axes; `viewBox` is `{ w: 100, h: 100 }`.

- [ ] **Step 1: Write `tests/network.test.ts` (failing)**

```ts
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
    expect(m.wires).toEqual([]);
  });
  it('handles empty input', () => {
    const m = layoutNetwork([]);
    expect(m.nodes).toEqual([]);
    expect(m.wires).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- network`
Expected: FAIL, cannot import `layoutNetwork`.

- [ ] **Step 3: Create `src/lib/network.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- network`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/network.ts tests/network.test.ts
git commit -m "feat: pure network layout (auto-place nodes + orthogonal wires)"
```

---

### Task 3: Breach navigation logic

**Files:**
- Create: `src/lib/breachNav.ts`
- Test: `tests/breachNav.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/lib/breachNav.ts` exporting:
  - `type Dir = 'left' | 'right' | 'up' | 'down'`
  - `interface NavNode { slug: string; x: number; y: number }`
  - `neighbors(slug: string, edges: [string, string][]): string[]`
  - `move(nodes: NavNode[], edges: [string, string][], current: string, dir: Dir): string | null` — returns the connected neighbor best matching `dir` (max positive dot product of the direction vector with the vector to the neighbor), else `null`.

- [ ] **Step 1: Write `tests/breachNav.test.ts` (failing)**

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- breachNav`
Expected: FAIL, cannot import.

- [ ] **Step 3: Create `src/lib/breachNav.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- breachNav`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/breachNav.ts tests/breachNav.test.ts
git commit -m "feat: pure directional breach navigation over the node graph"
```

---

### Task 4: NetworkNode terminal component

**Files:**
- Create: `src/components/NetworkNode.astro`
- (verified by build via a temporary import in Task 5; no standalone test)

**Interfaces:**
- Consumes: `worldHref`, `isExternal` from `src/lib/works.ts`.
- Produces: `<NetworkNode slug x y data />` rendering ONE accessible terminal absolutely positioned at `left:x% top:y%`. Props: `slug: string`, `x: number`, `y: number`, `data: { title; tagline; status; accentColor; externalUrl? }`.
  - Renders a real `<a>` for live/coming-soon (href `/works/<slug>`) and external (href `externalUrl`, `target=_blank rel="noopener"`).
  - Renders a `<button type="button" aria-disabled="true" data-locked>` for locked works (no navigation; the breach script fires a GM taunt).
  - Carries data attributes for the breach script: `data-node data-slug={slug} data-x={x} data-y={y} data-kind={external|hosted|locked}`.

- [ ] **Step 1: Create `src/components/NetworkNode.astro`**

```astro
---
import { worldHref, isExternal } from '../lib/works';
interface Props {
  slug: string;
  x: number;
  y: number;
  data: { title: string; tagline: string; status: string; accentColor?: string; externalUrl?: string };
}
const { slug, x, y, data } = Astro.props;
const href = worldHref({ slug, data });
const external = isExternal({ data });
const locked = data.status === 'locked';
const kind = locked ? 'locked' : external ? 'external' : 'hosted';
const idNum = String((Math.abs(hashStr(slug)) % 99) + 1).padStart(2, '0');
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
const meta = locked ? 'ICE LOCKED | ACCESS DENIED'
  : external ? 'PUBLIC FEED | EXTERNAL'
  : data.status === 'coming-soon' ? 'ENCRYPTED | COMING ONLINE'
  : 'ONLINE | JACK IN';
const aria = locked ? `${data.title}, locked sector`
  : external ? `Enter ${data.title}, opens external feed in a new tab`
  : `Enter ${data.title}`;
const Tag = locked ? 'button' : 'a';
---
<div class:list={['net-node', kind]} style={`left:${x}%; top:${y}%; --accent:${data.accentColor || '#fcee0a'}`}
     data-node data-slug={slug} data-x={x} data-y={y} data-kind={kind}>
  <Tag
    class="term"
    href={locked ? undefined : href}
    type={locked ? 'button' : undefined}
    aria-disabled={locked ? 'true' : undefined}
    data-locked={locked ? '' : undefined}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener' : undefined}
    aria-label={aria}
  >
    <span class="ic" aria-hidden="true">{locked ? '\u{1F512}' : external ? '▲' : '◆'}</span>
    <span class="txt"><span class="id">NODE.{idNum}</span><span class="nm">{data.title}</span></span>
  </Tag>
  <span class="meta" aria-hidden="true">{meta}</span>
</div>

<style>
  .net-node { position:absolute; transform:translate(-50%,-50%); width:148px; z-index:4; font-family:"Courier New",ui-monospace,monospace; }
  .term { position:relative; display:flex; align-items:center; gap:8px; padding:0 10px; height:58px; text-decoration:none;
    background:linear-gradient(180deg, color-mix(in srgb, var(--accent) 12%, transparent), rgba(8,8,12,.86));
    border:1px solid var(--accent); clip-path:polygon(0 0,100% 0,100% 64%,86% 100%,0 100%);
    box-shadow:0 0 16px color-mix(in srgb, var(--accent) 38%, transparent); cursor:pointer; }
  .term:focus-visible { outline:2px solid #fff; outline-offset:2px; }
  .ic { font-size:18px; color:var(--accent); }
  .id { display:block; font-size:9px; letter-spacing:.14em; color:#cdd6b0; }
  .nm { display:block; font-family:system-ui,sans-serif; font-weight:800; font-size:13px; color:#fff; }
  .meta { display:block; margin-top:5px; font-size:9px; letter-spacing:.16em; color:var(--accent); }
  .net-node.external { --accent:#00e5ff; }
  .net-node.locked { --accent:#ff2e4d; }
  .net-node.locked .term { box-shadow:none; cursor:not-allowed; background:linear-gradient(180deg, rgba(255,46,77,.06), rgba(8,8,12,.9)); }
  .net-node.locked .nm { color:#9aa0a4; }
  @media (prefers-reduced-motion: no-preference) {
    .term { transition:box-shadow .15s, transform .15s; }
    .net-node:not(.locked) .term:hover { transform:translateY(-1px); box-shadow:0 0 24px color-mix(in srgb, var(--accent) 60%, transparent); }
  }
</style>
```

- [ ] **Step 2: Build to verify it compiles** (temporary smoke: it is exercised by Task 5; here just typecheck/build)

Run: `npm run build`
Expected: build succeeds (the component is not yet referenced, which is fine; this confirms it compiles).

- [ ] **Step 3: Commit**

```bash
git add src/components/NetworkNode.astro
git commit -m "feat: accessible NetworkNode terminal (live/coming-soon/external/locked)"
```

---

### Task 5: Overworld stage + HUD

**Files:**
- Create: `src/components/Overworld.astro`
- (verified by build + dist output checks)

**Interfaces:**
- Consumes: `layoutNetwork` (`src/lib/network.ts`), `NetworkNode`, `pickLine` (`src/lib/gm.ts`), `sortWorks` (`src/lib/works.ts`).
- Produces: `<Overworld works={WorkEntry[]} />` rendering the full stage: decorative layers (aria-hidden), SVG wires, NetworkNodes, breach-cursor element, deck HUD (ACCESS/DATASHARDS/DAEMON), and a visually-hidden instruction line. Emits `data-overworld` on the stage and `data-edges` (JSON `[[from,to],...]`) for the breach script.

- [ ] **Step 1: Create `src/components/Overworld.astro`**

```astro
---
import { layoutNetwork } from '../lib/network';
import NetworkNode from './NetworkNode.astro';
import { pickLine } from '../lib/gm';

interface Props { works: { slug: string; data: any }[]; }
const { works } = Astro.props;
const model = layoutNetwork(works);
const first = model.nodes[0];
const edges = JSON.stringify(model.wires.map((w) => [w.from, w.to]));
const greeting = pickLine('greeting', 0);
const polyPoints = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(' ');
---
<section class="overworld" data-overworld data-edges={edges} aria-label="Choose a world to enter">
  <p class="sr-only">
    Use arrow keys to move between worlds and Enter to open one, or just click a world. A plain list of links follows.
  </p>

  <!-- decorative layers -->
  <div class="ow-grid" aria-hidden="true"></div>
  <svg class="ow-net" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><filter id="owglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    {model.wires.map((wire, i) => (
      <polyline points={polyPoints(wire.points)} fill="none" stroke="#fcee0a" stroke-width="0.5"
        stroke-dasharray={i % 2 ? '1.5 1.5' : undefined} filter="url(#owglow)" opacity={i % 2 ? '0.5' : '0.9'} />
    ))}
  </svg>

  <div class="ow-title" aria-hidden="true">
    <h2>Select Node</h2>
    <p><span class="blk">// BREACH</span> A SECTOR TO JACK IN</p>
  </div>

  <h1 class="sr-only">Choose your world</h1>

  {model.nodes.map((n) => <NetworkNode slug={n.slug} x={n.x} y={n.y} data={n.data} />)}

  {first && <div class="ow-cursor" data-cursor style={`left:${first.x}%; top:${first.y}%`} aria-hidden="true"></div>}

  <div class="ow-hud" aria-hidden="true">
    <span class="lab">ACCESS</span>
    <span class="seg" data-hud-seg></span>
    <span class="lab"><b data-hud-xp>0</b></span>
    <span class="lab" style="margin-left:14px">DATASHARDS <b data-hud-eggs>0</b></span>
    <span class="daemon"><b>DAEMON//GM:</b> <span data-daemon-text>{greeting}</span></span>
  </div>

  <div class="ow-scan" aria-hidden="true"></div>
  <div class="ow-grain" aria-hidden="true"></div>
  <div class="ow-vig" aria-hidden="true"></div>
</section>

<style>
  .overworld { position:relative; height:min(72vh,560px); margin:14px 0 6px; overflow:hidden;
    clip-path:polygon(0 0,100% 0,100% 94%,97% 100%,0 100%);
    background:
      radial-gradient(70% 50% at 22% 18%, rgba(255,46,77,.14), transparent 60%),
      radial-gradient(70% 60% at 82% 90%, rgba(0,229,255,.16), transparent 60%),
      linear-gradient(#080a10,#050507);
    border:1px solid #1d1d10; font-family:"Courier New",ui-monospace,monospace; }
  .ow-net { position:absolute; inset:0; z-index:3; }
  .ow-grid { position:absolute; left:50%; bottom:-2px; width:220%; height:55%; z-index:1;
    transform:translateX(-50%) perspective(440px) rotateX(64deg);
    background-image:linear-gradient(rgba(0,229,255,.30) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.18) 1px,transparent 1px);
    background-size:48px 48px; -webkit-mask-image:linear-gradient(to top,#000 8%,transparent 78%); mask-image:linear-gradient(to top,#000 8%,transparent 78%); opacity:.45; }
  .ow-title { position:absolute; top:16px; left:18px; z-index:6; }
  .ow-title h2 { margin:0; font-family:system-ui,sans-serif; font-size:26px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:#f4fbff; text-shadow:2px 0 #ff2e4d,-2px 0 #00e5ff; }
  .ow-title p { margin:6px 0 0; font-size:11px; letter-spacing:.26em; color:#fcee0a; }
  .ow-title .blk { background:#fcee0a; color:#0a0a04; padding:0 6px; }
  .ow-cursor { position:absolute; z-index:6; width:22px; height:22px; transform:translate(-50%,-50%) rotate(45deg); background:#fcee0a; box-shadow:0 0 18px #fcee0a; border:2px solid #0a0a04; }
  .ow-hud { position:absolute; left:0; right:0; bottom:0; z-index:7; display:flex; align-items:center; gap:14px; padding:12px 16px; background:linear-gradient(transparent, rgba(3,4,8,.94) 38%); }
  .ow-hud .lab { font-size:11px; letter-spacing:.14em; color:#b9c47e; }
  .ow-hud .lab b { color:#fcee0a; }
  .ow-hud .seg { display:inline-flex; gap:3px; }
  .ow-hud .seg i { width:12px; height:9px; background:#1d2417; border:1px solid #2c3a1e; }
  .ow-hud .seg i.on { background:#fcee0a; border-color:#fcee0a; box-shadow:0 0 7px #fcee0a; }
  .ow-hud .daemon { margin-left:auto; font-size:11px; color:#7fb0bb; max-width:46%; }
  .ow-hud .daemon b { color:#ff2e4d; }
  .ow-scan { position:absolute; inset:0; z-index:8; pointer-events:none; opacity:.45; background:repeating-linear-gradient(transparent 0 2px, rgba(0,0,0,.22) 2px 3px); }
  .ow-grain { position:absolute; inset:0; z-index:9; pointer-events:none; opacity:.10; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }
  .ow-vig { position:absolute; inset:0; z-index:5; pointer-events:none; box-shadow:inset 0 0 160px #000; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
  @media (prefers-reduced-motion: reduce) {
    .ow-scan, .ow-grain { display:none; }
  }
</style>
```

- [ ] **Step 2: Build and verify the stage renders with accessible node links**

Run: `npm run build`
Expected: build succeeds.

Note: the component is not yet placed on a page; the next step adds a temporary render only to verify output. Skip if you proceed straight to Task 7 in the same session — but to gate THIS task independently, do Step 3.

- [ ] **Step 3: Temporary render check**

Temporarily add to `src/pages/index.astro` (frontmatter import + one tag) to confirm output, then revert before commit:

```bash
# after temporarily importing and rendering <Overworld works={works} /> and building:
grep -c 'data-overworld' dist/client/index.html   # expect 1
grep -c 'net-node' dist/client/index.html          # expect one per work (>=2 with seed content)
```
Expected: `data-overworld` present and one `net-node` per work. Revert the temporary edit to `index.astro` (the real wiring happens in Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/components/Overworld.astro
git commit -m "feat: Overworld stage with SVG wires, nodes, HUD, accessible fallback"
```

---

### Task 6: Breach cursor client behavior

**Files:**
- Create: `src/scripts/breach.ts`
- Modify: `src/components/Overworld.astro` (add a bundled `<script>` importing the module)

**Interfaces:**
- Consumes: `move` from `src/lib/breachNav.ts`; the DOM contract from Task 5 (`[data-overworld][data-edges]`, `[data-node][data-slug][data-x][data-y][data-kind]`, `[data-cursor]`, HUD `[data-hud-xp]`/`[data-hud-eggs]`/`[data-hud-seg]`); `SAVE_KEY`/`normalize`/`visitWorld`/`findEgg` from `src/lib/progress.ts`; `EGGS` from `src/data/eggs.ts`.
- Produces: `initBreach()` default export that wires keyboard + touch movement, cursor animation, "jack in" navigation, locked-node GM taunt, and HUD hydration from localStorage. Reduced-motion aware.

- [ ] **Step 1: Create `src/scripts/breach.ts`**

```ts
import { move, type Dir } from '../lib/breachNav';
import { randomLine } from '../lib/gm';
import { SAVE_KEY, normalize, visitWorld, findEgg } from '../lib/progress';
import { EGGS } from '../data/eggs';

export default function initBreach() {
  const stage = document.querySelector<HTMLElement>('[data-overworld]');
  if (!stage) return;
  if (stage.dataset.breachReady === '1') return; stage.dataset.breachReady = '1';

  // DAEMON/GM line: server-rendered greeting, rotates on idle + reacts to gm:say
  const daemon = stage.querySelector<HTMLElement>('[data-daemon-text]');
  const setDaemon = (ctx: string) => { if (daemon) daemon.textContent = randomLine(ctx as any); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idleTimer = 0;
  if (!reduceMotion) idleTimer = window.setInterval(() => setDaemon('idle'), 12000);
  document.addEventListener('gm:say', (e: any) => setDaemon(e.detail?.context || 'idle'));
  const stopIdle = () => clearInterval(idleTimer);
  document.addEventListener('astro:before-swap', stopIdle, { once: true });
  window.addEventListener('beforeunload', stopIdle);

  const nodeEls = Array.from(stage.querySelectorAll<HTMLElement>('[data-node]'));
  const nodes = nodeEls.map((el) => ({
    slug: el.dataset.slug!, x: Number(el.dataset.x), y: Number(el.dataset.y),
    kind: el.dataset.kind!, el,
  }));
  if (nodes.length === 0) return;
  const edges: [string, string][] = JSON.parse(stage.dataset.edges || '[]');
  const cursor = stage.querySelector<HTMLElement>('[data-cursor]');

  let current = nodes[0].slug;
  const bySlug = (s: string) => nodes.find((n) => n.slug === s)!;

  const placeCursor = () => {
    const n = bySlug(current);
    if (cursor) { cursor.style.left = n.x + '%'; cursor.style.top = n.y + '%'; cursor.style.transition = reduceMotion ? 'none' : 'left .18s, top .18s'; }
    n.el.querySelector<HTMLElement>('.term')?.focus({ preventScroll: true });
  };

  const say = (context: string) => document.dispatchEvent(new CustomEvent('gm:say', { detail: { context } }));

  // progress state + HUD
  const load = () => { try { return normalize(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); } catch { return normalize(null); } };
  const persist = (p: any) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch {} };
  let p = load();
  const seg = stage.querySelector<HTMLElement>('[data-hud-seg]');
  const renderHud = () => {
    const xp = stage.querySelector('[data-hud-xp]'); if (xp) xp.textContent = String(p.xp);
    const eg = stage.querySelector('[data-hud-eggs]'); if (eg) eg.textContent = String(p.eggs.length);
    if (seg) { const on = Math.min(6, Math.round(p.xp / 10)); seg.innerHTML = ''; for (let i = 0; i < 6; i++) { const s = document.createElement('i'); if (i < on) s.className = 'on'; seg.appendChild(s); } }
  };
  renderHud();

  const enter = (slug: string) => {
    const n = bySlug(slug);
    if (n.kind === 'locked') { say('lockedTile'); return; }
    const next = visitWorld(p, slug);
    if (next !== p) { p = next; persist(p); renderHud(); }
    const a = n.el.querySelector<HTMLAnchorElement>('a.term');
    if (a) { if (a.target === '_blank') window.open(a.href, '_blank', 'noopener'); else window.location.href = a.href; }
  };

  // keyboard
  const keymap: Record<string, Dir> = {
    ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
    ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
  };
  stage.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k in keymap) { const to = move(nodes, edges, current, keymap[k] as Dir); if (to) { current = to; placeCursor(); e.preventDefault(); } }
    else if (e.key === 'Enter' || e.key === ' ') { enter(current); e.preventDefault(); }
  });

  // pointer: a click on a node enters it (real links already navigate; this also
  // counts the visit + handles locked). Make the cursor follow too.
  for (const n of nodes) {
    n.el.addEventListener('click', (e) => {
      current = n.slug; placeCursor();
      if (n.kind === 'locked') { e.preventDefault(); say('lockedTile'); return; }
      // let the anchor navigate, but record the visit first
      const next = visitWorld(p, n.slug); if (next !== p) { p = next; persist(p); renderHud(); }
    });
  }

  // easter eggs (registry)
  for (const egg of EGGS) {
    const t = document.querySelector(egg.selector);
    if (t) t.addEventListener('click', () => { const next = findEgg(p, egg.id); if (next !== p) { p = next; persist(p); renderHud(); say('eggFound'); } });
  }

  placeCursor();
}
```

- [ ] **Step 2: Wire the bundled script into `src/components/Overworld.astro`**

Add at the very end of the file (after the `</style>`), a BUNDLED script (no `define:vars`):

```astro
<script>
  import initBreach from '../scripts/breach.ts';
  const start = () => initBreach();
  document.addEventListener('astro:page-load', start, { once: true });
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
</script>
```

The double-init guard (`stage.dataset.breachReady`) is already at the top of `breach.ts` from Step 1, so firing `start()` from multiple lifecycle events is safe.

- [ ] **Step 3: Build and confirm the breach script bundles (no inline bare import)**

Run: `npm run build`
Then:
```bash
grep -rl "data-overworld" dist/client/*.html >/dev/null && echo "stage present"
# confirm NOT shipped as an inline bare import:
! grep -R "from '../scripts/breach" dist/client/ && echo "breach script bundled (no inline import)"
```
Expected: build succeeds; stage present; the breach import is bundled (grep finds no raw source import in the HTML).

- [ ] **Step 4: Run the unit suites (still green)**

Run: `npm test`
Expected: all suites pass (network, breachNav, progress, gm, seo, subscribeRules, content-schema, config, works).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/breach.ts src/components/Overworld.astro
git commit -m "feat: breach-cursor movement, jack-in, HUD hydration (bundled, reduced-motion aware)"
```

---

### Task 7: Integrate on the home page; remove the old grid + footer HUD; widen About

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/styles/global.css`
- Delete: `src/components/WorldTile.astro`, `src/components/ProgressHud.astro`

**Interfaces:**
- Consumes: `Overworld` (Task 5).
- Produces: home page renders `<Overworld>`; no site-wide HUD text; wider About column.

- [ ] **Step 1: Swap the home page to the Overworld**

In `src/pages/index.astro`, replace the import of `WorldTile` and the `<section class="hero-select">` + `<section id="worlds" class="world-grid">` blocks with the Overworld. Keep the `works`, `worksLd`/`ld`, `EmailCapture`, and BaseLayout usage. Result frontmatter import:

```astro
import Overworld from '../components/Overworld.astro';
```
Result body (replace the two old sections with one):
```astro
  <Overworld works={works} />
  <section class="join">
    <EmailCapture />
  </section>
```
Remove the now-unused `GmVoice` import and `WorldTile` import from `index.astro` (the GM line now lives in the Overworld HUD).

- [ ] **Step 2: Remove the site-wide ProgressHud from `src/layouts/BaseLayout.astro`**

Delete the `import ProgressHud from '../components/ProgressHud.astro';` line and the `<ProgressHud />` element. Leave `<FollowMe />` and everything else intact.

- [ ] **Step 3: Delete the retired components**

```bash
git rm src/components/WorldTile.astro src/components/ProgressHud.astro
```

- [ ] **Step 4: Remove retired CSS from `src/styles/global.css`**

Delete the `.hero-select`, `.world-grid`, and `.world-tile` (including `a.world-tile:hover`, `:focus-visible`, `.world-tile.is-locked`) rule blocks. Leave all other rules. (The Overworld and NetworkNode carry their own scoped styles.)

- [ ] **Step 5: Widen the About copy column in `src/pages/about.astro`**

In the `<style>` block, change `.about-page` so the text is not pinched:
```css
  .about-page {
    max-width: 60rem;
    margin: 0 auto;
    padding: 3rem 1rem;
    display: grid;
    grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
    gap: 2.5rem;
    align-items: start;
  }
```
Leave the mobile `@media (max-width: 640px)` block and the portrait rules as-is.

- [ ] **Step 6: Build and verify integration**

Run: `npm run build`
Then:
```bash
grep -c 'data-overworld' dist/client/index.html        # expect 1
grep -c 'net-node' dist/client/index.html               # expect one per work (>=2)
grep -Rc 'progress-hud' dist/client/about/index.html || echo "0 (no HUD text on About — correct)"
grep -c 'world-grid' dist/client/index.html || echo "0 (old grid gone — correct)"
```
Expected: overworld present with a node per work; no `progress-hud` on inner pages; no `world-grid`.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro src/layouts/BaseLayout.astro src/pages/about.astro src/styles/global.css
git commit -m "feat: home page = overworld; remove old tile grid + footer HUD; widen About"
```

---

### Task 8: Update the /author-hub skill; final verification; push

**Files:**
- Modify: `~/.claude/skills/author-hub/SKILL.md`
- Modify: `docs/author-hub-skill.md` (repo mirror)

**Interfaces:**
- Consumes: nothing.
- Produces: docs reflect the overworld (a new work auto-appears as a network node; optional `position` override).

- [ ] **Step 1: Update the skill docs**

In `~/.claude/skills/author-hub/SKILL.md` (and mirror the same edit into `docs/author-hub-skill.md`): in the ADD A WORK section, note that the home page is now the neon-noir overworld and a new work automatically appears as a network node (auto-placed by `order`); document the optional `position: { x, y }` frontmatter field (0..100 viewBox units) for art-directing a node's placement; note that locked/external nodes behave as before (external links out, locked is ICE-locked). Keep all global constraints (no DCC, no em dashes, GM snarky, real-name brand).

- [ ] **Step 2: Full verification**

Run: `npm test && npm run build`
Expected: all suites pass; build clean.

- [ ] **Step 3: Commit and push (auto-deploys)**

```bash
git add docs/author-hub-skill.md
git commit -m "docs: update /author-hub skill for the overworld + position override"
git push
```

- [ ] **Step 4: Verify on production after deploy**

Run (poll until live):
```bash
curl -s https://chrisayersbooks.com/ | grep -c 'data-overworld'   # expect 1 once deployed
```
Expected: the overworld is live on production. Manually confirm in a browser: nodes render, keyboard/click movement works, locked node taunts, About text is no longer cramped, and no stray "XP/Secrets" text in footers.

---

## Post-implementation notes (out of plan scope)

- Final node-label copy and palette balance can be tuned against the approved mockup.
- The "deeper" book sub-network (series expands into book-nodes) is a future layer.
