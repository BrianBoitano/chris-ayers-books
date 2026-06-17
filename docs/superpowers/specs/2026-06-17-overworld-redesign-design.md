# Home Overworld Redesign — Design

Date: 2026-06-17
Author: Chris Ayers
Status: Approved for planning

## Purpose

Replace the chris-ayersbooks.com home page (currently a static grid of "world
tiles") with an immersive, walkable Cyberpunk-2077-style neon-noir NETWORK that
the visitor breaches into. Each work is a network node wired to the others; a
breach-cursor travels the data-lines and "jacks in" to a node to enter that
work. The look and behavior were validated with an interactive mockup during
brainstorming (`.superpowers/brainstorm/.../neon-noir-network.html`, approved).

This also fixes two live bugs the redesign subsumes:
1. The unstyled ProgressHud renders raw "XP 25 Secrets 1" text into every page
   footer (it is mounted site-wide in BaseLayout with no CSS).
2. The About page text column is pinched next to the portrait.

## Goals and success criteria

- Home page is a gritty CP2077-style network map: signature yellow with cyan and
  red accents, clipped angular terminals, glitch title, grain, scanlines, neon
  skyline, deck-style HUD.
- Worlds are nodes wired by angular data-lines. A breach-cursor moves node to
  node and enters a work on "jack in".
- Adding a future work stays a drop-in: a new node and wire appear automatically
  from the `works` collection, with an optional per-work position override.
- Fully accessible: keyboard movement, and a plain semantic fallback for no-JS,
  screen readers, and reduced-motion.
- The game HUD lives only inside the overworld stage; reading pages are clean.

## Non-goals (YAGNI)

- No "deeper" book sub-network (a series expanding into book-nodes). v1 breaches a
  series node straight to its existing work page. This is a future layer.
- No forced sequential unlocking. Every live/coming-soon node is reachable
  immediately; only `status: locked` works are gated.
- No free-roam movement on a blank field. The cursor is constrained to the
  network graph (node-to-node along wires).
- No change to the works/books pages, GM data, email capture, or SEO beyond what
  is listed here.

## Aesthetic (locked)

Cyberpunk 2077 visual language: primary yellow `#fcee0a`, cyan `#00e5ff`, red
`#ff2e4d`, near-black `#040406` base; clipped-corner (polygon clip-path) angular
terminals; RGB-split glitch title; SVG-turbulence grain overlay; scanlines;
vignette; neon skyline silhouette; perspective floor grid. The brand green
(`--green`/`#1bd96a`) stays available as a secondary accent. The approved mockup
is the visual reference of record.

## Interaction

- On load: GM greeting renders as a `DAEMON//GM:` line in the HUD; title glitches
  in; the breach-cursor sits on the first node (lowest `order`).
- Movement: the cursor hops between CONNECTED nodes along the wires. Inputs:
  arrow keys / WASD (keyboard), and tap/click a node (touch/mouse). The cursor
  animates along the wire to the target node.
- Enter a world ("jack in"): Enter key on the focused node, click/tap the node,
  or a short press-and-hold on touch. Behavior by node type:
  - external work (Broadcast): opens `externalUrl` in a new tab (`rel="noopener"`).
  - live / coming-soon hosted work: navigates to `/works/<slug>`.
  - locked work: refuses entry; fires a GM `lockedTile` taunt; no navigation.
- A click anywhere on a node also navigates/opens directly (so impatient or
  mouse users never have to "drive"); driving is an enhancement, not a gate.

## Content model change

Add ONE optional field to `workSchema` (`src/content/schema.ts`):

- `position?: { x: number; y: number }` — node placement in layout viewBox units
  (0..100 on each axis, resolution-independent). When present, it overrides
  auto-layout for that node. When absent, the node is auto-placed.

Everything else in `workSchema`/`bookSchema` is unchanged. Existing seed content
keeps working (no `position` set = auto-placed).

## Auto-layout (the scalability engine)

A new pure module `src/lib/network.ts` exports:

- `layoutNetwork(works: WorkEntry[]): NetworkModel` where
  `NetworkModel = { nodes: NetworkNode[]; wires: Wire[]; viewBox: { w: number; h: number } }`,
  `NetworkNode = { slug: string; x: number; y: number; data: WorkData }` (x,y in
  0..100 viewBox units), and `Wire = { from: string; to: string; points: [number, number][] }`.
- Algorithm (deterministic, given sorted-by-`order` works):
  - viewBox is a fixed logical box (e.g. `{ w: 100, h: 56 }`); the SVG/CSS scales
    it responsively.
  - Nodes are spread left-to-right: `x = marginX + i * stepX` (stepX from node
    count, clamped to a min spacing).
  - `y` alternates across a small set of bands (e.g. high/low/mid) by index to
    produce the angular zig-zag spine.
  - A node with `data.position` uses those coords verbatim instead.
  - `wires` connect consecutive nodes (i -> i+1) as ORTHOGONAL polylines
    (right-angle segments: horizontal then vertical then horizontal), so the
    network reads as circuit/data routing, not smooth curves.
- The module is pure and unit-tested (no DOM): assert node count, ordering by
  `order`, override honored, wires connect consecutive nodes, coordinates within
  the viewBox.

`Overworld.astro` consumes `layoutNetwork(works)` and renders the SVG wires +
positioned `NetworkNode` components. Adding a work => new node + wire, no layout
edits.

## Movement, gating, accessibility, fallback

- Movement + breach logic is a client module `src/scripts/breach.ts` (or an
  inline bundled `<script>` in Overworld) that reads the rendered node/edge graph
  from the DOM (data attributes) and handles keyboard/touch, cursor animation,
  and "jack in" navigation. It must be a BUNDLED script (Astro `<script>`), never
  a `define:vars` inline script (that pattern silently breaks `import`; see the
  GmVoice incident).
- Gating: only `status: locked` refuses entry. Reachability is not gated.
- Accessibility / fallback (all required):
  - Every node is also a real, focusable link/button with an accessible name
    (e.g. "Enter The Broadcast" / "New Series, coming soon" / "Locked sector").
    The network works with Tab + Enter even if the driving script never runs.
  - No-JS: the nodes render as a usable list of links (the SVG/HUD are
    decorative; the links are real anchors). Nobody is trapped.
  - `prefers-reduced-motion`: disable grain/scanline/glitch animation and the
    cursor travel animation (instant focus moves instead).
  - Screen readers: the stage has a labelled region; decorative layers are
    `aria-hidden`; the node links carry the semantics.

## HUD, progression, and the About fix

- The deck HUD (ACCESS = XP, DATASHARDS = secrets count, `DAEMON//GM:` line)
  renders INSIDE the overworld stage, styled per the mockup, driven by the
  existing `src/lib/progress.ts` localStorage state.
- Remove the site-wide `<ProgressHud />` mount from `src/layouts/BaseLayout.astro`
  (this kills the raw-text footer artifact on every page). Progression state and
  easter-egg finds still work everywhere via the existing progress lib; the GM
  still reacts to `gm:say`; reading pages simply do not paint a game HUD.
- The HUD becomes part of `Overworld.astro` (or a styled `OverworldHud` child),
  consuming the same `progress.ts` functions the old ProgressHud used.
- About page: widen the copy column so the text no longer crowds the portrait
  (adjust the grid in `src/pages/about.astro`).

## Components and scope

New:
- `src/lib/network.ts` — pure layout (unit-tested).
- `src/components/Overworld.astro` — the stage: background, skyline, grid, grain,
  scanlines, SVG wires, HUD, accessible node list. Consumes `layoutNetwork`.
- `src/components/NetworkNode.astro` — one terminal (live/coming-soon/external/
  locked variants), rendered as an accessible link/button with data attributes
  for the breach script.
- breach client script (bundled) — cursor movement + jack-in.

Changed:
- `src/pages/index.astro` — swap the WorldTile grid for `<Overworld works={...} />`.
- `src/content/schema.ts` — add optional `position`.
- `src/layouts/BaseLayout.astro` — remove the site-wide ProgressHud mount.
- `src/pages/about.astro` — widen copy column.
- `src/components/ProgressHud.astro` — retired or folded into the overworld HUD.

Retired:
- `src/components/WorldTile.astro` and the `.world-grid`/`.world-tile`/
  `.hero-select` CSS (superseded by the overworld). `src/lib/works.ts`
  (`sortWorks`, `worldHref`, `isExternal`) is REUSED by the overworld and stays.

Untouched: works/books pages, GM data + GmVoice, EmailCapture + subscribe API,
SEO/sitemap, config, the content of existing `works`/`books` entries.

Docs:
- Update `/author-hub` SKILL.md: adding a work still "just appears" as a node;
  document the optional `position` override.

## Global constraints

- No Dungeon Crawler Carl / DCC references anywhere.
- No em dashes in reader-facing copy (titles, aria-labels, node labels, GM lines).
- GM voice sarcastic but never mean.
- Real-name author brand (Christopher Ayers); not a "The Broadcast" property.
- Reader-facing copy stays accessible; the game is an enhancement over a working
  list of links, never a barrier.

## Testable units

- `layoutNetwork` (pure): node count, order, override honored, wires connect
  consecutive nodes, coords within viewBox, single-node and empty cases.
- `worldHref`/`isExternal` (existing) continue to drive node destinations.
- Build verification: home renders the overworld + an accessible node link per
  non-? work; locked and external nodes behave per spec; reduced-motion path
  compiles; About column widened; no ProgressHud text on inner pages.

## Open items

- Final node label copy per state (live/coming-soon/external/locked) to be set in
  NetworkNode, in GM voice, no em dashes.
- Exact palette balance (yellow-dominant vs more cyan) can be tuned during build
  against the approved mockup.
