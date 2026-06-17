# Author Hub Site (chrisayersbooks.com) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scalable, playful author-brand website that houses all of Chris Ayers' adult fiction, with a "Choose Your World" game frame and a sarcastic Game Master persona, where adding any future series or standalone is a drop-in content edit.

**Architecture:** Astro 5 static site on Vercel. All works live in a single `works` content collection (one entry per series or standalone) plus a nested `books` collection for hosted series; the home page renders work "tiles" from that data. The playful layer (GM persona, progression HUD, easter eggs) is data-driven chrome that never scales with the number of books. The Broadcast is a `works` entry with an `externalUrl` that links out to its existing site.

**Tech Stack:** Astro 5, `@astrojs/vercel`, `@astrojs/sitemap`, `@fontsource/archivo`, TypeScript, Zod (via `astro:content`), Vitest. Reuse patterns copied (not shared) from `~/broadcast-site`.

## Global Constraints

- Astro `output: 'static'`, adapter `@astrojs/vercel`, integration `@astrojs/sitemap`. (Astro ^5, adapter ^8, sitemap ^3.)
- Vitest `environment: 'node'`. Unit tests cover `src/lib/*` and the content schema only; Astro pages/components are verified by a passing `astro build`.
- `site` in astro.config = `https://chrisayersbooks.com`.
- Brand: real name, Christopher Ayers. Author hub, NOT a Broadcast property.
- NO Dungeon Crawler Carl / "DCC" / Dinniman references anywhere (locked brand rule, applies to all of Chris's book properties). Do not copy `broadcast-site`'s `for-fans-of-dungeon-crawler-carl.astro`.
- No em dashes in reader-facing copy (use commas or restructure).
- GM voice is snarky but never mean.
- Reused files are COPIED from `~/broadcast-site` and adapted, never imported across repos.
- Commit after every task. Repo: `~/chris-ayers-books` (remote `origin` = github.com/BrianBoitano/chris-ayers-books).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/config.ts`
- Test: `tests/config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/config.ts` exporting `SITE_NAME: string`, `SITE_URL: string`, `SITE_TAGLINE: string`, `AUTHOR_NAME: string`, `AUTHOR_AMAZON_URL: string`, `SUPPORT_URL: string`, `FollowLink` interface `{ label: string; url: string; glyph: string }`, and `FOLLOW_LINKS: FollowLink[]`.

- [ ] **Step 1: Write `tests/config.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { SITE_URL, SITE_NAME, AUTHOR_NAME, FOLLOW_LINKS } from '../src/config';

describe('site config', () => {
  it('points at the hub domain', () => {
    expect(SITE_URL).toBe('https://chrisayersbooks.com');
  });
  it('is the author brand, not a series', () => {
    expect(SITE_NAME).toBe('Chris Ayers');
    expect(AUTHOR_NAME).toBe('Christopher Ayers');
  });
  it('every follow link has label, url, glyph', () => {
    expect(FOLLOW_LINKS.length).toBeGreaterThan(0);
    for (const l of FOLLOW_LINKS) {
      expect(typeof l.label).toBe('string');
      expect(l.url).toMatch(/^https?:\/\//);
      expect(typeof l.glyph).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "chris-ayers-books",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/vercel": "^8.0.0",
    "@astrojs/sitemap": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "@fontsource/archivo": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chrisayersbooks.com',
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [sitemap()],
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
.DS_Store
.env
.env.*
```

- [ ] **Step 7: Create `src/config.ts`**

```ts
export const SITE_NAME = 'Chris Ayers';
export const SITE_URL = 'https://chrisayersbooks.com';
export const SITE_TAGLINE = 'Stories from a dangerously overclocked imagination.';
export const AUTHOR_NAME = 'Christopher Ayers';

// Amazon Author Central page. Set to '' to hide author-page links.
export const AUTHOR_AMAZON_URL =
  'https://www.amazon.com/stores/Christopher-Ayers/author/B0H594PG8S';

// Support / tip link. Set to '' to hide.
export const SUPPORT_URL = 'https://buymeacoffee.com/brianboitat';

export interface FollowLink {
  label: string;
  url: string;
  glyph: string;
}
export const FOLLOW_LINKS: FollowLink[] = [
  { label: 'Amazon Author Page', url: AUTHOR_AMAZON_URL, glyph: '▶' },
  { label: 'Buy Me a Coffee', url: SUPPORT_URL, glyph: '☕' },
];
```

- [ ] **Step 8: Install and verify test passes**

Run: `cd ~/chris-ayers-books && npm install && npm test`
Expected: `tests/config.test.ts` PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore src/config.ts tests/config.test.ts package-lock.json
git commit -m "chore: scaffold Astro project + site config"
```

---

### Task 2: Base layout, design tokens, and chrome

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/components/BaseHead.astro`
- Create: `src/components/SiteNav.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/FollowMe.astro`
- Create: `src/layouts/BaseLayout.astro`
- Create: `public/favicon.svg`, `public/robots.txt`
- Create: `src/pages/index.astro` (temporary placeholder, replaced in Task 4)

**Interfaces:**
- Consumes: `src/config.ts` (`SITE_URL`, `SITE_NAME`, `FOLLOW_LINKS`).
- Produces: `BaseLayout` Astro component with `Props { title: string; description: string; image?: string; jsonLd?: object; type?: string }`, rendering nav, a `<main id="main-content">` slot, footer, and the floating follow widget.

- [ ] **Step 1: Copy the styling + chrome baseline from broadcast-site**

```bash
cd ~/chris-ayers-books
cp ~/broadcast-site/src/styles/tokens.css src/styles/tokens.css
cp ~/broadcast-site/src/styles/global.css src/styles/global.css
cp ~/broadcast-site/public/favicon.svg public/favicon.svg
cp ~/broadcast-site/public/robots.txt public/robots.txt
cp ~/broadcast-site/src/components/SiteNav.astro src/components/SiteNav.astro
cp ~/broadcast-site/src/components/Footer.astro src/components/Footer.astro
cp ~/broadcast-site/src/components/FollowMe.astro src/components/FollowMe.astro
```

- [ ] **Step 2: Create `src/components/BaseHead.astro`**

Use this exact file (adapted from broadcast-site: the Broadcast-specific Search Console verification meta is removed; add your own later once chrisayersbooks.com is verified):

```astro
---
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/700.css';
import { SITE_URL, SITE_NAME } from '../config';

interface Props {
  title: string;
  description: string;
  image?: string;
  jsonLd?: object;
  type?: string;
}

const { title, description, image, jsonLd, type = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, SITE_URL).href;
---

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta name="theme-color" content="#07090c" />

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<meta property="og:type" content={type} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content={SITE_NAME} />
{image && <meta property="og:image" content={image} />}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{image && <meta name="twitter:image" content={image} />}

{jsonLd && (
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
)}
```

- [ ] **Step 3: Create `src/layouts/BaseLayout.astro`**

This drops the Broadcast-specific GregEgg (the hub gets its own egg system in Task 6). Easter-egg mount is added in Task 6.

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';
import BaseHead from '../components/BaseHead.astro';
import SiteNav from '../components/SiteNav.astro';
import Footer from '../components/Footer.astro';
import FollowMe from '../components/FollowMe.astro';

interface Props {
  title: string;
  description: string;
  image?: string;
  jsonLd?: object;
  type?: string;
}

const { title, description, image, jsonLd, type } = Astro.props;
---

<html lang="en">
  <head>
    <BaseHead title={title} description={description} image={image} jsonLd={jsonLd} type={type} />
  </head>
  <body>
    <div class="scanlines" aria-hidden="true"></div>
    <SiteNav />
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
    <Footer />
    <FollowMe />
  </body>
</html>
```

- [ ] **Step 4: Edit `src/components/SiteNav.astro` and `Footer.astro` for the hub**

Open each copied file. Replace any Broadcast-specific link labels/links (e.g. "Reading Order", "Ratings", "Play") and the site title with hub-appropriate ones: brand wordmark linking to `/`, plus `Works` (`/#worlds`), `About` (`/about`). Remove any link to ratings/play/reading-order pages that will not exist. Remove any literal "The Broadcast" wordmark; use `SITE_NAME`. Confirm no DCC references remain in either file.

- [ ] **Step 5: Create a temporary `src/pages/index.astro` so the build has an entry**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE_NAME, SITE_TAGLINE } from '../config';
---
<BaseLayout title={SITE_NAME} description={SITE_TAGLINE}>
  <section style="padding:4rem 1rem;text-align:center">
    <h1>{SITE_NAME}</h1>
    <p>{SITE_TAGLINE}</p>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Build to verify chrome compiles**

Run: `npm run build`
Expected: build succeeds, `dist/index.html` produced. If SiteNav/Footer reference removed routes, the build/typecheck surfaces it; fix per Step 4.

- [ ] **Step 7: Commit**

```bash
git add src/ public/
git commit -m "feat: base layout, tokens, and site chrome adapted for the hub"
```

---

### Task 3: Content collections (`works` + `books`) and seed content

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/config.ts`
- Create: `src/content/works/the-broadcast.md`
- Create: `src/content/works/untitled-next.md`
- Create: `src/content/books/.gitkeep`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `workSchema` (Zod) and `bookSchema` (Zod) exported from `src/content/schema.ts`.
  - `works` collection entries with fields: `title: string`, `type: 'series' | 'standalone'`, `status: 'live' | 'coming-soon' | 'locked'`, `tagline: string`, `cover?: string`, `accentColor: string` (hex), `genre?: string`, `order: number`, `externalUrl?: string (url)`, `gmQuips?: string[]`. Body markdown = the blurb.
  - `books` collection entries: `title: string`, `work: string` (parent work slug), `order: number`, `cover?: string`, `amazonUrl?: string (url)`, `paperbackUrl?: string (url)`, `audiobookUrl?: string (url)`, `audioSampleUrl?: string`. Body markdown = the blurb.

- [ ] **Step 1: Write `tests/content-schema.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { workSchema, bookSchema } from '../src/content/schema';

describe('workSchema', () => {
  it('accepts a hosted series', () => {
    const r = workSchema.safeParse({
      title: 'Some Series', type: 'series', status: 'coming-soon',
      tagline: 'A thing happens.', accentColor: '#ff0066', order: 2,
    });
    expect(r.success).toBe(true);
  });
  it('accepts an external work with a url', () => {
    const r = workSchema.safeParse({
      title: 'The Broadcast', type: 'series', status: 'live',
      tagline: 'Laugh first. Pay later.', accentColor: '#39d0d8', order: 1,
      externalUrl: 'https://thebroadcastseries.com',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a bad status', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'published',
      tagline: 't', accentColor: '#fff', order: 1,
    });
    expect(r.success).toBe(false);
  });
  it('rejects a non-url externalUrl', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1, externalUrl: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });
});

describe('bookSchema', () => {
  it('links to a parent work', () => {
    const r = bookSchema.safeParse({
      title: 'Book One', work: 'some-series', order: 1,
      amazonUrl: 'https://amazon.com/dp/x',
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- content-schema`
Expected: FAIL, cannot import `workSchema`/`bookSchema`.

- [ ] **Step 3: Install zod and create `src/content/schema.ts`**

Import `z` from `zod` directly (not `astro:content`) so the schema is unit-testable under Vitest's node environment, which cannot resolve the `astro:content` virtual module. This matches broadcast-site's `schema.ts`.

Run: `npm install zod`

```ts
import { z } from 'zod';

export const workSchema = z.object({
  title: z.string(),
  type: z.enum(['series', 'standalone']),
  status: z.enum(['live', 'coming-soon', 'locked']),
  tagline: z.string(),
  cover: z.string().optional(),
  accentColor: z.string(),
  genre: z.string().optional(),
  order: z.number().int(),
  // When set, the world tile links OUT to this URL instead of an internal page.
  externalUrl: z.string().url().optional(),
  // Sarcastic Game Master lines specific to this world.
  gmQuips: z.array(z.string()).optional(),
});

export const bookSchema = z.object({
  title: z.string(),
  work: z.string(), // parent work slug
  order: z.number().int(),
  cover: z.string().optional(),
  amazonUrl: z.string().url().optional(),
  paperbackUrl: z.string().url().optional(),
  audiobookUrl: z.string().url().optional(),
  audioSampleUrl: z.string().optional(),
});

export type Work = z.infer<typeof workSchema>;
export type Book = z.infer<typeof bookSchema>;
```

Note: the test imports `z` from `astro:content` indirectly via this module. Vitest cannot resolve `astro:content`. To keep the schema unit-testable, import `zod` directly here instead:

Replace the first line with:

```ts
import { z } from 'zod';
```

- [ ] **Step 4: Create `src/content/config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { workSchema, bookSchema } from './schema';

export const collections = {
  works: defineCollection({ type: 'content', schema: workSchema }),
  books: defineCollection({ type: 'content', schema: bookSchema }),
};
```

- [ ] **Step 5: Seed `src/content/works/the-broadcast.md` (external, links out)**

```md
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
  - "Oh, this one already has its own building. Fancy. Go on, I'll wait."
  - "Six books, a prequel, audiobooks. Overachiever. Door's that way."
---

Three siblings get cast in an alien streaming platform's deadliest reality show.
The catch: the platform is the apocalypse, and the only way off the leaderboard
is to win. Start the series on its own site.
```

- [ ] **Step 6: Seed `src/content/works/untitled-next.md` (a locked teaser)**

```md
---
title: Something New
type: series
status: locked
tagline: Currently being argued about in Chris's head.
accentColor: "#b56cff"
genre: Adult fiction
order: 2
gmQuips:
  - "Locked. Like the author's focus. Check back."
  - "You can rattle the handle all you want. It's not ready."
---

A new world is loading. No spoilers yet, because half of it does not exist.
Join the list and you will be the first one let in.
```

- [ ] **Step 7: Create `src/content/books/.gitkeep`** (empty file; hosted books arrive with the first hosted series).

- [ ] **Step 8: Verify schema test passes and content compiles**

Run: `npm test -- content-schema && npx astro sync && npm run build`
Expected: schema test PASS; `astro sync` generates types with no schema errors; build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/content tests/content-schema.test.ts package.json package-lock.json
git commit -m "feat: works + books content collections with seed entries"
```

---

### Task 4: World Select home page

**Files:**
- Create: `src/lib/works.ts`
- Create: `src/components/WorldTile.astro`
- Modify: `src/pages/index.astro` (replace placeholder)
- Test: `tests/works.test.ts`

**Interfaces:**
- Consumes: `Work` type from `src/content/schema.ts`.
- Produces: `src/lib/works.ts` exporting:
  - `sortWorks<T extends { data: { order: number } }>(items: T[]): T[]` — ascending by `order`.
  - `worldHref(w: { slug: string; data: { externalUrl?: string; status: string } }): string | null` — returns `externalUrl` if set, else `/works/<slug>` for `live`/`coming-soon`, else `null` for `locked`.
  - `isExternal(w: { data: { externalUrl?: string } }): boolean`.

- [ ] **Step 1: Write `tests/works.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { sortWorks, worldHref, isExternal } from '../src/lib/works';

const mk = (slug: string, order: number, extra = {}) =>
  ({ slug, data: { order, status: 'live', ...extra } } as any);

describe('sortWorks', () => {
  it('orders ascending by order', () => {
    const out = sortWorks([mk('b', 2), mk('a', 1)]);
    expect(out.map((w) => w.slug)).toEqual(['a', 'b']);
  });
});

describe('worldHref', () => {
  it('returns externalUrl when present', () => {
    expect(worldHref(mk('x', 1, { externalUrl: 'https://e.com' }))).toBe('https://e.com');
  });
  it('returns internal path for hosted live works', () => {
    expect(worldHref(mk('new-series', 1))).toBe('/works/new-series');
  });
  it('returns internal path for coming-soon works', () => {
    expect(worldHref(mk('soon', 1, { status: 'coming-soon' }))).toBe('/works/soon');
  });
  it('returns null for locked works', () => {
    expect(worldHref(mk('locked', 1, { status: 'locked' }))).toBeNull();
  });
});

describe('isExternal', () => {
  it('true only when externalUrl set', () => {
    expect(isExternal(mk('x', 1, { externalUrl: 'https://e.com' }))).toBe(true);
    expect(isExternal(mk('y', 1))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- works`
Expected: FAIL, cannot import from `../src/lib/works`.

- [ ] **Step 3: Create `src/lib/works.ts`**

```ts
export function sortWorks<T extends { data: { order: number } }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.data.order - b.data.order);
}

export function isExternal(w: { data: { externalUrl?: string } }): boolean {
  return typeof w.data.externalUrl === 'string' && w.data.externalUrl.length > 0;
}

export function worldHref(
  w: { slug: string; data: { externalUrl?: string; status: string } }
): string | null {
  if (isExternal(w)) return w.data.externalUrl as string;
  if (w.data.status === 'locked') return null;
  return `/works/${w.slug}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- works`
Expected: PASS (6 assertions).

- [ ] **Step 5: Create `src/components/WorldTile.astro`**

```astro
---
import { worldHref, isExternal } from '../lib/works';
interface Props {
  slug: string;
  data: {
    title: string; tagline: string; status: string;
    accentColor: string; externalUrl?: string; cover?: string;
  };
}
const { slug, data } = Astro.props;
const href = worldHref({ slug, data });
const external = isExternal({ data });
const locked = data.status === 'locked';
const Tag = href ? 'a' : 'div';
---
<Tag
  class:list={['world-tile', { 'is-locked': locked }]}
  href={href ?? undefined}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener' : undefined}
  data-gm-tile={slug}
  style={`--accent:${data.accentColor}`}
>
  <span class="world-status">{data.status.replace('-', ' ')}</span>
  <h3 class="world-title">{data.title}</h3>
  <p class="world-tagline">{data.tagline}</p>
  {external && <span class="world-out">Enter → own site</span>}
  {locked && <span class="world-lock" aria-hidden="true">🔒</span>}
</Tag>
```

Add matching styles to `src/styles/global.css` (tile grid card, `--accent` border/glow, `.is-locked` dimmed). Keep it consistent with existing tokens; no DCC references.

- [ ] **Step 6: Replace `src/pages/index.astro` with the World Select screen**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import WorldTile from '../components/WorldTile.astro';
import { sortWorks } from '../lib/works';
import { SITE_NAME, SITE_TAGLINE } from '../config';

const works = sortWorks(await getCollection('works'));
---
<BaseLayout title={`${SITE_NAME} — Choose Your World`} description={SITE_TAGLINE}>
  <section class="hero-select">
    <p class="gm-line" data-gm="greeting">Oh good, you're back. Pick something this time.</p>
    <h1>Choose Your World</h1>
    <p class="hero-sub">{SITE_TAGLINE}</p>
  </section>
  <section id="worlds" class="world-grid">
    {works.map((w) => <WorldTile slug={w.slug} data={w.data} />)}
  </section>
</BaseLayout>
```

Note: the greeting is a literal here so Task 4 stands alone. Task 5 replaces this `<p class="gm-line">` with `<GmVoice context="greeting" />` once the GM module exists.

- [ ] **Step 7: Build**

Run: `npm test -- works && npm run build`
Expected: tests pass; home page renders both seed tiles (Broadcast links out, "Something New" is locked).

- [ ] **Step 8: Commit**

```bash
git add src/lib/works.ts src/components/WorldTile.astro src/pages/index.astro src/styles/global.css tests/works.test.ts
git commit -m "feat: World Select home page with data-driven world tiles"
```

---

### Task 5: Game Master persona

**Files:**
- Create: `src/lib/gm.ts`
- Create: `src/data/gmLines.ts`
- Create: `src/components/GmVoice.astro`
- Test: `tests/gm.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/lib/gm.ts` exporting:
  - `GmContext = 'greeting' | 'tileHover' | 'lockedTile' | 'idle' | 'eggFound' | 'signup' | 'notFound'`.
  - `pickLine(context: GmContext, index: number): string` — deterministic; returns the line at `index % pool.length`; never throws (empty pool returns `''`).
  - `randomLine(context: GmContext, rnd?: () => number): string` — uses `Math.random` by default.

- [ ] **Step 1: Write `tests/gm.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { pickLine, randomLine } from '../src/lib/gm';
import { GM_LINES } from '../src/data/gmLines';

describe('pickLine', () => {
  it('is deterministic for the same index', () => {
    const a = pickLine('greeting', 0);
    const b = pickLine('greeting', 0);
    expect(a).toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
  });
  it('wraps with modulo of the pool length', () => {
    const len = GM_LINES.greeting.length;
    expect(pickLine('greeting', 0)).toBe(pickLine('greeting', len));
    expect(pickLine('greeting', 1)).toBe(pickLine('greeting', len + 1));
  });
  it('never throws for any context', () => {
    for (const c of ['greeting','tileHover','lockedTile','idle','eggFound','signup','notFound'] as const) {
      expect(typeof pickLine(c, 0)).toBe('string');
    }
  });
});

describe('randomLine', () => {
  it('uses the injected rng', () => {
    const line = randomLine('greeting', () => 0);
    expect(line).toBe(pickLine('greeting', 0));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gm`
Expected: FAIL, cannot import `pickLine`.

- [ ] **Step 3: Create `src/data/gmLines.ts`**

```ts
import type { GmContext } from '../lib/gm';

// Sarcastic, never mean. No DCC references. No em dashes.
export const GM_LINES: Record<GmContext, string[]> = {
  greeting: [
    "Oh good, you're back. Pick something this time.",
    "Welcome to the catalog. Try not to break anything.",
    "Choose a world. I have been bored for exactly forever.",
  ],
  tileHover: [
    "Bold choice. Hovering. Truly the height of commitment.",
    "Click it. I dare you. I literally cannot stop you.",
  ],
  lockedTile: [
    "Locked. Like the author's sleep schedule. Check back.",
    "You can rattle the handle all you want. Not ready.",
  ],
  idle: [
    "Still here? Me too. Neither of us has anywhere to be.",
    "I can hear you not clicking.",
  ],
  eggFound: [
    "An easter egg. Congratulations, you are now legally a detective.",
    "You found a secret. Don't let it go to your head.",
  ],
  signup: [
    "You joined the list. The newsletter equivalent of choosing the good ending.",
    "Welcome to the party. There are no snacks, only books.",
  ],
  notFound: [
    "This page does not exist. Neither does my patience. 404.",
    "You broke the map. Impressive. Go home.",
  ],
};
```

- [ ] **Step 4: Create `src/lib/gm.ts`**

```ts
import { GM_LINES } from '../data/gmLines';

export type GmContext =
  | 'greeting' | 'tileHover' | 'lockedTile' | 'idle' | 'eggFound' | 'signup' | 'notFound';

export function pickLine(context: GmContext, index: number): string {
  const pool = GM_LINES[context] ?? [];
  if (pool.length === 0) return '';
  const i = ((index % pool.length) + pool.length) % pool.length;
  return pool[i];
}

export function randomLine(context: GmContext, rnd: () => number = Math.random): string {
  const pool = GM_LINES[context] ?? [];
  if (pool.length === 0) return '';
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- gm`
Expected: PASS.

- [ ] **Step 6: Create `src/components/GmVoice.astro`** (renders a line + a client script that rotates lines on idle and reacts to `gm:say` events)

```astro
---
import { pickLine } from '../lib/gm';
interface Props { context?: string; }
const { context = 'greeting' } = Astro.props;
const initial = pickLine(context as any, 0);
---
<p class="gm-line" data-gm-voice data-gm-context={context}>{initial}</p>
<script>
  import { randomLine } from '../lib/gm';
  const el = document.querySelector('[data-gm-voice]') as HTMLElement | null;
  if (el) {
    const ctx = (el.dataset.gmContext || 'idle') as any;
    let timer = window.setInterval(() => { el.textContent = randomLine('idle'); }, 12000);
    document.addEventListener('gm:say', (e: any) => {
      el.textContent = randomLine(e.detail?.context || ctx);
    });
  }
</script>
```

If Task 4 inlined a literal greeting, swap it to use `<GmVoice context="greeting" />` now and re-run `npm run build`.

- [ ] **Step 7: Build**

Run: `npm test -- gm && npm run build`
Expected: tests pass, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/gm.ts src/data/gmLines.ts src/components/GmVoice.astro src/pages/index.astro tests/gm.test.ts
git commit -m "feat: Game Master persona (data-driven sarcastic narrator)"
```

---

### Task 6: Progression HUD + easter egg registry

**Files:**
- Create: `src/lib/progress.ts`
- Create: `src/data/eggs.ts`
- Create: `src/components/ProgressHud.astro`
- Modify: `src/layouts/BaseLayout.astro` (mount the HUD)
- Test: `tests/progress.test.ts`

**Interfaces:**
- Consumes: nothing (pure logic; localStorage accessed only in the component).
- Produces: `src/lib/progress.ts` exporting:
  - `Progress = { xp: number; visited: string[]; eggs: string[]; achievements: string[] }`.
  - `defaultProgress(): Progress`.
  - `normalize(raw: unknown): Progress` — merges partial/old saves over defaults.
  - `visitWorld(p: Progress, slug: string): Progress` — adds slug if new, +10 xp, pure (returns new object).
  - `findEgg(p: Progress, id: string): Progress` — adds egg if new, +25 xp, pure.
  - `SAVE_KEY = 'hub.progress.v1'`.

- [ ] **Step 1: Write `tests/progress.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { defaultProgress, normalize, visitWorld, findEgg } from '../src/lib/progress';

describe('defaultProgress', () => {
  it('starts empty', () => {
    const p = defaultProgress();
    expect(p).toEqual({ xp: 0, visited: [], eggs: [], achievements: [] });
  });
});

describe('normalize', () => {
  it('fills missing fields from defaults', () => {
    expect(normalize({ xp: 5 })).toEqual({ xp: 5, visited: [], eggs: [], achievements: [] });
  });
  it('handles junk', () => {
    expect(normalize(null)).toEqual(defaultProgress());
    expect(normalize('nope')).toEqual(defaultProgress());
  });
});

describe('visitWorld', () => {
  it('adds a new world and awards xp', () => {
    const p = visitWorld(defaultProgress(), 'the-broadcast');
    expect(p.visited).toEqual(['the-broadcast']);
    expect(p.xp).toBe(10);
  });
  it('is idempotent for repeat visits', () => {
    const once = visitWorld(defaultProgress(), 'x');
    const twice = visitWorld(once, 'x');
    expect(twice.visited).toEqual(['x']);
    expect(twice.xp).toBe(10);
  });
  it('does not mutate input', () => {
    const base = defaultProgress();
    visitWorld(base, 'x');
    expect(base.visited).toEqual([]);
  });
});

describe('findEgg', () => {
  it('adds a new egg and awards xp', () => {
    const p = findEgg(defaultProgress(), 'greg');
    expect(p.eggs).toEqual(['greg']);
    expect(p.xp).toBe(25);
  });
  it('is idempotent', () => {
    const once = findEgg(defaultProgress(), 'greg');
    expect(findEgg(once, 'greg').xp).toBe(25);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- progress`
Expected: FAIL, cannot import from `../src/lib/progress`.

- [ ] **Step 3: Create `src/lib/progress.ts`**

```ts
export interface Progress {
  xp: number;
  visited: string[];
  eggs: string[];
  achievements: string[];
}

export const SAVE_KEY = 'hub.progress.v1';

export function defaultProgress(): Progress {
  return { xp: 0, visited: [], eggs: [], achievements: [] };
}

export function normalize(raw: unknown): Progress {
  const d = defaultProgress();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Progress>;
  return {
    xp: typeof r.xp === 'number' && Number.isFinite(r.xp) ? r.xp : 0,
    visited: Array.isArray(r.visited) ? r.visited.slice() : [],
    eggs: Array.isArray(r.eggs) ? r.eggs.slice() : [],
    achievements: Array.isArray(r.achievements) ? r.achievements.slice() : [],
  };
}

export function visitWorld(p: Progress, slug: string): Progress {
  if (p.visited.includes(slug)) return p;
  return { ...p, visited: [...p.visited, slug], xp: p.xp + 10 };
}

export function findEgg(p: Progress, id: string): Progress {
  if (p.eggs.includes(id)) return p;
  return { ...p, eggs: [...p.eggs, id], xp: p.xp + 25 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- progress`
Expected: PASS.

- [ ] **Step 5: Create `src/data/eggs.ts`** (the data-driven egg registry; add an egg by adding an entry)

```ts
export interface Egg {
  id: string;
  // CSS selector for the hidden trigger element placed somewhere in the site.
  selector: string;
  // GM reaction context fired when found.
}
export const EGGS: Egg[] = [
  { id: 'wordmark', selector: '[data-egg="wordmark"]' },
];
```

- [ ] **Step 6: Create `src/components/ProgressHud.astro`** (reads/writes localStorage, wires eggs + world visits + GM reactions)

```astro
---
---
<aside class="progress-hud" aria-label="Your progress" data-progress-hud>
  <span class="hud-xp">XP <b data-hud-xp>0</b></span>
  <span class="hud-eggs">Secrets <b data-hud-eggs>0</b></span>
</aside>
<script>
  import { SAVE_KEY, normalize, visitWorld, findEgg } from '../lib/progress';
  import { EGGS } from '../data/eggs';

  const load = () => {
    try { return normalize(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); }
    catch { return normalize(null); }
  };
  const save = (p: any) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch {} };

  let p = load();
  const render = () => {
    const xp = document.querySelector('[data-hud-xp]');
    const eg = document.querySelector('[data-hud-eggs]');
    if (xp) xp.textContent = String(p.xp);
    if (eg) eg.textContent = String(p.eggs.length);
  };
  const say = (context: string) => document.dispatchEvent(new CustomEvent('gm:say', { detail: { context } }));

  // Count a world visit when a tile is opened.
  document.querySelectorAll('[data-gm-tile]').forEach((el) => {
    el.addEventListener('click', () => {
      const slug = (el as HTMLElement).dataset.gmTile!;
      const next = visitWorld(p, slug);
      if (next !== p) { p = next; save(p); render(); }
    });
  });

  // Wire easter eggs from the registry.
  for (const egg of EGGS) {
    const t = document.querySelector(egg.selector);
    if (t) t.addEventListener('click', () => {
      const next = findEgg(p, egg.id);
      if (next !== p) { p = next; save(p); render(); say('eggFound'); }
    });
  }

  render();
</script>
```

- [ ] **Step 7: Mount the HUD in `src/layouts/BaseLayout.astro`**

Add the import and place `<ProgressHud />` just before `<FollowMe />`:

```astro
import ProgressHud from '../components/ProgressHud.astro';
```
```astro
    <ProgressHud />
    <FollowMe />
```

Add `data-egg="wordmark"` to the brand wordmark element in `SiteNav.astro` so the first easter egg has a trigger.

- [ ] **Step 8: Build**

Run: `npm test -- progress && npm run build`
Expected: tests pass, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/lib/progress.ts src/data/eggs.ts src/components/ProgressHud.astro src/layouts/BaseLayout.astro src/components/SiteNav.astro tests/progress.test.ts
git commit -m "feat: client-side progression HUD + easter egg registry"
```

---

### Task 7: Work and book pages

**Files:**
- Create: `src/lib/seo.ts`
- Create: `src/pages/works/[slug].astro`
- Create: `src/pages/books/[slug].astro`
- Create: `src/components/BookCard.astro`
- Create: `src/components/BuyButton.astro`
- Test: `tests/seo.test.ts`

**Interfaces:**
- Consumes: `SITE_URL`, `SITE_NAME`, `AUTHOR_NAME`, `AUTHOR_AMAZON_URL` from config; `works`/`books` collections; `isExternal` from `src/lib/works.ts`.
- Produces: `src/lib/seo.ts` exporting `bookLd({title, description, url, image?})`, `worksLd(items: {title:string; url:string}[])`, and `personLd()`. `works/[slug]` renders only NON-external works (external ones live off-site).

- [ ] **Step 1: Write `tests/seo.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { bookLd, worksLd, personLd } from '../src/lib/seo';

describe('bookLd', () => {
  it('builds schema.org Book json-ld', () => {
    const ld: any = bookLd({ title: 'T', description: 'D', url: 'https://x/y' });
    expect(ld['@type']).toBe('Book');
    expect(ld.name).toBe('T');
    expect(ld.author.name).toBe('Christopher Ayers');
  });
});

describe('worksLd', () => {
  it('lists works as a collection', () => {
    const ld: any = worksLd([{ title: 'A', url: 'https://x/a' }]);
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.hasPart[0].name).toBe('A');
  });
});

describe('personLd', () => {
  it('describes the author', () => {
    const ld: any = personLd();
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Christopher Ayers');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- seo`
Expected: FAIL, cannot import from `../src/lib/seo`.

- [ ] **Step 3: Create `src/lib/seo.ts`**

```ts
import { SITE_URL, SITE_NAME, AUTHOR_NAME, AUTHOR_AMAZON_URL } from '../config';

export function bookLd(b: { title: string; description: string; url: string; image?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: b.title,
    author: { '@type': 'Person', name: AUTHOR_NAME },
    url: b.url,
    ...(b.image ? { image: b.image } : {}),
    description: b.description,
    inLanguage: 'en',
  };
}

export function worksLd(items: { title: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SITE_NAME,
    author: { '@type': 'Person', name: AUTHOR_NAME },
    hasPart: items.map((w) => ({ '@type': 'CreativeWork', name: w.title, url: w.url })),
  };
}

export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: `${SITE_URL}/about`,
    jobTitle: 'Author',
    ...(AUTHOR_AMAZON_URL ? { sameAs: [AUTHOR_AMAZON_URL] } : {}),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- seo`
Expected: PASS.

- [ ] **Step 5: Copy and adapt `BuyButton.astro` and `BookCard.astro`**

```bash
cp ~/broadcast-site/src/components/BuyButton.astro src/components/BuyButton.astro
cp ~/broadcast-site/src/components/BookCard.astro src/components/BookCard.astro
```
Open both. Adjust `BookCard.astro` to the hub `bookSchema` fields (`title`, `cover`, `amazonUrl`, `paperbackUrl`, `audiobookUrl`, `audioSampleUrl`) and remove any Broadcast-only fields (floors, subtitle, praise) it references. `BuyButton.astro` likely needs no changes; verify it imports nothing Broadcast-specific.

- [ ] **Step 6: Create `src/pages/works/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BookCard from '../../components/BookCard.astro';
import { isExternal, sortWorks } from '../../lib/works';
import { worksLd } from '../../lib/seo';

export async function getStaticPaths() {
  const works = await getCollection('works');
  // External works (e.g. The Broadcast) live off-site; no internal page.
  return works
    .filter((w) => !isExternal({ data: w.data }))
    .map((w) => ({ params: { slug: w.slug }, props: { work: w } }));
}

const { work } = Astro.props;
const { Content } = await work.render();
const books = sortWorks(
  (await getCollection('books')).filter((b) => b.data.work === work.slug)
);
const url = new URL(`/works/${work.slug}`, Astro.site).href;
---
<BaseLayout
  title={`${work.data.title} — Chris Ayers`}
  description={work.data.tagline}
  jsonLd={worksLd(books.map((b) => ({ title: b.data.title, url: new URL(`/books/${b.slug}`, Astro.site).href })))}
>
  <article class="work-page" style={`--accent:${work.data.accentColor}`}>
    <header>
      <p class="work-status">{work.data.status.replace('-', ' ')}</p>
      <h1>{work.data.title}</h1>
      <p class="work-tagline">{work.data.tagline}</p>
    </header>
    <div class="work-blurb"><Content /></div>
    {books.length > 0 && (
      <section class="book-grid">
        {books.map((b) => <BookCard slug={b.slug} data={b.data} />)}
      </section>
    )}
  </article>
</BaseLayout>
```

- [ ] **Step 7: Create `src/pages/books/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BuyButton from '../../components/BuyButton.astro';
import { bookLd } from '../../lib/seo';

export async function getStaticPaths() {
  const books = await getCollection('books');
  return books.map((b) => ({ params: { slug: b.slug }, props: { book: b } }));
}

const { book } = Astro.props;
const { Content } = await book.render();
const url = new URL(`/books/${book.slug}`, Astro.site).href;
---
<BaseLayout
  title={`${book.data.title} — Chris Ayers`}
  description={`${book.data.title} by Christopher Ayers`}
  image={book.data.cover}
  type="book"
  jsonLd={bookLd({ title: book.data.title, description: `${book.data.title} by Christopher Ayers`, url, image: book.data.cover })}
>
  <article class="book-page">
    <h1>{book.data.title}</h1>
    <div class="book-blurb"><Content /></div>
    <div class="buy-row">
      {book.data.amazonUrl && <BuyButton href={book.data.amazonUrl} label="Buy on Amazon" />}
      {book.data.paperbackUrl && <BuyButton href={book.data.paperbackUrl} label="Paperback" />}
      {book.data.audiobookUrl && <BuyButton href={book.data.audiobookUrl} label="Audiobook" />}
    </div>
  </article>
</BaseLayout>
```

Note: confirm `BuyButton.astro`'s prop names (`href`, `label`) match; adjust the calls above to the copied component's actual props.

- [ ] **Step 8: Build**

Run: `npm test && npm run build`
Expected: all tests pass; build generates `/works/something-new/` (hosted, coming-soon) and no `/works/the-broadcast/` (external). With no books yet, `/books/*` produces nothing, which is fine.

- [ ] **Step 9: Commit**

```bash
git add src/lib/seo.ts src/pages/works src/pages/books src/components/BookCard.astro src/components/BuyButton.astro tests/seo.test.ts
git commit -m "feat: work + book pages with schema.org json-ld"
```

---

### Task 8: About page, 404, and email capture

**Files:**
- Create: `src/lib/subscribeRules.ts`
- Create: `src/lib/subscribe.ts`
- Create: `src/pages/api/subscribe.ts`
- Create: `src/components/EmailCapture.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/404.astro`
- Modify: `src/pages/index.astro` (add EmailCapture)
- Test: `tests/subscribeRules.test.ts`

**Interfaces:**
- Consumes: `personLd` from `src/lib/seo.ts`; `pickLine` from `src/lib/gm.ts`.
- Produces: `src/lib/subscribeRules.ts` exporting `normalizeEmail`, `isValidEmail`, `validateSubscribe`, `MAX_EMAIL_LEN`, `SUBSCRIBE_RATE_LIMIT`, `SUBSCRIBE_RATE_TTL_SECONDS` (same surface as broadcast-site).

- [ ] **Step 1: Copy the subscribe stack verbatim from broadcast-site**

```bash
cp ~/broadcast-site/src/lib/subscribeRules.ts src/lib/subscribeRules.ts
cp ~/broadcast-site/src/lib/subscribe.ts src/lib/subscribe.ts
cp ~/broadcast-site/src/pages/api/subscribe.ts src/pages/api/subscribe.ts
cp ~/broadcast-site/src/components/EmailCapture.astro src/components/EmailCapture.astro
cp ~/broadcast-site/tests/subscribeRules.test.ts tests/subscribeRules.test.ts
```

The API stores to Upstash Redis via env (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) and degrades gracefully to `{disabled:true}` when unset, which satisfies "collect emails now, wire a sender later." No code change needed.

- [ ] **Step 2: Run the copied test to verify the stack is intact**

Run: `npm test -- subscribeRules`
Expected: PASS (the broadcast-site suite runs unchanged).

- [ ] **Step 3: Edit `EmailCapture.astro` copy for the hub**

Open it. Replace any Broadcast-specific headings/copy with hub copy in the GM voice ("Join the party. Be first into new worlds."). Remove DCC references if any. Keep the form, honeypot field, and `subscribe()` wiring intact.

- [ ] **Step 4: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { personLd } from '../lib/seo';
import { AUTHOR_NAME } from '../config';
---
<BaseLayout title={`About — ${AUTHOR_NAME}`} description={`About ${AUTHOR_NAME}, author.`} jsonLd={personLd()}>
  <article class="about-page" style="max-width:60ch;margin:0 auto;padding:3rem 1rem">
    <h1>The mind of Chris</h1>
    <p>
      Chris Ayers writes adult fiction with a dangerously overclocked imagination:
      sharp, funny, and built like a game you can fall into. By day he wrangles
      data. By night he builds worlds and then dares you to survive them.
    </p>
    <p>
      Every series and standalone he writes lives here. Pick a world from the
      home screen and start playing.
    </p>
  </article>
</BaseLayout>
```

- [ ] **Step 5: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { pickLine } from '../lib/gm';
const line = pickLine('notFound', 0);
---
<BaseLayout title="404 — Chris Ayers" description="Page not found.">
  <section style="text-align:center;padding:5rem 1rem">
    <h1>404</h1>
    <p class="gm-line">{line}</p>
    <p><a href="/">Back to Choose Your World</a></p>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Add `<EmailCapture />` to `src/pages/index.astro`** below the world grid:

```astro
import EmailCapture from '../components/EmailCapture.astro';
```
```astro
  <section class="join">
    <EmailCapture />
  </section>
```

- [ ] **Step 7: Build**

Run: `npm test && npm run build`
Expected: all tests pass; `/about`, `/404`, and home with email form all build.

- [ ] **Step 8: Commit**

```bash
git add src/lib/subscribeRules.ts src/lib/subscribe.ts src/pages/api/subscribe.ts src/components/EmailCapture.astro src/pages/about.astro src/pages/404.astro src/pages/index.astro tests/subscribeRules.test.ts
git commit -m "feat: about page, GM 404, and email capture"
```

---

### Task 9: Finalize SEO, OG defaults, README, and push

**Files:**
- Create: `public/og/default.png` (placeholder OG image)
- Create: `README.md`
- Modify: `src/pages/index.astro` (add `worksLd` + default OG image to BaseLayout)

**Interfaces:**
- Consumes: `worksLd` from `src/lib/seo.ts`.
- Produces: nothing new; finalization only.

- [ ] **Step 1: Add a default OG image**

```bash
mkdir -p public/og
cp ~/broadcast-site/public/og/play.png public/og/default.png  # temporary; replace with a branded asset later
```

- [ ] **Step 2: Wire site-wide JSON-LD + OG on the home page**

In `src/pages/index.astro` frontmatter, build `worksLd` from `works` and pass `jsonLd` + `image` to `BaseLayout`:

```astro
import { worksLd } from '../lib/seo';
const ld = worksLd(works.map((w) => ({ title: w.data.title, url: new URL(w.data.externalUrl ?? `/works/${w.slug}`, Astro.site).href })));
```
Then update the opening tag:
```astro
<BaseLayout title={`${SITE_NAME} — Choose Your World`} description={SITE_TAGLINE} jsonLd={ld} image={new URL('/og/default.png', Astro.site).href}>
```

- [ ] **Step 3: Create `README.md`**

```md
# chrisayersbooks.com

Author hub for Christopher Ayers. Astro 5 static site on Vercel.

## Add a work
Drop a markdown file in `src/content/works/<slug>.md` (see schema in
`src/content/schema.ts`). Set `externalUrl` to link out instead of hosting.
For a hosted series, add books in `src/content/books/<slug>.md` with `work: <work-slug>`.
Flip `status` locked -> coming-soon -> live. Push. The tile, page, sitemap, and SEO generate automatically.

## Develop
- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

## Email list
The `/api/subscribe` endpoint stores to Upstash Redis when
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set in Vercel; it
degrades to disabled when unset. Export the CSV with `SUBSCRIBE_ADMIN_TOKEN`.
```

- [ ] **Step 4: Full build + test**

Run: `npm test && npm run build`
Expected: all tests pass; `dist/sitemap-index.xml` exists; `dist/index.html`, `/about`, `/works/something-new/`, `/404` present.

- [ ] **Step 5: Commit and push**

```bash
git add public/og README.md src/pages/index.astro
git commit -m "feat: site-wide SEO/OG defaults and README"
git push -u origin HEAD
```

---

### Task 10: `/author-hub` maintenance skill

**Files:**
- Create: `~/.claude/skills/author-hub/SKILL.md`

**Interfaces:**
- Consumes: this repo's content conventions.
- Produces: a slash command mirroring `/broadcast-site` for ongoing work.

- [ ] **Step 1: Read the existing broadcast-site skill for house style**

Run: `cat ~/.claude/skills/broadcast-site/SKILL.md`
(Match its structure, frontmatter, and verification approach.)

- [ ] **Step 2: Create `~/.claude/skills/author-hub/SKILL.md`**

Write a skill that documents: repo location (`~/chris-ayers-books`), the drop-in workflow for adding a work or book (markdown + cover + push), flipping `status`, adding `gmQuips` per work, registering a new easter egg in `src/data/eggs.ts` (add `{id, selector}` + place a `data-egg` trigger), adding GM lines in `src/data/gmLines.ts`, the build/test commands, the Vercel auto-deploy flow, and how to verify on production. Include the global constraints (no DCC, no em dashes, GM snarky-not-mean, real-name brand). Mirror the frontmatter and verification sections of the broadcast-site skill.

- [ ] **Step 3: Verify the skill loads**

Run: `ls ~/.claude/skills/author-hub/SKILL.md`
Expected: file exists. Confirm the frontmatter `name`/`description` are present so it appears in the skills list.

- [ ] **Step 4: Commit (docs copy in repo for reference)**

```bash
cp ~/.claude/skills/author-hub/SKILL.md docs/author-hub-skill.md
git add docs/author-hub-skill.md
git commit -m "docs: add /author-hub maintenance skill reference"
git push
```

---

## Post-implementation (Chris's manual steps, outside this plan)

- Register chrisayersbooks.com at your registrar.
- Create the Vercel project, link the GitHub repo, set the domain, and (optionally) add the Upstash Redis integration for the email list.
- Add the Google Search Console verification meta to `BaseHead.astro` once the domain is verified.
- Replace the placeholder OG image and favicon with branded assets.
