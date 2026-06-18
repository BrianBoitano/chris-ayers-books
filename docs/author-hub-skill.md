---
name: author-hub
description: Build on and maintain the chrisayersbooks.com author hub (Astro 5 on Vercel). Use for ANY change -- adding a work or series, adding books, flipping status, updating GM lines, registering easter eggs, copy/SEO edits, or fixing bugs. Knows the full content schema, the deploy flow, the constraints, and how to verify on production.
---

# chrisayersbooks.com -- full maintenance and build guide

Author hub for **Christopher Ayers** (real-name brand, not a "The Broadcast" property).
Static Astro 5 site on Vercel. Worlds catalog, per-world book listings, email list capture, GM commentary, easter eggs.

## Coordinates
- **Local repo:** `~/chris-ayers-books` (branch `master`). ALWAYS use full path `/home/boitano/chris-ayers-books` in commands -- the shell cwd resets between calls.
- **GitHub:** `github.com/BrianBoitano/chris-ayers-books`. Pushing to `master` auto-deploys on Vercel (~60-90s).
- **Live:** https://chrisayersbooks.com
- **Vercel scope:** christopher-projects4 (Hobby). Domain registered through Vercel (or pointed from registrar).

## Golden workflow (do this for EVERY change)
1. Edit the relevant file(s) in `/home/boitano/chris-ayers-books`.
2. `cd /home/boitano/chris-ayers-books && npm run build` -- MUST succeed. Astro validates content frontmatter at build; a bad markdown file fails the build entirely.
3. `npm test` if you touched `src/lib/` logic -- keep Vitest tests green.
4. Commit and push over SSH:
   ```bash
   cd /home/boitano/chris-ayers-books
   git add -A && git commit -m "<msg>"
   GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519" git push origin master
   ```
5. **Verify on production** -- poll the live URL until the change appears (do not claim done before this):
   ```bash
   curl -s -L "https://chrisayersbooks.com/<path>?_=$RANDOM" \
     -H 'Cache-Control: no-cache' | grep -i "<expected string>"
   ```
   For a new work tile, grep the slug or title on the homepage. For a new book page, fetch `/works/<slug>` or `/books/<slug>`.

## Critical gotchas
- **SSH remote rewrite:** a global git rule may rewrite `git@github.com:` to HTTPS, which fails. Always push with `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519"`. Key is on the BrianBoitano GitHub account.
- **Locked and external works have NO internal page.** `getStaticPaths` in `src/pages/works/[slug].astro` explicitly filters them out: `filter((w) => !isExternal(...) && w.data.status !== 'locked')`. If you add a locked work or a work with `externalUrl`, NO `/works/<slug>` page is generated. That is correct behavior.
- **Cover images resolve by basename.** `BookCard.astro` uses `import.meta.glob('../assets/covers/*.{jpg,jpeg,png,webp}', { eager: true })` and matches by filename only (`path.endsWith('/' + cover)`). Drop covers at `src/assets/covers/<filename>` and set the `cover` field to the bare filename (e.g., `my-book.jpg`).
- **KDP ebook covers are 1600x2560 (5:8).** `BookCard.astro` renders at that ratio. Use that exact size.
- **No local preview browser** in this environment. Verify via build output + production polling, or ask Chris to check the live URL.

## The overworld home page

The site home page is a neon-noir NETWORK overworld (Cyberpunk-2077 aesthetic). Every work in the `works` collection automatically appears as a breach-able network node. Nodes are auto-placed by a network layout algorithm using `order` as the seed -- lower `order` values tend to cluster toward the top-left. No manual positioning is required; just add the work file and it appears.

**Art-directing a node's position:** Add the optional `position` field to the work's frontmatter. Values are in 0..100 viewBox units on each axis (0,0 = top-left corner of the map, 100,100 = bottom-right). Omit it to let the network layout decide.

**Locked nodes** (status: `locked`) render as ICE-locked teasers. They are non-enterable: no internal page is generated and no link fires. They exist to taunt.

**External nodes** (`externalUrl` set) link out to the external URL in a new tab. No internal page is generated.

## Content schema (source of truth: `src/content/schema.ts`)

### Work frontmatter (`src/content/works/<slug>.md`)
```
title: string                      # Display name of the series or standalone
type: series | standalone
status: live | coming-soon | locked
tagline: string                    # One-liner, shown on tile and in meta
cover: string (optional)           # Bare filename in src/assets/covers/
accentColor: string                # Hex color, e.g. "#39d0d8"
genre: string (optional)           # e.g. "LitRPG / system-apocalypse satire"
order: number (int)                # Node sort order; also seeds auto-placement in the overworld
externalUrl: string (url, optional) # When set: tile links OUT; NO internal page generated
gmQuips: string[] (optional)       # Per-world sarcastic GM lines (voice rules below)
position: { x: number, y: number } (optional)  # Art-direct node placement, 0..100 viewBox units each axis
```
Body = markdown blurb shown on the internal work page (if one exists).

### Book frontmatter (`src/content/books/<slug>.md`)
```
title: string
work: string                       # Parent work slug (must match a works/<slug>.md basename)
order: number (int)                # Sort order within the series
cover: string (optional)           # Bare filename in src/assets/covers/
amazonUrl: string (url, optional)
paperbackUrl: string (url, optional)
audiobookUrl: string (url, optional)
audioSampleUrl: string (optional)  # URL to an audio sample file
```
Body = markdown blurb shown on the book's detail page.

---

## Common tasks

### ADD A WORK (hosted series -- gets an internal page)

Create `src/content/works/<slug>.md`. The work automatically appears as a network node on the overworld home page, auto-placed by the network layout using `order`. To art-direct a specific position, add the optional `position` field (0..100 viewBox units; omit to let the layout decide).

Example for a hosted series without position override:

```markdown
---
title: The Signal Archive
type: series
status: coming-soon
tagline: Static was never just noise.
accentColor: "#c86000"
genre: Sci-fi thriller
order: 3
gmQuips:
  - "Oh great, another mystery box. At least this one has good lighting."
  - "You read the tagline. You are already in too deep."
---

A radio analyst discovers the interference pattern has been talking back.
The archive opens one frequency at a time.
```

With a position override (places the node at roughly center-right of the map):

```markdown
---
title: The Signal Archive
type: series
status: coming-soon
tagline: Static was never just noise.
accentColor: "#c86000"
genre: Sci-fi thriller
order: 3
position:
  x: 70
  y: 45
gmQuips:
  - "Oh great, another mystery box. At least this one has good lighting."
  - "You read the tagline. You are already in too deep."
---

A radio analyst discovers the interference pattern has been talking back.
The archive opens one frequency at a time.
```

### ADD A WORK (external -- links out to another site, NO internal page)

An external work still appears as a network node on the overworld. Clicking it opens the `externalUrl` in a new tab. No `/works/<slug>` page is generated.

```markdown
---
title: The Broadcast
type: series
status: live
tagline: Laugh first. Pay later.
accentColor: "#39d0d8"
genre: LitRPG / system-apocalypse satire
order: 1
externalUrl: https://thebroadcastseries.com
gmQuips:
  - "Oh, this one already has its own building. Fancy. Go on, I will wait."
  - "Six books, a prequel, audiobooks. Overachiever. Door is that way."
---

Three siblings get cast in an alien streaming platform's deadliest reality show.
Start the series on its own site.
```

The node renders an "Enter -> own site" label and opens `_blank`. No `/works/the-broadcast` page is created. The optional `position` override works here too.

### ADD BOOKS to a hosted series

Create `src/content/books/<slug>.md`. The `work` field must match the parent work's slug exactly.

```markdown
---
title: Static
work: the-signal-archive
order: 1
cover: static-book-1.jpg
amazonUrl: https://www.amazon.com/dp/XXXXXXXXXX
---

Before the signals were music, they were warnings.
Book one of The Signal Archive.
```

Drop the cover image at `src/assets/covers/static-book-1.jpg` (1600x2560, JPG). The build will optimise it automatically.

### FLIP STATUS

One-field edit in the work's frontmatter:

```
status: locked        # non-clickable teaser tile, NO internal page
status: coming-soon   # clickable tile, internal page exists, no buy links yet
status: live          # fully live, show buy links, appears in sitemap
```

`locked` -> `coming-soon`: the tile becomes clickable and a `/works/<slug>` page is created. Verify the new URL appears in `sitemap-index.xml` after deploy.

`coming-soon` -> `live`: update the work AND add `amazonUrl` / `paperbackUrl` to individual books as they launch.

### ADD A GM LINE (global pool)

Edit `src/data/gmLines.ts`. Valid context keys (defined in `src/lib/gm.ts`):

| Context | When it fires |
|---|---|
| `greeting` | Page load |
| `tileHover` | Hovering a world tile |
| `lockedTile` | Hovering a locked tile |
| `idle` | User is inactive |
| `eggFound` | Easter egg discovered |
| `signup` | Email signup success |
| `notFound` | 404 page |

Add a string to the relevant array. Example -- new idle line:

```ts
idle: [
  "Still here? Me too. Neither of us has anywhere to be.",
  "I can hear you not clicking.",
  "The worlds are not going anywhere. Neither, apparently, are you.",  // new
],
```

Voice rules: sarcastic, dry, slightly exasperated -- NEVER mean or dismissive of the reader.
No DCC references. No em dashes.

Alternatively, add `gmQuips` directly to a work's frontmatter (see schema above) for world-specific lines. These are separate from the global `GM_LINES` pools; wire them into the component that reads the work's data.

### ADD AN EASTER EGG

Two steps:

**Step 1 -- Register it in `src/data/eggs.ts`:**
```ts
export const EGGS: Egg[] = [
  { id: 'wordmark', selector: '[data-egg="wordmark"]' },
  { id: 'my-new-egg', selector: '[data-egg="my-new-egg"]' },  // new
];
```

**Step 2 -- Place the trigger element** somewhere in a component or page:
```html
<span data-egg="my-new-egg" style="opacity:0; pointer-events:none;" aria-hidden="true">
  <!-- invisible trigger; the HUD click handler detects it -->
</span>
```

Or make it a discoverable element (a subtle icon, a tooltip, a hidden link). When a visitor clicks/activates the element, the Overworld HUD awards XP via the progression state and fires a `gm:say 'eggFound'` event, which plays a random line from the `eggFound` pool in `gmLines.ts`.

Build and verify: after deploy, interact with the trigger element on the live site and confirm the HUD reacts.

### FLIP A BOOK LIVE ON AMAZON

In `src/content/books/<slug>.md`, add:
```
amazonUrl: https://www.amazon.com/dp/XXXXXXXXXX
```

Optionally add `paperbackUrl` and `audiobookUrl` at the same time. The BuyButton component renders each link automatically when the field is present.

### EMAIL LIST

`/api/subscribe` (serverless, `prerender = false`) stores emails to Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in the Vercel project environment variables. When the env vars are absent, the endpoint degrades to disabled (no error to the user, no storage).

CSV export is gated by `SUBSCRIBE_ADMIN_TOKEN`. Set it in Vercel env, then call the export endpoint with that token.

### CHANGE COPY OR SEO

- Site name, URL, tagline, author name: `src/config.ts` (if it exists) or the relevant layout/BaseHead.
- Page titles: `BaseLayout.astro` / `BaseHead.astro`. No em dashes in any page title or aria-label.
- JSON-LD structured data: `src/lib/seo.ts` (`bookLd`, `worksLd`).
- robots.txt / sitemap: generated by `@astrojs/sitemap`. Locked and external works are excluded automatically.

---

## Global constraints (enforce on every change)

1. **NO Dungeon Crawler Carl / DCC references** anywhere -- not in copy, blurbs, GM lines, or comments. The Broadcast is comp'd to The Truman Show / Succession / system-apocalypse satire.
2. **NO em dashes** in any reader-facing copy: page titles, aria-labels, blurbs, GM lines. Use a comma, a colon, or a period instead.
3. **Real-name author brand**: this is a Christopher Ayers author hub, not a The Broadcast property. Do not bleed Broadcast in-world theming into the hub's own chrome.
4. **GM voice**: sarcastic and dry, never mean, never dismissive of readers. The GM is bored, not hostile.
5. **Covers**: KDP ebook ratio 1600x2560 (5:8) only. Drop at `src/assets/covers/` and reference by bare filename.
6. **Astro build must pass before every push.** A frontmatter validation error will break the entire build.

---

## First-time setup
```bash
cd /home/boitano/chris-ayers-books
npm install
npm test       # all green
npm run build  # dist/ created, no errors
```

## File map (quick reference)
- `src/content/schema.ts` -- Zod schemas for `works` and `books` (includes `position` field)
- `src/content/works/*.md` -- one file per world/series; each auto-appears as an overworld node
- `src/content/books/*.md` -- one file per book
- `src/assets/covers/` -- cover images (resolved by basename in BookCard)
- `src/data/gmLines.ts` -- global GM line pools, keyed by `GmContext`
- `src/lib/gm.ts` -- `GmContext` type, `pickLine`, `randomLine`
- `src/data/eggs.ts` -- easter egg registry `{id, selector}[]`
- `src/components/Overworld.astro` -- renders the home page neon-noir network map; each world/series is a node (external = link out; locked = ICE-locked div, no href)
- `src/components/BookCard.astro` -- renders one book card, cover resolved by glob
- `src/pages/index.astro` -- home page; renders the neon-noir overworld network map
- `src/pages/works/[slug].astro` -- internal work page (excludes external + locked)
- `src/pages/books/[slug].astro` -- book detail page with BuyButtons
- `src/pages/api/subscribe.ts` -- email list endpoint (Upstash Redis)
