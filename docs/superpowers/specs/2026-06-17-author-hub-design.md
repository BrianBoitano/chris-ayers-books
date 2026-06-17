# Author Hub Site — Design

Date: 2026-06-17
Author: Chris Ayers
Status: Approved for planning

## Purpose

A standalone author-brand website at chrisayersbooks.com that serves as the home
for all of Chris Ayers' adult fiction. It is a brand-new site in its own repo and Vercel project. The existing
The Broadcast series site (thebroadcastseries.com) is left completely untouched
and is featured on the hub as a link out, not duplicated.

The hub is built to scale: it must stay rich and fun no matter how many series
or standalone novels are added over time, with no hand-building per work.

## Goals and success criteria

- One author-brand site under Chris's real name housing all adult fiction.
- The Broadcast appears as a featured "world" that links out to its own site.
- Any new series or standalone is added by dropping in content (markdown + cover)
  and pushing, with tiles, pages, routing, SEO, and sitemap auto-generated.
- A fun, immersive, RPG-game-like experience that encourages exploration and
  return visits, narrated by a sarcastic Game Master persona.
- Email capture for a future newsletter.
- Kids content (How It Works for Kids) is explicitly out of scope; different brand.

## Non-goals (YAGNI)

- No accounts or login. All reader state is client-side.
- No port of the Broadcast site's full tycoon game, live chat, or ratings
  dashboard. A lighter progression HUD replaces them.
- No newsletter-sending provider yet. Collect emails now, wire a sender later.
- No mirroring of Broadcast content onto the hub.

## Information architecture

- `/` — World Select home screen. GM greeting, grid of world tiles, progress HUD,
  newsletter hook.
- `/works/[slug]` — a "world" landing page. For a hosted series, lists its books;
  for a standalone, presents the book. (Broadcast's tile links out and has no
  internal page.)
- `/books/[slug]` — individual book page: blurb, buy links, sample.
- `/about` — author bio written in the GM/"mind of Chris" voice.
- `/404` — in-persona GM joke.
- `/api/subscribe` — email capture endpoint (reused pattern from broadcast-site).

## Content model (the scalability engine)

A single content collection `works`, one entry per series OR standalone. Frontmatter:

- `title` (string)
- `slug` (string)
- `type` ("series" | "standalone")
- `status` ("live" | "coming-soon" | "locked")
- `tagline` (string)
- `blurb` (markdown body)
- `cover` (image)
- `accentColor` (string, for tile/world theming)
- `genre` (string)
- `order` (number, tile ordering)
- `externalUrl` (string, optional — when set, the tile links out instead of to an
  internal page; used for The Broadcast)
- `gmQuips` (string[], optional — sarcastic GM lines specific to this world)

A nested `books` collection for hosted series, keyed by parent work slug. Per book
frontmatter mirrors the existing broadcast-site book schema:

- `title`, `slug`, `series` (parent work slug), `order`
- `blurb` (markdown body)
- `cover` (image)
- `buyLinks` (array of {label, url})
- `sample` (optional audio/text reference)

Status transitions are a single field edit: `locked` -> `coming-soon` -> `live`.

The Broadcast seed entry: `type: series`, `status: live`,
`externalUrl: https://thebroadcastseries.com`.

## The fun layer

Game Master persona: an unnamed, fourth-wall-breaking narrator that treats the
catalog like a game world and gently roasts the visitor. Snarky, never mean,
always funny. Implemented as a data file (`src/data/gm.ts`) with pools of lines
keyed by context: `greeting`, `tileHover`, `lockedTile`, `idle`, `eggFound`,
`signup`, `notFound`. New works can contribute their own `gmQuips`. Rendered in a
persistent UI element on the World Select screen and reused on other pages.

Reader progression (client-side, localStorage, no login), reusing the state
pattern from the broadcast-site tycoon (`src/lib/tycoon/state.ts`):

- Tracks: XP, worlds visited, easter eggs found, achievements unlocked.
- A small persistent HUD shows the XP bar and egg count.
- Achievements unlock additional GM lines.

Easter eggs: a registry (data-driven, like the broadcast-site Greg egg) so adding
an egg is a data edit. Eggs increment progression and trigger GM `eggFound` lines.

## Tech stack and reuse

Stack: Astro 5, `@astrojs/vercel`, `@astrojs/sitemap`, content collections, vitest.
Repo: `github.com/BrianBoitano/chris-ayers-books` (created; local clone at
`~/chris-ayers-books`). Vercel project not yet created (to be created and linked
at deploy time). Domain chrisayersbooks.com (confirmed available via RDAP
2026-06-17; Chris to register and point DNS at the Vercel project at deploy time).

Reused from `~/broadcast-site` (copied and adapted, not shared):

- Layout/chrome: `BaseLayout`, `BaseHead`, `SiteNav`, `Footer`
- Content UI: `BookCard`, `BuyButton`, `EmailCapture`, `ShareButtons`, `FollowMe`
- Libs/config: `lib/seo.ts`, sitemap config, `styles/tokens.css`, `styles/global.css`,
  content schema patterns, `lib/buyButton.ts`, `lib/subscribe.ts`, `api/subscribe.ts`
- State pattern: `lib/tycoon/state.ts` localStorage approach, repurposed into the
  progression HUD

Deliberately NOT ported: `TycoonGame`, `LiveChat`, ratings dashboard
(`pages/ratings.astro`, `components/ratings/*`, `RatingsTeaser`), `PrequelBand`,
`pages/for-fans-of-dungeon-crawler-carl.astro`.

## Newsletter

Reuse the existing `/api/subscribe` pattern to collect emails to a simple store
now. Hook the signup into the GM frame ("join the party" / unlock a GM line on
signup). Wiring a real sending provider is deferred.

## Ongoing maintenance

A new `/author-hub` skill mirrors `/broadcast-site`: encodes the drop-in workflow
for adding a work (one markdown file + cover + push), flipping status, adding GM
quips and easter eggs, and verifying on production.

## Open items to confirm before build

- Domain: chrisayersbooks.com (selected, available as of 2026-06-17). Chris to
  register at his registrar.
- GitHub repo: chris-ayers-books (created). Vercel project: not yet created;
  create and link at deploy time.
