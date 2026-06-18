# Engagement Batch: Archive, Welcome, Egg Scavenger, Transmissions — Design

Date: 2026-06-17
Author: Chris Ayers
Status: Approved for planning

## Purpose

The site looks good but is thin and partly broken: the WORKS nav link is dead,
there is no browse-the-books destination, the home drops you straight from a
full-screen game shell to the footer with no orientation, and the progression
HUD is inert (one easter egg, nothing to do). This batch fixes the dead link and
adds four things that give the site substance and a reason to explore and return,
all within the existing Cyberpunk-2077 design system.

## Goals

1. WORKS goes somewhere real, and there is a proper "browse my worlds" page.
2. A new visitor immediately understands what the site is.
3. Exploring is rewarded (a real easter-egg hunt with a payoff).
4. The site has fresh, returnable content (a devlog) and SEO surface.
5. Nothing regresses: logic, accessibility fallbacks, palette congruence, and the
   52 passing tests all hold.

## Non-goals (YAGNI)

- No accounts, no server-side per-user state. All progress stays client-side
  localStorage, as today.
- No comments, reactions, or guestbook in this batch.
- No redesign of the overworld, palette, or chrome beyond the additions here.

## Global constraints

- Cyberpunk palette only: `--cy-yellow` (primary), `--cy-cyan` (links/secondary),
  `--cy-red` (locked/danger). No green; no new literal greens.
- No Dungeon Crawler Carl / DCC references (guardrail statements excepted).
- No em dashes in reader-facing copy.
- GM voice sarcastic but never mean. Real-name author brand (Christopher Ayers).
- Accessibility preserved: real links, keyboard, no-JS, reduced-motion. New
  animations (GM takeover, secret-node reveal) gated by prefers-reduced-motion.
- Body copy on reading pages stays high-contrast and readable.

---

## Feature 1: WORKS fix + Archive page

- New page `src/pages/works/index.astro`: a cyberpunk "Archive" listing every
  entry in the `works` collection as a card. Each card: cover (or neon
  placeholder), title, a status badge (LIVE / COMING ONLINE / ICE LOCKED), genre,
  the `overview` (fallback tagline), and a CTA matching the node kind: a real
  `<a>` "Enter" to `/works/<slug>` for hosted live/coming-soon, "Open feed" to
  `externalUrl` (new tab, noopener) for external, and a non-link "Locked" state
  for locked. Reuses `sortWorks`, `worldHref`, `isExternal`. Term-panel /
  clipped-card styling consistent with the rest of the site. Heading in the
  techy style, for example `// THE ARCHIVE`.
- Repoint the WORKS links in `SiteNav.astro` and `Footer.astro` from the dead
  `/#worlds` to `/works`.
- The page is data-driven and grows as works (and later books) are added.

## Feature 2: Welcome transmission + what-is-this band

- In `Overworld.astro`, add a short GM-voice orientation line directly under the
  `// BREACH A SECTOR TO JACK IN` subtitle: "This is the network of Chris Ayers.
  Every node is a world he wrote. Jack in." Mono, dim, no em dashes, aria-hidden
  decorative (the page already has an sr-only h1 and instructions).
- In `index.astro`, add a slim "what is this" band BELOW the full-screen
  overworld stage (between the stage and the footer): a one-line headline, a
  one-to-two sentence pitch in plain readable copy, the latest transmission
  teaser (title + date linking to it), and three CTA buttons: "Enter the Archive"
  (`/works`), "Meet the author" (`/about`), and "Get the signal" (the newsletter,
  `#notify`). Cyberpunk styling, high-contrast text.

## Feature 3: Easter-egg scavenger + Section Zero

- Grow the egg registry (`src/data/eggs.ts`) from 1 to 5 eggs, each a hidden
  clickable trigger placed on an existing element across pages: the nav wordmark
  (existing), the footer status line, an element on the About page, an element on
  the Works archive page, and an element on the 404 page. Each is a small
  `data-egg="<id>"` hook; finding it (click) records the egg.
- HUD: the DATASHARDS counter shows `found / total` (for example `2 / 5`) so
  visitors know there is a hunt. The GM occasionally teases that secrets remain.
- Payoff: when all 5 are found, (a) a GM "takeover" message appears (a styled,
  dismissible overlay, reduced-motion aware) announcing the unlock, and (b) a
  hidden "SECTION ZERO" node fades onto the overworld (a special-accent node that
  is hidden by default and revealed once complete), linking to a secret page
  `src/pages/section-zero.astro`. The unlock persists in localStorage, so the
  node stays revealed and the takeover does not replay on return visits.
- `/section-zero` is a real page (so the link resolves) but is unlinked from nav
  and marked noindex so it is a genuine find. Content: a GM monologue plus a
  short behind-the-scenes note from Chris (drafted in the plan, in voice, no em
  dashes).

## Feature 4: Transmissions devlog

- New `transmissions` content collection (frontmatter: `title: string`,
  `date: date`, optional `tag: string`; markdown body). Schema added to
  `src/content/schema.ts` and wired in `src/content/config.ts`.
- `src/pages/transmissions/index.astro`: a "TRANSMISSION LOG" index listing posts
  newest first (title, date, tag, excerpt, link). `src/pages/transmissions/
  [slug].astro`: a post page (term-panel, readable body, date, back link).
- Surfacing: add "TRANSMISSIONS" to the nav and footer (nav becomes WORKS ·
  TRANSMISSIONS · ABOUT · [BRIBE THE AUTHOR]); the what-is-this band shows the
  latest post.
- Seed with two starter posts in Chris/GM voice so it is not empty. Adding a post
  later is a markdown file plus a push.

---

## Shared architecture: progress + eggs (the important refactor)

Today the egg-finding and HUD rendering live inside `breach.ts`, which only runs
on the home overworld. Eggs now live on multiple pages, so egg handling must run
site-wide. Centralize all progress mutation in ONE site-wide module so the two
home-page scripts never clobber each other's localStorage writes.

- New `src/scripts/progress-eggs.ts`, loaded once in `BaseLayout.astro`, runs on
  every page and is the ONLY module that reads and writes `progress` localStorage:
  - Loads and normalizes progress (`src/lib/progress.ts`).
  - Wires every `EGGS` selector present on the current page to `findEgg` on click,
    persists, dispatches `gm:say` ('eggFound'), and re-renders the HUD if present.
  - Listens for a `progress:visit` CustomEvent (detail `{ slug }`) and applies
    `visitWorld`, persists, re-renders HUD. (This is how the overworld records a
    node visit without writing progress itself.)
  - Renders the HUD when present: `[data-hud-xp]` = xp, `[data-hud-eggs]` =
    `found / total` (total = `EGGS.length`), `[data-hud-seg]` = segment bar.
  - On completion (found === total): reveals any `[data-secret-node]` element
    (Section Zero) and, only when completion is newly reached this interaction,
    shows the GM takeover overlay. On load, if already complete from a prior
    visit, reveal the node silently (no takeover).
  - Reduced-motion aware; idempotent (guard against double-init).
- `src/scripts/breach.ts` (home only, in Overworld) keeps cursor movement, the
  jack-in navigation, and the daemon GM line. It no longer wires eggs or writes
  progress. On a node "jack in" it dispatches `progress:visit` with the slug
  (progress-eggs records the visit). Its `gm:say` daemon listener stays.
- `src/lib/progress.ts` gains a small pure helper `isComplete(p, total): boolean`
  (true when `p.eggs.length >= total`), unit-tested.

## Components and files

New:
- `src/pages/works/index.astro` (Archive)
- `src/pages/transmissions/index.astro`, `src/pages/transmissions/[slug].astro`
- `src/pages/section-zero.astro` (noindex, unlinked)
- `src/scripts/progress-eggs.ts` (site-wide progress + eggs + HUD + reveal)
- `src/content/transmissions/*.md` (2 seed posts)
- A what-is-this band (inline in `index.astro` or a small `HomePitch.astro`)
- Section Zero hidden node markup in `Overworld.astro`

Changed:
- `src/components/SiteNav.astro`, `src/components/Footer.astro` (WORKS -> /works;
  add TRANSMISSIONS; footer egg hook)
- `src/components/Overworld.astro` (welcome line; hidden secret node; HUD eggs
  shows /total; remove egg-wiring/HUD-write now owned by progress-eggs)
- `src/scripts/breach.ts` (drop egg/HUD/progress writes; dispatch progress:visit)
- `src/data/eggs.ts` (5 eggs)
- `src/data/gmLines.ts` (egg-hint lines + an unlock/takeover line)
- `src/lib/progress.ts` (`isComplete` helper)
- `src/content/schema.ts`, `src/content/config.ts` (transmissions collection)
- `src/layouts/BaseLayout.astro` (load progress-eggs.ts; mount the GM takeover
  overlay container + the about/404 egg hooks live on their pages)
- `src/pages/about.astro`, `src/pages/404.astro` (egg hooks)
- `/author-hub` skill doc (new pages, transmissions workflow, egg registry note)

Untouched: network layout, breachNav, works/seo libs, email API, the palette
tokens.

## Accessibility

- All new pages (Archive, Transmissions, Section Zero) are real, navigable,
  keyboard-usable pages with semantic headings and high-contrast body copy.
- Egg triggers are decorative enhancements layered on existing elements; finding
  them is a mouse/touch interaction and never required for any core task.
- The GM takeover overlay is dismissible, keyboard-closable (Escape), focus is
  managed, and it does not trap. Reduced-motion disables its animation.
- The secret-node reveal animation is gated by prefers-reduced-motion.
- Nav additions keep aria and keyboard behavior.

## Testable units

- `isComplete(p, total)` (pure): false below total, true at/over total. Vitest.
- `transmissions` schema parse (valid post; missing required rejected). Vitest.
- Build verification: `/works` lists a card per work with correct CTA per kind;
  `/transmissions` lists seed posts and `/transmissions/<slug>` renders;
  `/section-zero` builds and carries a noindex meta; the home shows the welcome
  line + what-is-this band + latest transmission; nav/footer WORKS -> /works and
  a TRANSMISSIONS link exist; the HUD eggs shows `/5`; the breach script still
  bundles; `npm test` stays green (52+).
- No green in shipped CSS; no em dashes in new reader-facing copy.

## Open items

- Final copy for the welcome line, the what-is-this band, Section Zero, the GM
  takeover, the egg-hint lines, and the two seed transmissions is drafted in the
  plan (in voice, no em dashes).
- Egg placements: the exact element selector per page is chosen in the plan.
