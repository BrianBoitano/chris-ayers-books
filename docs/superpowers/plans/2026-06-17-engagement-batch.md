# Engagement Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dead WORKS link and add four engagement features (a Works archive page, a home welcome + what-is-this band, a 5-egg scavenger that unlocks a secret Section Zero node and page, and a Transmissions devlog), all in the existing cyberpunk system, without regressing logic, accessibility, or the 52 passing tests.

**Architecture:** Centralize ALL progress localStorage mutation in one new site-wide script (`progress-eggs.ts`, loaded in BaseLayout) that wires eggs on every page, renders the HUD when present, records node visits via a `progress:visit` event, and reveals the secret node + GM takeover when all eggs are found. `breach.ts` keeps only cursor movement, jack-in, and the daemon line, dispatching `progress:visit` instead of writing progress. New pages (Archive, Transmissions, Section Zero) are data-driven Astro pages; Transmissions is a new content collection.

**Tech Stack:** Astro 5, TypeScript, Vitest, content collections, CSS. Reuses `sortWorks`/`worldHref`/`isExternal` (works.ts), `progress.ts`, `gm.ts`, `EGGS` (eggs.ts).

## Global Constraints

- Cyberpunk palette only: `--cy-yellow` (primary), `--cy-cyan` (links/secondary), `--cy-red` (locked/danger). No green; no new literal greens. After each task `grep -RInE '#39ff9e|57, ?255, ?158' src/` over touched files is empty.
- No Dungeon Crawler Carl / DCC references (guardrail statements excepted).
- No em dashes in reader-facing copy (use ':' or ' | ' or restructure).
- GM voice sarcastic but never mean. Real-name author brand (Christopher Ayers).
- Accessibility: real links, keyboard, no-JS, reduced-motion. New animations (takeover, secret-node reveal, toast) gated by `prefers-reduced-motion`.
- Client behavior in BUNDLED `<script>` modules (no `define:vars` inline import).
- Vitest `environment: 'node'`; pure libs/schema unit-tested, pages verified by build. `npm test` stays green (52+).
- Commit after every task. Repo `~/chris-ayers-books`, remote `origin` (auto-deploys). Do NOT push except in the final task.

---

### Task 1: `isComplete` progress helper

**Files:**
- Modify: `src/lib/progress.ts`
- Test: `tests/progress.test.ts`

**Interfaces:**
- Produces: `isComplete(p: Progress, total: number): boolean` (true when `p.eggs.length >= total`).

- [ ] **Step 1: Add a failing test to `tests/progress.test.ts`**

```ts
import { isComplete } from '../src/lib/progress';

describe('isComplete', () => {
  it('false below total, true at or over total', () => {
    expect(isComplete({ xp: 0, visited: [], eggs: ['a', 'b'], achievements: [] }, 5)).toBe(false);
    expect(isComplete({ xp: 0, visited: [], eggs: ['a','b','c','d','e'], achievements: [] }, 5)).toBe(true);
    expect(isComplete({ xp: 0, visited: [], eggs: ['a','b','c','d','e','f'], achievements: [] }, 5)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- progress`
Expected: FAIL, `isComplete` not exported.

- [ ] **Step 3: Add to `src/lib/progress.ts`** (after `findEgg`)

```ts
export function isComplete(p: Progress, total: number): boolean {
  return p.eggs.length >= total;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- progress`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts tests/progress.test.ts
git commit -m "feat: isComplete progress helper for egg scavenger"
```

---

### Task 2: Transmissions content collection + seed posts

**Files:**
- Modify: `src/content/schema.ts`, `src/content/config.ts`
- Create: `src/content/transmissions/0001-signal-established.md`, `src/content/transmissions/0002-what-im-building.md`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Produces: `transmissionSchema` (Zod) exported from schema.ts; a `transmissions` collection with frontmatter `title: string`, `date: date`, `tag?: string`; markdown body.

- [ ] **Step 1: Add a failing test to `tests/content-schema.test.ts`**

```ts
import { transmissionSchema } from '../src/content/schema';

describe('transmissionSchema', () => {
  it('accepts a valid post', () => {
    const r = transmissionSchema.safeParse({ title: 'Hi', date: new Date('2026-06-17'), tag: 'news' });
    expect(r.success).toBe(true);
  });
  it('rejects a post missing a title', () => {
    const r = transmissionSchema.safeParse({ date: new Date('2026-06-17') });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- content-schema`
Expected: FAIL, `transmissionSchema` not exported.

- [ ] **Step 3: Add `transmissionSchema` to `src/content/schema.ts`** (after `bookSchema`)

```ts
export const transmissionSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tag: z.string().optional(),
});
export type Transmission = z.infer<typeof transmissionSchema>;
```

- [ ] **Step 4: Wire it in `src/content/config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { workSchema, bookSchema, transmissionSchema } from './schema';

export const collections = {
  works: defineCollection({ type: 'content', schema: workSchema }),
  books: defineCollection({ type: 'content', schema: bookSchema }),
  transmissions: defineCollection({ type: 'content', schema: transmissionSchema }),
};
```

- [ ] **Step 5: Create `src/content/transmissions/0001-signal-established.md`**

```md
---
title: Signal established
date: 2026-06-14
tag: meta
---

The network is live. If you are reading this, you found the log.

This site is where every world I write lives. Pick a node, jack in, and poke at
everything. Some of it does more than it looks like it does. I will drop notes
here when a new world opens, when something breaks, or when I have opinions I
cannot keep to myself. No schedule, no filler. Just the signal.
```

- [ ] **Step 6: Create `src/content/transmissions/0002-what-im-building.md`**

```md
---
title: What I am building next
date: 2026-06-16
tag: writing
---

Short version: more worlds, and a reason to come back to this one.

The Broadcast is complete and lives on its own network. The next world is still
loading, which is a polite way of saying I am arguing with myself about it daily.
Meanwhile I am wiring this place to be less of a brochure and more of a thing you
can play with. If you find all the hidden datashards, you will see what I mean.
```

- [ ] **Step 7: Verify schema test passes and content compiles**

Run: `npm test -- content-schema && npx astro sync && npm run build`
Expected: schema test PASS; build succeeds (transmissions collection recognized).

- [ ] **Step 8: Commit**

```bash
git add src/content/schema.ts src/content/config.ts src/content/transmissions tests/content-schema.test.ts
git commit -m "feat: transmissions content collection + two seed posts"
```

---

### Task 3: Works Archive page + fix WORKS links

**Files:**
- Create: `src/pages/works/index.astro`
- Modify: `src/components/SiteNav.astro`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `getCollection('works')`, `sortWorks`/`worldHref`/`isExternal` (works.ts), `worksLd` (seo.ts).
- Produces: a `/works` page; nav/footer WORKS links now point to `/works`.

- [ ] **Step 1: Create `src/pages/works/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { sortWorks, worldHref, isExternal } from '../../lib/works';
import { worksLd } from '../../lib/seo';

const works = sortWorks(await getCollection('works'));
const ld = worksLd(
  works.filter((w) => worldHref(w) !== null)
    .map((w) => ({ title: w.data.title, url: w.data.externalUrl ?? new URL(`/works/${w.slug}`, Astro.site).href }))
);
const statusLabel = (s: string) => s === 'live' ? 'LIVE' : s === 'coming-soon' ? 'COMING ONLINE' : 'ICE LOCKED';
---
<BaseLayout title="The Archive | Chris Ayers" description="Every world Chris Ayers has written." jsonLd={ld}>
  <section class="archive">
    <header class="archive__head">
      <p class="archive__eyebrow"><span aria-hidden="true">//</span> THE ARCHIVE <span class="archive__egg" data-egg="archive" aria-hidden="true">::</span></p>
      <h1 class="archive__title">Worlds</h1>
      <p class="archive__sub">Every node on the network, listed. Pick one and jack in.</p>
    </header>
    <ul class="archive__grid" role="list">
      {works.map((w) => {
        const href = worldHref(w);
        const ext = isExternal(w);
        const locked = w.data.status === 'locked';
        return (
          <li class:list={['arch-card', { 'is-locked': locked }]} style={`--accent:${w.data.accentColor || '#fcee0a'}`}>
            <div class="arch-card__media">
              {w.data.cover ? <img src={w.data.cover} alt="" loading="lazy" width="80" height="120" /> : <span class="arch-card__ph" aria-hidden="true">{locked ? '\u{1F512}' : '?'}</span>}
            </div>
            <div class="arch-card__body">
              <p class="arch-card__status">{statusLabel(w.data.status)}{w.data.genre ? ` // ${w.data.genre}` : ''}</p>
              <h2 class="arch-card__title">{w.data.title}</h2>
              <p class="arch-card__ovr">{w.data.overview || w.data.tagline}</p>
              {locked
                ? <span class="arch-card__cta arch-card__cta--locked">LOCKED // SOON</span>
                : <a class="arch-card__cta" href={href ?? undefined} target={ext ? '_blank' : undefined} rel={ext ? 'noopener' : undefined}>{ext ? 'OPEN FEED >' : 'JACK IN >'}</a>}
            </div>
          </li>
        );
      })}
    </ul>
  </section>
</BaseLayout>

<style>
  .archive { max-width: 1040px; margin-inline: auto; padding: clamp(2.5rem,6vh,4.5rem) var(--space); }
  .archive__eyebrow { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cy-cyan); opacity: 0.85; }
  .archive__egg { color: var(--dim); }
  .archive__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(2rem,6vw,3.4rem); text-transform: uppercase; letter-spacing: -0.02em; color: var(--ink); margin: 0.6rem 0 0.4rem; }
  .archive__sub { font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); }
  .archive__grid { list-style: none; margin: 2rem 0 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
  @media (min-width: 720px) { .archive__grid { grid-template-columns: 1fr 1fr; } }
  .arch-card { display: flex; gap: 1rem; padding: 1rem; background: rgba(8,8,12,.72); border: 1px solid var(--line);
    clip-path: polygon(0 0,100% 0,100% 94%,97% 100%,0 100%); }
  .arch-card.is-locked { opacity: 0.8; }
  .arch-card__media { flex: 0 0 80px; }
  .arch-card__media img { width: 80px; height: 120px; object-fit: cover; border: 1px solid var(--accent); display: block; }
  .arch-card__ph { display: flex; width: 80px; height: 120px; align-items: center; justify-content: center; border: 1px dashed var(--accent); color: var(--accent); font-size: 28px; }
  .arch-card__status { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin: 0; }
  .arch-card__title { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: var(--ink); margin: 0.3rem 0; }
  .arch-card__ovr { font-size: 0.85rem; line-height: 1.55; color: var(--muted); margin: 0 0 0.7rem; }
  .arch-card__cta { display: inline-block; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em; color: #0a0a04; background: var(--accent); padding: 0.35em 0.8em; text-decoration: none; clip-path: polygon(0 0,100% 0,100% 68%,90% 100%,0 100%); }
  .arch-card__cta--locked { background: transparent; color: var(--cy-red); border: 1px solid var(--cy-red); }
</style>
```

- [ ] **Step 2: Repoint WORKS in `src/components/SiteNav.astro` and `src/components/Footer.astro`**

In both files, change the Works link `href="/#worlds"` to `href="/works"`.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Then:
```bash
grep -c 'arch-card' dist/client/works/index.html   # >=1 (a card per work)
grep -o 'href="/works"' dist/client/index.html | head -1   # nav now points to /works
```
Expected: the archive lists a card per work; nav/footer WORKS point to `/works`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/works/index.astro src/components/SiteNav.astro src/components/Footer.astro
git commit -m "feat: Works archive page; fix dead WORKS nav/footer links"
```

---

### Task 4: Transmissions pages + nav/footer link

**Files:**
- Create: `src/pages/transmissions/index.astro`, `src/pages/transmissions/[slug].astro`
- Modify: `src/components/SiteNav.astro`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `getCollection('transmissions')`.
- Produces: `/transmissions` index + `/transmissions/<slug>` pages; nav/footer gain a TRANSMISSIONS link.

- [ ] **Step 1: Create `src/pages/transmissions/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = (await getCollection('transmissions')).sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
---
<BaseLayout title="Transmission Log | Chris Ayers" description="Updates and notes from Christopher Ayers.">
  <section class="tlog">
    <header class="tlog__head">
      <p class="tlog__eyebrow"><span aria-hidden="true">//</span> TRANSMISSION LOG</p>
      <h1 class="tlog__title">Transmissions</h1>
    </header>
    <ul class="tlog__list" role="list">
      {posts.map((post) => (
        <li class="tlog__item">
          <a class="tlog__link" href={`/transmissions/${post.slug}`}>
            <span class="tlog__date">{fmt(post.data.date)}{post.data.tag ? ` // ${post.data.tag}` : ''}</span>
            <span class="tlog__name">{post.data.title}</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>

<style>
  .tlog { max-width: 760px; margin-inline: auto; padding: clamp(2.5rem,6vh,4.5rem) var(--space); }
  .tlog__eyebrow { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cy-cyan); opacity: 0.85; }
  .tlog__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(2rem,6vw,3.4rem); text-transform: uppercase; color: var(--ink); margin: 0.6rem 0 1.5rem; }
  .tlog__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .tlog__link { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; text-decoration: none;
    background: rgba(8,8,12,.6); border: 1px solid var(--line); border-left: 2px solid var(--cy-cyan); transition: border-color .12s, background .12s; }
  .tlog__link:hover { background: rgba(0,229,255,.05); border-left-color: var(--cy-yellow); }
  .tlog__date { font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cy-cyan); }
  .tlog__name { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { .tlog__link { transition: none; } }
</style>
```

- [ ] **Step 2: Create `src/pages/transmissions/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('transmissions');
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await post.render();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
---
<BaseLayout title={`${post.data.title} | Transmission`} description={post.data.title}>
  <article class="tpost">
    <p class="tpost__date">{fmt(post.data.date)}{post.data.tag ? ` // ${post.data.tag}` : ''}</p>
    <h1 class="tpost__title">{post.data.title}</h1>
    <div class="tpost__body"><Content /></div>
    <p class="tpost__back"><a href="/transmissions">&lt; back to the log</a></p>
  </article>
</BaseLayout>

<style>
  .tpost { max-width: 64ch; margin-inline: auto; padding: clamp(2.5rem,6vh,4.5rem) var(--space); }
  .tpost__date { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cy-cyan); margin: 0; }
  .tpost__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.8rem,5vw,2.8rem); color: var(--ink); margin: 0.5rem 0 1.5rem; }
  .tpost__body { color: var(--ink); line-height: 1.8; }
  .tpost__body :global(p) { margin: 0 0 1.1rem; }
  .tpost__back { margin-top: 2rem; font-family: var(--font-mono); font-size: 0.8rem; }
  .tpost__back a { color: var(--cy-cyan); }
</style>
```

- [ ] **Step 3: Add TRANSMISSIONS to nav + footer**

In `SiteNav.astro`, add a nav list item between Works and About:
```astro
        <li><a href="/transmissions" class="nav__link">Transmissions</a></li>
```
In `Footer.astro`, add to the footer nav list between Works and About:
```astro
        <li><a href="/transmissions" class="footer__nav-link">Transmissions</a></li>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Then:
```bash
grep -c 'tlog__item' dist/client/transmissions/index.html   # 2 seed posts
ls dist/client/transmissions/                                # slug dirs exist
grep -o 'href="/transmissions"' dist/client/index.html | head -1
```
Expected: log lists both seeds; post pages built; nav links present.

- [ ] **Step 5: Commit**

```bash
git add src/pages/transmissions src/components/SiteNav.astro src/components/Footer.astro
git commit -m "feat: transmissions log index + post pages + nav/footer link"
```

---

### Task 5: Section Zero secret page (noindex)

**Files:**
- Create: `src/pages/section-zero.astro`
- Modify: `src/components/BaseHead.astro`, `src/layouts/BaseLayout.astro` (optional `noindex` prop)

**Interfaces:**
- Produces: `/section-zero` page carrying a `<meta name="robots" content="noindex">`; `BaseLayout`/`BaseHead` gain an optional `noindex?: boolean` prop.

- [ ] **Step 1: Add a `noindex` prop to `src/components/BaseHead.astro`**

Add `noindex?: boolean;` to its `Props` interface, destructure `noindex = false`, and after the `<link rel="canonical">` line add:
```astro
{noindex && <meta name="robots" content="noindex" />}
```

- [ ] **Step 2: Thread `noindex` through `src/layouts/BaseLayout.astro`**

Add `noindex?: boolean;` to its `Props`, destructure it (`const { title, description, image, jsonLd, type, noindex } = Astro.props;`), and pass `noindex={noindex}` to `<BaseHead ... />`.

- [ ] **Step 3: Create `src/pages/section-zero.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Section Zero" description="A part of the network that was not on the map." noindex>
  <section class="sz">
    <p class="sz__eyebrow"><span aria-hidden="true">//</span> SECTION ZERO // RESTRICTED</p>
    <h1 class="sz__title">You were not supposed to find this</h1>
    <div class="sz__body">
      <p>So you turned over every node, every footer, every dead end, until the
      whole map gave up its datashards. Most people skim a site and leave. You
      went looking. That tells me something, and I respect it.</p>
      <p>Here is the part the brochure does not say. I write these worlds at night
      after a day of reading dashboards nobody acts on, and I build the place you
      are standing in for fun, mostly to see if anyone would dig this deep. You
      did. So here is a real one: the next book is closer than the locked node
      lets on, and the people on the signal list hear about it first. That is the
      whole secret. The rest is just me showing off.</p>
      <p>Now go tell one person, out loud, with your whole face, to come find this.</p>
    </div>
    <p class="sz__back"><a href="/">&lt; return to the network</a></p>
  </section>
</BaseLayout>

<style>
  .sz { max-width: 60ch; margin-inline: auto; padding: clamp(3rem,8vh,6rem) var(--space); }
  .sz__eyebrow { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--cy-red); }
  .sz__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.9rem,5.5vw,3rem); color: var(--ink);
    margin: 0.6rem 0 1.6rem; text-shadow: 2px 0 var(--cy-red), -2px 0 var(--cy-cyan); }
  .sz__body { color: var(--ink); line-height: 1.8; }
  .sz__body p { margin: 0 0 1.1rem; }
  .sz__back { margin-top: 2rem; font-family: var(--font-mono); font-size: 0.8rem; }
  .sz__back a { color: var(--cy-cyan); }
</style>
```

- [ ] **Step 4: Build and verify noindex + page**

Run: `npm run build`
Then:
```bash
grep -c 'name="robots" content="noindex"' dist/client/section-zero/index.html   # 1
grep -c 'name="robots"' dist/client/index.html || echo "0 (home is indexable)"
```
Expected: section-zero carries noindex; other pages do not.

- [ ] **Step 5: Commit**

```bash
git add src/pages/section-zero.astro src/components/BaseHead.astro src/layouts/BaseLayout.astro
git commit -m "feat: Section Zero secret page (noindex) + BaseHead noindex prop"
```

---

### Task 6: Welcome line + what-is-this band

**Files:**
- Modify: `src/components/Overworld.astro` (welcome line)
- Modify: `src/pages/index.astro` (what-is-this band with latest transmission)

**Interfaces:**
- Consumes: `getCollection('transmissions')` in index.astro.
- Produces: a welcome line in the stage; a `.pitch` band below the stage with CTAs and the latest transmission.

- [ ] **Step 1: Add the welcome line in `src/components/Overworld.astro`**

In the `.ow-title` block, right after the `<p>` that holds `// BREACH A SECTOR TO JACK IN`, add:
```astro
    <p class="ow-welcome">This is the network of Chris Ayers. Every node is a world he wrote. Jack in.</p>
```
Add to the component `<style>`:
```css
  .ow-welcome { margin:8px 0 0; max-width:42ch; font-size:11px; line-height:1.5; letter-spacing:.04em; color:#9fb4bd; }
```

- [ ] **Step 2: Add the what-is-this band to `src/pages/index.astro`**

Update the frontmatter to load the latest transmission, and add a `<section class="pitch" id="pitch">` after `<Overworld ... />`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Overworld from '../components/Overworld.astro';
import { sortWorks, worldHref } from '../lib/works';
import { SITE_NAME, SITE_TAGLINE } from '../config';
import { worksLd } from '../lib/seo';

const works = sortWorks(await getCollection('works'));
const ld = worksLd(
  works.filter((w) => worldHref(w) !== null)
    .map((w) => ({ title: w.data.title, url: w.data.externalUrl ?? new URL(`/works/${w.slug}`, Astro.site).href }))
);
const latest = (await getCollection('transmissions')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())[0];
const latestDate = latest ? latest.data.date.toISOString().slice(0, 10) : '';
---
<BaseLayout title={`${SITE_NAME} | Choose Your World`} description={SITE_TAGLINE} jsonLd={ld} image={new URL('/og/default.png', Astro.site).href}>
  <Overworld works={works} />
  <section class="pitch" id="pitch">
    <div class="pitch__inner">
      <p class="pitch__eyebrow"><span aria-hidden="true">//</span> WHAT IS THIS</p>
      <h2 class="pitch__h">You jacked into an author.</h2>
      <p class="pitch__copy">Chris Ayers writes adult fiction you fall into like a game. Every node on the network is a world. Browse the archive, read the latest transmission, or get pinged the moment a new world opens.</p>
      <div class="pitch__cta">
        <a class="pitch__btn pitch__btn--primary" href="/works">Enter the Archive</a>
        <a class="pitch__btn" href="/about">Meet the author</a>
        <a class="pitch__btn" href="#notify">Get the signal</a>
      </div>
      {latest && (
        <a class="pitch__latest" href={`/transmissions/${latest.slug}`}>
          <span class="pitch__latest-k">LATEST TRANSMISSION // {latestDate}</span>
          <span class="pitch__latest-t">{latest.data.title}</span>
        </a>
      )}
    </div>
  </section>
</BaseLayout>

<style>
  .pitch { border-top: 1px solid var(--line); padding-block: clamp(2.5rem,6vh,4rem); }
  .pitch__inner { max-width: 760px; margin-inline: auto; padding-inline: var(--space); }
  .pitch__eyebrow { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cy-cyan); opacity: 0.85; }
  .pitch__h { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.6rem,4.5vw,2.6rem); color: var(--ink); margin: 0.5rem 0 0.7rem; }
  .pitch__copy { color: var(--ink); line-height: 1.7; max-width: 60ch; }
  .pitch__cta { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 1.3rem; }
  .pitch__btn { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
    color: var(--cy-cyan); border: 1px solid var(--line); padding: 0.6em 1em; clip-path: polygon(0 0,100% 0,100% 72%,92% 100%,0 100%); transition: border-color .12s, color .12s; }
  .pitch__btn:hover { color: var(--cy-yellow); border-color: var(--cy-yellow); }
  .pitch__btn--primary { background: var(--cy-yellow); color: #0a0a04; border-color: var(--cy-yellow); }
  .pitch__btn--primary:hover { color: #0a0a04; filter: brightness(1.05); }
  .pitch__latest { display: flex; flex-direction: column; gap: 0.2rem; margin-top: 1.6rem; padding: 0.9rem 1rem; text-decoration: none;
    background: rgba(8,8,12,.6); border: 1px solid var(--line); border-left: 2px solid var(--cy-cyan); }
  .pitch__latest-k { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.12em; color: var(--cy-cyan); }
  .pitch__latest-t { font-family: var(--font-display); font-weight: 700; color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { .pitch__btn { transition: none; } }
</style>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Then:
```bash
grep -c 'ow-welcome' dist/client/index.html        # 1
grep -c 'pitch__h' dist/client/index.html           # 1
grep -o 'LATEST TRANSMISSION' dist/client/index.html | head -1
```
Expected: welcome line + pitch band + latest transmission render on home.

- [ ] **Step 4: Commit**

```bash
git add src/components/Overworld.astro src/pages/index.astro
git commit -m "feat: home welcome line + what-is-this band with latest transmission"
```

---

### Task 7: Progress + eggs engine (refactor)

**Files:**
- Create: `src/scripts/progress-eggs.ts`
- Modify: `src/scripts/breach.ts` (drop egg/HUD/progress writes; dispatch progress:visit)
- Modify: `src/components/Overworld.astro` (HUD eggs shows /total via progress-eggs; add hidden Section Zero node; load progress-eggs is global, not here)
- Modify: `src/layouts/BaseLayout.astro` (load progress-eggs.ts; add the GM takeover overlay container)
- Modify: `src/styles/global.css` (takeover + toast styles)

**Interfaces:**
- Consumes: `SAVE_KEY`/`normalize`/`visitWorld`/`findEgg`/`isComplete` (progress.ts), `EGGS` (eggs.ts).
- Produces: site-wide `initProgressEggs()` default export; the DOM contract `[data-hud-xp]`/`[data-hud-eggs]`/`[data-hud-seg]`, `[data-secret-node]`, `[data-gm-takeover]`/`[data-gm-takeover-close]`, and the `progress:visit` event consumed from breach.ts.

- [ ] **Step 1: Create `src/scripts/progress-eggs.ts`**

```ts
import { SAVE_KEY, normalize, visitWorld, findEgg, isComplete, type Progress } from '../lib/progress';
import { EGGS } from '../data/eggs';

export default function initProgressEggs() {
  if ((window as any).__peReady) return;
  (window as any).__peReady = true;

  const TOTAL = EGGS.length;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const load = (): Progress => { try { return normalize(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); } catch { return normalize(null); } };
  const persist = (p: Progress) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch {} };
  let p = load();
  let wasComplete = isComplete(p, TOTAL);

  const renderHud = () => {
    const xp = document.querySelector('[data-hud-xp]'); if (xp) xp.textContent = String(p.xp);
    const eg = document.querySelector('[data-hud-eggs]'); if (eg) eg.textContent = `${p.eggs.length} / ${TOTAL}`;
    const seg = document.querySelector('[data-hud-seg]');
    if (seg) { const on = Math.min(6, Math.round(p.xp / 10)); seg.innerHTML = ''; for (let i = 0; i < 6; i++) { const s = document.createElement('i'); if (i < on) s.className = 'on'; seg.appendChild(s); } }
  };

  const revealSecret = () => { document.querySelector('[data-secret-node]')?.removeAttribute('hidden'); };

  const showTakeover = () => {
    const ov = document.querySelector<HTMLElement>('[data-gm-takeover]');
    if (!ov) return;
    ov.hidden = false;
    const close = ov.querySelector<HTMLElement>('[data-gm-takeover-close]');
    const hide = () => { ov.hidden = true; document.removeEventListener('keydown', onKey); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    close?.addEventListener('click', hide, { once: true });
    document.addEventListener('keydown', onKey);
    close?.focus();
  };

  let toastTimer = 0;
  const toast = (msg: string) => {
    let t = document.querySelector<HTMLElement>('[data-egg-toast]');
    if (!t) { t = document.createElement('div'); t.setAttribute('data-egg-toast', ''); t.className = 'egg-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => t!.classList.remove('is-on'), reduce ? 2500 : 2200);
  };

  const refresh = (celebrate = false) => {
    renderHud();
    if (isComplete(p, TOTAL)) {
      revealSecret();
      if (celebrate && !wasComplete) showTakeover();
      wasComplete = true;
    }
  };

  refresh(); // initial: render HUD + reveal secret if already complete (no takeover)

  document.addEventListener('progress:visit', (e: any) => {
    const slug = e.detail?.slug; if (!slug) return;
    const next = visitWorld(p, slug);
    if (next !== p) { p = next; persist(p); refresh(); }
  });

  for (const egg of EGGS) {
    const el = document.querySelector(egg.selector);
    if (el) el.addEventListener('click', () => {
      const next = findEgg(p, egg.id);
      if (next !== p) {
        p = next; persist(p);
        document.dispatchEvent(new CustomEvent('gm:say', { detail: { context: 'eggFound' } }));
        if (!isComplete(p, TOTAL)) toast(`DATASHARD ${p.eggs.length} / ${TOTAL} RECOVERED`);
        refresh(true);
      }
    });
  }
}
```

- [ ] **Step 2: Replace `src/scripts/breach.ts`** (drop eggs/HUD/progress writes; dispatch progress:visit)

```ts
import { move, type Dir } from '../lib/breachNav';
import { randomLine } from '../lib/gm';

export default function initBreach() {
  const stage = document.querySelector<HTMLElement>('[data-overworld]');
  if (!stage) return;
  if (stage.dataset.breachReady === '1') return; stage.dataset.breachReady = '1';

  const daemon = stage.querySelector<HTMLElement>('[data-daemon-text]');
  const setDaemon = (ctx: string) => { if (daemon) daemon.textContent = randomLine(ctx as any); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idleTimer = 0;
  if (!reduceMotion) idleTimer = window.setInterval(() => setDaemon('idle'), 12000);
  const onGmSay = (e: any) => setDaemon(e.detail?.context || 'idle');
  document.addEventListener('gm:say', onGmSay);
  const stopIdle = () => { clearInterval(idleTimer); document.removeEventListener('gm:say', onGmSay); };
  document.addEventListener('astro:before-swap', stopIdle, { once: true });
  window.addEventListener('beforeunload', stopIdle);

  const nodeEls = Array.from(stage.querySelectorAll<HTMLElement>('[data-node]'));
  const nodes = nodeEls.map((el) => ({ slug: el.dataset.slug!, x: Number(el.dataset.x), y: Number(el.dataset.y), kind: el.dataset.kind!, el }));
  if (nodes.length === 0) return;
  const edges: [string, string][] = JSON.parse(stage.dataset.edges || '[]');
  const cursor = stage.querySelector<HTMLElement>('[data-cursor]');
  let current = nodes[0].slug;
  const bySlug = (s: string) => nodes.find((n) => n.slug === s)!;

  const placeCursor = (focus = false) => {
    const n = bySlug(current);
    if (cursor) { cursor.style.left = n.x + '%'; cursor.style.top = n.y + '%'; cursor.style.transition = reduceMotion ? 'none' : 'left .18s, top .18s'; }
    if (focus) n.el.querySelector<HTMLElement>('.term')?.focus({ preventScroll: true });
  };
  const say = (context: string) => document.dispatchEvent(new CustomEvent('gm:say', { detail: { context } }));
  const recordVisit = (slug: string) => document.dispatchEvent(new CustomEvent('progress:visit', { detail: { slug } }));

  const enter = (slug: string) => {
    const n = bySlug(slug);
    if (n.kind === 'locked') { say('lockedTile'); return; }
    recordVisit(slug);
    const a = n.el.querySelector<HTMLAnchorElement>('a.term');
    if (a) { if (a.target === '_blank') window.open(a.href, '_blank', 'noopener'); else window.location.href = a.href; }
  };

  const keymap: Record<string, Dir> = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  stage.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k in keymap) { const to = move(nodes, edges, current, keymap[k] as Dir); if (to) { current = to; placeCursor(true); e.preventDefault(); } }
    else if (e.key === 'Enter' || e.key === ' ') { enter(current); e.preventDefault(); }
  });
  for (const n of nodes) {
    n.el.addEventListener('click', (e) => {
      current = n.slug; placeCursor();
      if (n.kind === 'locked') { e.preventDefault(); say('lockedTile'); return; }
      recordVisit(n.slug);
    });
  }
  placeCursor();
}
```

- [ ] **Step 3: Overworld.astro — update HUD egg default + add the hidden Section Zero node**

In `Overworld.astro`, change the HUD eggs default text so the server render shows the total too: find `<b data-hud-eggs>0</b>` and make it `<b data-hud-eggs>0 / 5</b>` (progress-eggs overrides it live; keep this in sync with `EGGS.length`).

Add the hidden secret node just before the closing `</section>` of the stage (after the nodes / cursor), so progress-eggs can reveal it:
```astro
  <a class="ow-secret" data-secret-node href="/section-zero" hidden style="left:82%; top:15%" aria-label="Section Zero, unlocked secret">
    <span class="ow-secret__term">SECTION ZERO</span>
  </a>
```
Add to the component `<style>`:
```css
  .ow-secret { position:absolute; z-index:6; transform:translate(-50%,-50%); text-decoration:none;
    font-family:"Courier New",monospace; }
  .ow-secret__term { display:inline-block; padding:6px 12px; color:#0a0a04; background:#ff2bd6;
    font-weight:700; font-size:12px; letter-spacing:.12em; clip-path:polygon(0 0,100% 0,100% 64%,90% 100%,0 100%);
    box-shadow:0 0 18px rgba(255,43,214,.6); }
  .ow-secret[hidden] { display:none; }
```

- [ ] **Step 4: BaseLayout.astro — load progress-eggs + add the GM takeover overlay**

Add a bundled script and the overlay container. After `<FollowMe />` add:
```astro
    <div class="gm-takeover" data-gm-takeover hidden role="dialog" aria-modal="true" aria-label="System override">
      <div class="gm-takeover__panel">
        <p class="gm-takeover__h">// SYSTEM OVERRIDE</p>
        <p class="gm-takeover__body">All datashards recovered. You turned over the whole map. SECTION ZERO is now on the network. Go see what you unlocked.</p>
        <button type="button" class="gm-takeover__close" data-gm-takeover-close>Acknowledge</button>
      </div>
    </div>
    <script>
      import initProgressEggs from '../scripts/progress-eggs.ts';
      const start = () => initProgressEggs();
      document.addEventListener('astro:page-load', start, { once: true });
      if (document.readyState !== 'loading') start();
      else document.addEventListener('DOMContentLoaded', start, { once: true });
    </script>
```

- [ ] **Step 5: global.css — takeover + toast styles** (append)

```css
/* GM takeover overlay (egg-scavenger completion) */
.gm-takeover { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
  background: rgba(4,4,6,.86); padding: 1.5rem; }
.gm-takeover[hidden] { display: none; }
.gm-takeover__panel { max-width: 440px; background: rgba(8,8,12,.96); border: 1px solid var(--cy-yellow);
  box-shadow: 0 0 40px rgba(252,238,10,.3); clip-path: polygon(0 0,100% 0,100% 94%,97% 100%,0 100%); padding: 1.6rem 1.5rem; text-align: left; }
.gm-takeover__h { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.18em; color: var(--cy-yellow); margin: 0 0 0.8rem; }
.gm-takeover__body { color: var(--ink); line-height: 1.7; margin: 0 0 1.2rem; }
.gm-takeover__close { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: #0a0a04; background: var(--cy-yellow); border: 0; padding: 0.6em 1.2em; cursor: pointer;
  clip-path: polygon(0 0,100% 0,100% 70%,92% 100%,0 100%); }
/* Egg toast */
.egg-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(8px); z-index: 190;
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.12em; color: #0a0a04; background: var(--cy-cyan);
  padding: 0.5em 1em; clip-path: polygon(0 0,100% 0,100% 68%,94% 100%,0 100%); opacity: 0; pointer-events: none;
  transition: opacity .2s, transform .2s; }
.egg-toast.is-on { opacity: 1; transform: translateX(-50%) translateY(0); }
@media (prefers-reduced-motion: reduce) { .egg-toast { transition: none; } }
```

- [ ] **Step 6: Build and verify the engine wiring**

Run: `npm run build`
Then:
```bash
grep -c 'data-gm-takeover' dist/client/index.html         # >=1 (overlay site-wide)
grep -c 'data-secret-node' dist/client/index.html          # 1 (hidden secret node on home)
grep -RIl "from '../scripts/progress-eggs" dist/client/*.html dist/client/**/*.html 2>/dev/null && echo "INLINE IMPORT (bad)" || echo "progress-eggs bundled (good)"
grep -o '0 / 5' dist/client/index.html | head -1            # HUD eggs shows /5
```
Expected: overlay + secret node present; progress-eggs is bundled (no inline source import); HUD shows `/ 5`.

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: all pass (logic centralized, no behavior tests broken).

- [ ] **Step 8: Commit**

```bash
git add src/scripts/progress-eggs.ts src/scripts/breach.ts src/components/Overworld.astro src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: site-wide progress+egg engine; secret node + GM takeover; breach dispatches visits"
```

---

### Task 8: Egg placements (5) + GM hint lines

**Files:**
- Modify: `src/data/eggs.ts` (5 eggs)
- Modify: `src/components/Footer.astro`, `src/pages/about.astro`, `src/pages/404.astro` (egg hooks; the wordmark and archive hooks already exist)
- Modify: `src/data/gmLines.ts` (egg-find tease lines)

**Interfaces:**
- Consumes: the progress-eggs wiring (Task 7) which selects each `EGGS[].selector`.
- Produces: 5 findable eggs across the site; GM `eggFound` lines tease the hunt.

- [ ] **Step 1: Expand `src/data/eggs.ts` to 5 eggs**

```ts
export interface Egg {
  id: string;
  selector: string;
}
export const EGGS: Egg[] = [
  { id: 'wordmark', selector: '[data-egg="wordmark"]' },
  { id: 'footer', selector: '[data-egg="footer"]' },
  { id: 'dossier', selector: '[data-egg="dossier"]' },
  { id: 'archive', selector: '[data-egg="archive"]' },
  { id: 'notfound', selector: '[data-egg="notfound"]' },
];
```
(The `wordmark` hook exists in SiteNav; the `archive` hook exists in the Works page header from Task 3.)

- [ ] **Step 2: Footer egg hook** — in `src/components/Footer.astro`, add `data-egg="footer"` to the status line:
```astro
      <p class="footer__status" data-egg="footer">SYSTEM ONLINE // ALL SIGNALS NOMINAL</p>
```

- [ ] **Step 3: About egg hook** — in `src/pages/about.astro`, add `data-egg="dossier"` to the portrait tag figcaption:
```astro
        <figcaption class="about__portrait-tag" data-egg="dossier" aria-hidden="true">
```

- [ ] **Step 4: 404 egg hook** — in `src/pages/404.astro`, add `data-egg="notfound"` to a visible element (for example the "404" heading or the GM line element). Pick the heading:
```astro
  <h1 ... data-egg="notfound">404</h1>
```
(Use the actual existing heading element in 404.astro; add the attribute to it.)

- [ ] **Step 5: GM egg tease lines** — in `src/data/gmLines.ts`, replace the `eggFound` pool with lines that tease the hunt (sarcastic, not mean, no em dashes):
```ts
  eggFound: [
    "Datashard logged. There are more. Keep turning things over.",
    "Found one. The map is hiding others. Obviously.",
    "Nice. A real one. Most people never look this hard.",
  ],
```

- [ ] **Step 6: Build and verify all five hooks ship**

Run: `npm run build`
Then:
```bash
for sel in wordmark footer dossier archive notfound; do
  echo -n "$sel: "; grep -rho "data-egg=\"$sel\"" dist/client 2>/dev/null | head -1 || echo MISSING
done
```
Expected: each of the five `data-egg` hooks appears in the built output (wordmark+footer on every page; dossier on /about; archive on /works; notfound on /404).

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/data/eggs.ts src/data/gmLines.ts src/components/Footer.astro src/pages/about.astro src/pages/404.astro
git commit -m "feat: 5-egg scavenger hooks across pages + GM tease lines"
```

---

### Task 9: Skill doc, full verify, push

**Files:**
- Modify: `~/.claude/skills/author-hub/SKILL.md`, `docs/author-hub-skill.md`

**Interfaces:**
- Produces: updated docs; production deploy.

- [ ] **Step 1: Update the /author-hub skill docs (both copies)**

Add: the new `/works` archive (auto-lists works), the `transmissions` collection + how to add a post (markdown file in `src/content/transmissions/`, frontmatter title/date/tag, then push) + that the nav/footer link to it, the egg registry now has 5 (add an egg = `{id,selector}` in `src/data/eggs.ts` plus a `data-egg` hook, and the all-found unlock reveals the Section Zero node + `/section-zero`), and the home what-is-this band. Keep all global constraints (no DCC, no em dashes, GM snarky, real-name brand). No em dashes in the doc.

- [ ] **Step 2: Full verification (incl. green-free + em-dash-free new copy)**

Run: `npm test && npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158' dist/ && echo "GREEN FOUND" || echo "dist green-free"
for f in works/index transmissions/index section-zero index about/index 404; do
  echo -n "$f em-dashes: "; grep -c '—' "dist/client/$f.html" 2>/dev/null || echo 0
done
```
Expected: all tests pass; build clean; dist green-free; no em dashes in new pages.

- [ ] **Step 3: Commit and push (auto-deploys)**

```bash
git add docs/author-hub-skill.md
git commit -m "docs: /author-hub skill for archive, transmissions, egg scavenger, section zero"
git push
```

- [ ] **Step 4: Verify on production after deploy**

Poll until live, then confirm manually:
```bash
curl -s https://chrisayersbooks.com/works/ | grep -c 'arch-card'        # archive live
curl -s https://chrisayersbooks.com/transmissions/ | grep -c 'tlog__item'
curl -s https://chrisayersbooks.com/ | grep -c 'pitch__h'                # welcome band
curl -s https://chrisayersbooks.com/section-zero/ | grep -c 'noindex'
```
Manual: WORKS nav goes to the archive; the home band + welcome line read right; finding all 5 eggs (wordmark, footer, /about dossier tag, /works header, /404 heading) shows the toast each time then the takeover, and SECTION ZERO appears on the overworld linking to /section-zero; reduced-motion disables the new animations; nothing green; no em dashes.

---

## Post-implementation notes (out of plan scope)

- Egg placements and the Section Zero / takeover copy can be tuned live.
- The locked "Something New" node can later become a coming-soon page.
