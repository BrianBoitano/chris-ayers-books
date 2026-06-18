# Site-Wide Cyberpunk Congruence + Full-Screen Overworld — Design

Date: 2026-06-17
Author: Chris Ayers
Status: Approved for planning

## Purpose

Make chrisayersbooks.com one congruent Cyberpunk-2077 neon-noir world end to
end, and make the home network the full arrival experience. Three things:

1. The home overworld stage fills the first screen (full viewport height under
   the nav); the email signup and footer move below the fold with a scroll cue.
2. The breach-cursor is changed from a filled diamond (which currently overlaps
   the node label, e.g. covers "The Br[diamond]adcast") to a glowing
   corner-bracket reticle that frames the current node and never covers its text.
3. A single congruent cyberpunk design system is applied across every page
   (nav, footer, background, reading pages, components), with body copy kept
   high-contrast and readable. The older brand green is retired entirely.

## Goals and success criteria

- Arriving on the home page drops you straight into a full-screen network.
- The active-node indicator frames the node, never obscures its label.
- Works, book pages, About, 404, nav, footer, and the home all read as one
  cohesive cyberpunk brand.
- Body text on reading pages stays clean and high-contrast (WCAG AA), not buried
  in neon or noise.
- One palette: yellow #fcee0a (primary), cyan #00e5ff (secondary / links), red
  #ff2e4d (locked / danger), on near-black. No green anywhere.
- All existing logic and the accessibility fallbacks are unchanged; grain and
  scanlines keep respecting prefers-reduced-motion.

## Non-goals (YAGNI)

- No change to network layout, breach movement logic, content model, email API,
  SEO, or routing. This is a presentation + layout pass.
- No new content, works, or features. No per-page bespoke art.
- No heavy effects over body copy (no scanlines/glitch on blurbs and book text).

## Palette (locked, congruent)

Retire the brand green (#1bd96a) completely. The single system:

- `--cy-yellow: #fcee0a` — primary accent (brand mark, primary buttons, HUD,
  active states, node default).
- `--cy-cyan: #00e5ff` — secondary accent, links, external nodes.
- `--cy-red: #ff2e4d` — locked / danger / 404.
- Bases: `#040406` / `#080a10` (stage), with panel surfaces around
  `rgba(8,8,12,.86)`.
- Mono (`Courier New`) for labels, IDs, nav items, HUD; Archivo for headings and
  body. Headings use the techy uppercase letter-spaced treatment; body is normal
  case, high contrast (`#dfe9ee`+), generous line-height.

Every existing green usage (SiteNav brand triangle, FollowMe FAB, EmailCapture
"NOTIFY ME" / kicker, any `--green`/#1bd96a token or rule) is replaced with the
above. After this work, no `#1bd96a` (or other green) remains in shipped CSS.

## 1. Home: full-screen stage + scroll cue

- The `Overworld` stage height becomes the first screen: `min-height` of the
  viewport minus the nav (e.g. `calc(100svh - <navheight>)`), responsive, with a
  sensible min so it never collapses on short screens.
- Nodes (positioned by percentage) spread to fill the taller stage; the HUD stays
  pinned to the bottom of the stage.
- A small animated "scroll" cue (chevron + mono label, reduced-motion: static)
  sits at the bottom edge of the stage indicating more below.
- The email signup section and footer remain, below the fold, reachable by scroll.

## 2. Breach-cursor reticle

- Replace the filled `.ow-cursor` diamond with a reticle that frames the current
  node: a box centered on the node, sized to sit just OUTSIDE the node terminal
  (wider/taller than the ~148px node), drawn as four glowing corner brackets
  (neon yellow), at a z-index BELOW the node terminal so the node's label always
  renders on top. It never fills the node interior.
- `breach.ts` keeps positioning the reticle at the node center (existing
  left/top % logic); only the element's appearance/size/z-index change (CSS). If
  any JS change is needed it is limited to sizing/positioning, not movement logic.
- Reduced-motion: no pulse animation; the reticle still moves instantly.

## 3. Site-wide design system (the congruence)

- `src/styles/tokens.css`: introduce the cyberpunk tokens above; remove/repoint
  green tokens. This is the single source consumed everywhere.
- `src/layouts/BaseLayout.astro` + `src/styles/global.css`: a subtle global
  background treatment (near-black + very faint grid + low-opacity grain) behind
  all pages, so every route feels like the same world. Grain/scanline animation
  gated by `prefers-reduced-motion`. Contrast of body text is preserved over it.
- `SiteNav.astro`: cyberpunk top bar — clipped-corner container, mono uppercase
  links with neon hover/focus, a thin HUD accent line, brand mark in neon (not
  green). Keep semantics, keyboard, aria intact.
- `Footer.astro`: matching clipped panel, mono neon links, a short flavor
  "system status" line (no em dashes, no DCC), neon dividers.
- `FollowMe.astro`: the floating FAB recolored to the neon palette (no green).

## 4. Reading pages: frame, readable core

- `src/pages/works/[slug].astro`, `src/pages/books/[slug].astro`,
  `src/pages/about.astro`: wrap main content in clipped-corner "terminal" panels
  on the grained dark background; neon techy headings; neon section dividers;
  body copy stays high-contrast, normal-case, generous line-height, constrained
  measure for readability.
- `BookCard.astro`: angular neon frame around covers; title/labels in the
  palette.
- `BuyButton.astro`: neon button styling (already yellow-leaning; align exactly).
- `EmailCapture.astro`: kicker, heading, input, and button to the unified
  palette (retire green); keep the form, honeypot, and subscribe() wiring intact.
- `src/pages/404.astro`: themed (red accent, GM line, mono), still links home.

## Accessibility

- Body text maintains WCAG AA contrast over the grained background; the grain is
  subtle/low-opacity and never reduces text legibility.
- All neon interactive elements keep visible `:focus-visible` outlines.
- Grain + scanline + cursor pulse animations all disabled under
  `prefers-reduced-motion: reduce`.
- Nav, footer, reading content remain semantic; the home accessibility fallback
  (real node links, keyboard, no-JS) is unchanged by this restyle.

## Global constraints

- No Dungeon Crawler Carl / DCC references (guardrail rule statements excepted).
- No em dashes in reader-facing copy (nav, footer flavor line, headings, labels,
  scroll cue, GM lines).
- GM voice sarcastic but never mean.
- Real-name author brand (Christopher Ayers).
- CP2077 palette values exactly as above; no green remains.

## Scope (files)

Changed: `src/styles/tokens.css`, `src/styles/global.css`,
`src/layouts/BaseLayout.astro`, `src/components/SiteNav.astro`,
`src/components/Footer.astro`, `src/components/FollowMe.astro`,
`src/pages/index.astro` (full-bleed + scroll cue),
`src/components/Overworld.astro` (stage height + reticle CSS + scroll cue),
`src/scripts/breach.ts` (reticle sizing only if needed),
`src/pages/works/[slug].astro`, `src/pages/books/[slug].astro`,
`src/pages/about.astro`, `src/components/BookCard.astro`,
`src/components/BuyButton.astro`, `src/components/EmailCapture.astro`,
`src/pages/404.astro`.

Untouched: `src/lib/*` (network, breachNav, works, seo, gm, progress, subscribe),
`src/content/*`, `src/pages/api/subscribe.ts`, `src/data/*`, schema, all tests'
behavior.

Docs: a short note in the `/author-hub` skill that the site uses the unified
cyberpunk token set (palette + where tokens live), so future copy/components stay
on-palette.

## Verification

Largely visual + build-gated, plus targeted checks:
- `npm run build` clean; `npm test` still green (logic untouched).
- No green in shipped CSS: grep dist for `#1bd96a` (and the literal green hexes)
  returns nothing.
- Home stage is full-screen: the stage element uses a viewport-height rule.
- Reticle: the cursor element no longer renders as a filled diamond over the node
  (corner-bracket styling present; z-index below node terminal).
- Reduced-motion media present for grain/scanline/cursor.
- Manual: every page reads as one cyberpunk brand; body copy is readable; nodes
  legible with the reticle; scroll reveals signup + footer.

## Open items

- Exact stage height offset for the nav and the scroll-cue copy to be finalized in
  build against the live nav height.
- Final flavor-line copy for the footer "system status" (GM voice, no em dashes).
