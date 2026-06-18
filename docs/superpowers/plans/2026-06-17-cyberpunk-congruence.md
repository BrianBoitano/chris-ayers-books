# Site-Wide Cyberpunk Congruence + Full-Screen Overworld Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make chrisayersbooks.com one congruent Cyberpunk-2077 neon-noir brand end to end, make the home network fill the first screen with a corner-bracket node reticle (no more cursor overlapping labels), and retire the old green entirely, all while keeping body copy readable and the logic + accessibility fallbacks untouched.

**Architecture:** A single cyberpunk token set in `tokens.css` is the source of truth; the legacy `--green`/`--red` tokens are repointed to it so existing `var(--green)` rules flip to the new palette in one move. Per-area tasks then add the structural cyberpunk framing (global grain background, clipped-corner nav/footer/panels, full-screen stage, node reticle) and refine links to cyan. This is a presentation + layout pass: no logic, content-model, API, or routing changes.

**Tech Stack:** Astro 5, CSS (custom properties, clip-path, SVG turbulence grain), Vitest (unchanged logic only). Existing components/libs reused as-is.

## Global Constraints

- Congruent palette: `--cy-yellow:#fcee0a` (primary), `--cy-cyan:#00e5ff` (secondary/links), `--cy-red:#ff2e4d` (locked/danger), near-black bases `#040406`/`#080a10`. NO green anywhere in shipped CSS: after this work, `grep` of `dist/` for `#39ff9e`, `57, 255, 158`, `57,255,158`, and `#1bd96a` returns nothing.
- No Dungeon Crawler Carl / DCC references in reader-facing copy (guardrail rule statements excepted).
- No em dashes in reader-facing copy (nav, footer flavor line, headings, labels, scroll cue, GM lines).
- GM voice sarcastic but never mean. Real-name author brand (Christopher Ayers).
- Body copy stays high-contrast (WCAG AA) and readable; grain is subtle and never reduces legibility.
- All animations (grain, scanlines, reticle pulse, idle) disabled under `prefers-reduced-motion: reduce`.
- Logic, content model, email API, SEO, routing, and the home accessibility fallback (real node links, keyboard, no-JS) are UNCHANGED. `npm test` stays green throughout.
- Commit after every task. Repo `~/chris-ayers-books`, remote `origin` (auto-deploys). Do NOT push except in the final task.

---

### Task 1: Cyberpunk palette tokens (one-move congruence)

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css` (link color to cyan; replace any literal green)

**Interfaces:**
- Consumes: nothing.
- Produces: tokens `--cy-yellow`, `--cy-cyan`, `--cy-red`, `--link`; legacy `--green` now resolves to yellow, `--red` to `--cy-red`. Every `var(--green)` consumer across the site flips to yellow automatically.

- [ ] **Step 1: Replace `src/styles/tokens.css` with the cyberpunk token set**

```css
:root {
  /* Cyberpunk-2077 congruent palette */
  --cy-yellow:#fcee0a; --cy-cyan:#00e5ff; --cy-red:#ff2e4d;

  --bg-0:#040406; --bg-1:#080a10; --bg-2:#0d1014;
  --line:#1c2330; --muted:#b6c0cd; --dim:#8e99a8;
  --ink:#f2f5f8;

  /* Legacy aliases repointed to the cyberpunk palette so existing
     var(--green)/var(--red) rules inherit the new look in one move.
     --green = the primary accent (yellow). Links use --link (cyan). */
  --green: var(--cy-yellow);
  --red: var(--cy-red);
  --amber: var(--cy-yellow);
  --link: var(--cy-cyan);

  --font-mono: ui-monospace,'SFMono-Regular',Menlo,monospace;
  --font-display: 'Archivo',ui-sans-serif,system-ui,sans-serif;
  --maxw: 1100px;
  --space: clamp(1rem, 2vw, 1.5rem);
}
```

- [ ] **Step 2: Point base body links to cyan in `src/styles/global.css`**

Find the base anchor rule (around line 33, `color: var(--green)`). Change link color to cyan and the focus outline accent to yellow:
- the `a { ... color: var(--green); }` base link color becomes `color: var(--link);`
- any focus outline `outline: 2px solid var(--green)` stays yellow via `var(--green)` (now yellow) — leave those.
- If any literal `#39ff9e`/`rgba(57, 255, 158, ...)` appears in global.css, replace the hex with `var(--cy-yellow)` and the rgba with `rgba(252, 238, 10, <same alpha>)`.

- [ ] **Step 3: Build and verify the palette flipped with no green left in these two files' output**

Run: `npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158|#1bd96a' src/styles/ || echo "no green in styles (correct)"
```
Expected: build clean; no green hexes remain in `src/styles/`.

- [ ] **Step 4: Run the suite (logic untouched)**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css
git commit -m "feat: cyberpunk palette tokens; retire green (repoint to yellow/cyan)"
```

---

### Task 2: Global grained background

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: a site-wide decorative background (near-black + faint grid + low-opacity grain) behind all page content, reduced-motion aware, not harming body contrast.

- [ ] **Step 1: Add a decorative background layer to `src/layouts/BaseLayout.astro`**

In the `<body>`, immediately after the opening `<body>` tag (before `<SiteNav />`), add a single decorative layer (aria-hidden):

```astro
    <div class="site-bg" aria-hidden="true"></div>
```

- [ ] **Step 2: Add the background CSS to `src/styles/global.css`** (append at end)

```css
/* Site-wide cyberpunk backdrop: faint grid + subtle grain behind all content. */
body { position: relative; background: var(--bg-0); }
.site-bg {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(80% 60% at 50% -10%, rgba(0,229,255,.06), transparent 60%),
    radial-gradient(70% 50% at 100% 100%, rgba(255,46,77,.05), transparent 60%),
    linear-gradient(var(--bg-0), #06070b);
}
.site-bg::before {
  content:""; position:absolute; inset:0;
  background-image:linear-gradient(rgba(0,229,255,.05) 1px,transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,.05) 1px, transparent 1px);
  background-size:46px 46px;
  -webkit-mask-image:radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 80%);
  mask-image:radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 80%);
}
.site-bg::after {
  content:""; position:absolute; inset:0; opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
@media (prefers-reduced-motion: reduce) { .site-bg::after { display:none; } }
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Then:
```bash
grep -c 'site-bg' dist/client/index.html   # expect >=1 (the layer renders on every page)
```
Expected: build clean; the background layer is present.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: site-wide cyberpunk grained background (reduced-motion aware)"
```

---

### Task 3: Cyberpunk nav bar

**Files:**
- Modify: `src/components/SiteNav.astro`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: a clipped-corner cyberpunk top bar; mono uppercase links with neon hover/focus; a thin HUD accent line; neon brand mark. Semantics/keyboard/aria unchanged.

- [ ] **Step 1: Restyle `src/components/SiteNav.astro`**

In its `<style>` block:
- Give the nav container a bottom HUD accent line and a clipped corner: add to the nav/header rule
  `border-bottom:1px solid var(--line); position:relative;` and a `::after` accent:
  ```css
  .nav::after { content:""; position:absolute; left:0; bottom:-1px; width:120px; height:2px; background:var(--cy-yellow); box-shadow:0 0 8px var(--cy-yellow); }
  ```
  (Use the actual top-level nav class name in the file; if it is `header`/`.site-nav`, apply there.)
- Nav links: mono, uppercase, letter-spaced, cyan, with a yellow hover/focus:
  ```css
  .nav a { font-family:var(--font-mono); text-transform:uppercase; letter-spacing:.14em; font-size:13px; color:var(--cy-cyan); }
  .nav a:hover, .nav a:focus-visible { color:var(--cy-yellow); text-shadow:0 0 8px rgba(252,238,10,.6); }
  ```
- Any existing `var(--green)` in this file now renders yellow (fine). Replace any LITERAL green hex (`#39ff9e`) with `var(--cy-yellow)`. The "BRIBE THE AUTHOR" CTA stays yellow with its clipped corner.
- Keep all existing markup, aria-expanded/controls, the data-egg="wordmark" attribute, and focus-visible outlines intact.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158' src/components/SiteNav.astro || echo "no literal green in SiteNav (correct)"
```
Expected: build clean; no literal green left in SiteNav.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteNav.astro
git commit -m "feat: cyberpunk nav bar (clipped, mono cyan links, yellow HUD accent)"
```

---

### Task 4: Cyberpunk footer + follow FAB

**Files:**
- Modify: `src/components/Footer.astro`
- Modify: `src/components/FollowMe.astro`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: a clipped footer panel with mono neon links, neon dividers, and a short flavor "system status" line; the floating FAB recolored to neon (no green).

- [ ] **Step 1: Restyle `src/components/Footer.astro`**

- Replace the two `color: var(--green)` (lines ~104, ~178) so links read cyan: `color: var(--link);` with a yellow hover `:hover{ color:var(--cy-yellow); }`.
- Give the footer a top neon divider and mono treatment: on the footer container add
  `border-top:1px solid var(--line);` and a `::before` accent line
  `content:""; display:block; height:2px; width:120px; background:var(--cy-cyan); box-shadow:0 0 8px var(--cy-cyan); margin-bottom:1rem;` (adapt to the file's structure).
- Add ONE short flavor line near the copyright, in GM-adjacent voice, mono, dim, NO em dashes, NO DCC:
  `<p class="footer__status">SYSTEM ONLINE // ALL SIGNALS NOMINAL</p>` styled
  `.footer__status{ font-family:var(--font-mono); font-size:11px; letter-spacing:.16em; color:var(--dim); }`
- Replace any literal green hex with `var(--cy-yellow)`.

- [ ] **Step 2: Recolor `src/components/FollowMe.astro`**

Replace every `var(--green)` usage's INTENT with the neon palette: the FAB border/text become cyan, the open/active background becomes yellow. Concretely, the rules at lines ~93,94,98,123: set border/text to `var(--cy-cyan)`, focus outline `var(--cy-yellow)`, and the filled `background: var(--green)` (line ~123) to `background: var(--cy-yellow); color:#0a0a04;`. Replace any literal green hex.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158' src/components/Footer.astro src/components/FollowMe.astro || echo "no literal green in footer/fab (correct)"
```
Expected: build clean; footer flavor line present; no literal green.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro src/components/FollowMe.astro
git commit -m "feat: cyberpunk footer panel + neon follow FAB"
```

---

### Task 5: Full-screen overworld stage + scroll cue + node reticle

**Files:**
- Modify: `src/components/Overworld.astro`
- Modify: `src/pages/index.astro` (no structural change beyond what is needed; keep EmailCapture + join section below)

**Interfaces:**
- Consumes: the existing `[data-cursor]` element and breach.ts positioning.
- Produces: a stage that fills the first screen; a scroll cue at the bottom; the cursor rendered as a corner-bracket reticle framing the current node (z-index BELOW the node terminal so labels are never covered).

- [ ] **Step 1: Make the stage full-screen in `src/components/Overworld.astro`**

Change the `.overworld` height rule from `height:min(72vh,560px)` to fill the first screen under the nav:
```css
  .overworld { min-height: calc(100svh - 64px); height: calc(100svh - 64px); ... }
```
(Keep the rest of the `.overworld` rule. `64px` approximates the nav height; if the nav is taller, adjust so the stage bottom + HUD are visible without the page scrolling on load.)

- [ ] **Step 2: Replace the cursor diamond with a corner-bracket reticle**

Replace the `.ow-cursor` rule. The reticle is a box centered on the node (breach.ts already sets `left/top` to the node center via `translate(-50%,-50%)` implied by the existing rule — keep the transform), sized larger than the ~148px node, drawn as four glowing corner brackets via a conic/border trick, BEHIND the node:

```css
  .ow-cursor {
    position:absolute; z-index:3;            /* below nodes (z-index 4) so labels stay on top */
    width:184px; height:92px;
    transform:translate(-50%,-50%);
    pointer-events:none;
    background:
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) left top,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) left top,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) right top,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) right top,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) left bottom,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) left bottom,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) right bottom,
      linear-gradient(var(--cy-yellow),var(--cy-yellow)) right bottom;
    background-repeat:no-repeat;
    background-size:16px 2px, 2px 16px;   /* horizontal + vertical arm of each corner */
    filter:drop-shadow(0 0 6px rgba(252,238,10,.7));
    transition:left .18s, top .18s;
  }
  @media (prefers-reduced-motion: reduce) { .ow-cursor { transition:none; } }
```

(The eight backgrounds form the four L-shaped corner brackets; `background-size` alternates per the list so each corner gets one 16x2 horizontal arm and one 2x16 vertical arm.)

Note: breach.ts already sets `cursor.style.transition` for reduced-motion and positions left/top; the reticle keeps using those. No breach.ts change is required because positioning is unchanged; if the existing inline `transition` set by breach.ts conflicts, leave breach.ts as-is (its value matches).

- [ ] **Step 3: Add a scroll cue at the bottom of the stage**

Inside `.overworld`, before the closing `</section>`, after the HUD, add:
```astro
  <a class="ow-scroll" href="#join" aria-label="Scroll to newsletter and links">
    <span>MORE BELOW</span>
    <span class="ow-scroll-chev" aria-hidden="true">v</span>
  </a>
```
Style:
```css
  .ow-scroll { position:absolute; left:50%; bottom:54px; transform:translateX(-50%); z-index:7;
    display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none;
    font-family:var(--font-mono); font-size:10px; letter-spacing:.22em; color:var(--cy-cyan); }
  .ow-scroll-chev { font-size:14px; animation:owbob 1.4s ease-in-out infinite; }
  @keyframes owbob { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { .ow-scroll-chev { animation:none; } }
```
Use `v` (the letter) not an em dash or special char; keep copy "MORE BELOW" (no em dashes).

- [ ] **Step 4: Give the join section a scroll target in `src/pages/index.astro`**

Ensure the `<section class="join">` has `id="join"` so the scroll cue anchors to it:
```astro
  <section class="join" id="join">
    <EmailCapture />
  </section>
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Then:
```bash
grep -c 'ow-scroll' dist/client/index.html       # expect >=1
grep -o '100svh' dist/client/_astro/*.css | head  # stage uses viewport height
grep -c 'data-overworld' dist/client/index.html    # still 1 (stage intact)
grep -c 'net-node' dist/client/index.html          # still one per work
```
Expected: build clean; full-screen stage; scroll cue present; nodes + stage intact.

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: all pass (no logic changed).

- [ ] **Step 7: Commit**

```bash
git add src/components/Overworld.astro src/pages/index.astro
git commit -m "feat: full-screen overworld + scroll cue + corner-bracket node reticle"
```

---

### Task 6: Reading pages + cards to the cyberpunk frame

**Files:**
- Modify: `src/pages/works/[slug].astro`
- Modify: `src/pages/books/[slug].astro`
- Modify: `src/pages/about.astro`
- Modify: `src/components/BookCard.astro`
- Modify: `src/components/BuyButton.astro`
- Modify: `src/components/EmailCapture.astro`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: reading content framed in clipped-corner terminal panels with neon headings/dividers, readable body, and all literal greens retired.

- [ ] **Step 1: Frame the work + book + about content panels**

In `works/[slug].astro`, `books/[slug].astro`, and `about.astro`, wrap the primary content area with a clipped-corner terminal panel and neon heading treatment. Add a shared panel style to each page's `<style>` (or a shared class in global.css if cleaner):
```css
  .term-panel {
    background:rgba(8,8,12,.72); border:1px solid var(--line);
    clip-path:polygon(0 0,100% 0,100% 96%,98% 100%,0 100%);
    padding:1.5rem 1.6rem; }
  .term-panel h1, .term-panel h2 { font-family:var(--font-display); letter-spacing:.06em; }
  .term-panel h1 { text-shadow:1px 0 var(--cy-red),-1px 0 var(--cy-cyan); }
  /* body copy: high contrast + readable measure */
  .term-panel p { color:var(--ink); line-height:1.7; max-width:62ch; }
```
Apply `class="term-panel"` to the existing main content container on each page. In `works/[slug].astro` line ~52 replace `border-left: 3px solid var(--accent, var(--green))` so it reads `var(--accent, var(--cy-yellow))`.

- [ ] **Step 2: BookCard neon frame**

In `src/components/BookCard.astro`, replace the `var(--green)` fallbacks (lines ~133,145) with `var(--cy-yellow)` and give the cover an angular neon frame:
```css
  .cover { clip-path:polygon(0 0,100% 0,100% 92%,94% 100%,0 100%); border:1px solid var(--cy-yellow); box-shadow:0 0 14px rgba(252,238,10,.25); }
```
(adapt the selector to the actual cover element class). Title/labels use `var(--cy-yellow)`/`var(--cy-cyan)`.

- [ ] **Step 3: BuyButton neon**

In `src/components/BuyButton.astro` lines ~42,43 replace `var(--accent, var(--green, #39ff9e))` with `var(--accent, var(--cy-yellow))` (drop the green literal). Confirm the button reads as a yellow neon CTA with dark text and a clipped corner; add the clip if absent:
```css
  .buy { clip-path:polygon(0 0,100% 0,100% 68%,90% 100%,0 100%); }
```

- [ ] **Step 4: EmailCapture palette**

In `src/components/EmailCapture.astro` replace the green usages: line ~90 `color:var(--green)` (kicker) becomes `var(--cy-cyan)`; line ~145 `border-color:var(--green)` -> `var(--cy-yellow)`; line ~146 `box-shadow:... rgba(57,255,158,0.25)` -> `rgba(252,238,10,.25)` with `0 0 0 1px var(--cy-yellow)`; line ~183 `[data-state='ok'] color:var(--green)` -> `var(--cy-cyan)`. Keep the form, honeypot, and subscribe() wiring intact. The "NOTIFY ME" button becomes a yellow neon CTA.

- [ ] **Step 5: Build and verify no green remains in these files**

Run: `npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158|57,255,158' src/pages/works src/pages/books src/pages/about.astro src/components/BookCard.astro src/components/BuyButton.astro src/components/EmailCapture.astro || echo "no literal green in reading pages/cards (correct)"
```
Expected: build clean; no literal green.

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/works/[slug].astro src/pages/books/[slug].astro src/pages/about.astro src/components/BookCard.astro src/components/BuyButton.astro src/components/EmailCapture.astro
git commit -m "feat: cyberpunk terminal frame on reading pages; retire green in cards"
```

---

### Task 7: 404 theme, full green sweep, skill note, verify, push

**Files:**
- Modify: `src/pages/404.astro`
- Modify: `~/.claude/skills/author-hub/SKILL.md` and `docs/author-hub-skill.md`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: a themed 404; a guaranteed-green-free shipped site; updated skill docs; production deploy.

- [ ] **Step 1: Theme `src/pages/404.astro`**

Give it the red-accented cyberpunk treatment: the "404" in `var(--cy-red)` with a glitch text-shadow `1px 0 var(--cy-cyan),-1px 0 var(--cy-yellow)`, the GM line in mono, and the home link as a cyan link. Keep `pickLine('notFound', 0)` and the home link intact. No em dashes.

- [ ] **Step 2: Build, then sweep the ENTIRE dist for any residual green**

Run: `npm run build`
Then:
```bash
grep -RInE '#39ff9e|57, ?255, ?158|57,255,158|#1bd96a' dist/ && echo "GREEN FOUND -- fix before commit" || echo "DIST IS GREEN-FREE (correct)"
```
Expected: `DIST IS GREEN-FREE`. If anything is found, trace it to its source file, replace with the palette equivalent (`var(--cy-yellow)`/`var(--cy-cyan)`), rebuild, and re-run until clean.

- [ ] **Step 3: Update the /author-hub skill docs**

In `~/.claude/skills/author-hub/SKILL.md` (and mirror into `docs/author-hub-skill.md`): add a short "Palette" note that the site uses one cyberpunk token set in `src/styles/tokens.css` (`--cy-yellow` primary, `--cy-cyan` links/secondary, `--cy-red` locked/danger; no green), so future copy and components stay on-palette. No em dashes; keep existing global constraints.

- [ ] **Step 4: Full verification**

Run: `npm test && npm run build`
Expected: all suites pass; build clean; dist green-free (Step 2).

- [ ] **Step 5: Commit and push (auto-deploys)**

```bash
git add src/pages/404.astro docs/author-hub-skill.md
git commit -m "feat: themed 404; green sweep; author-hub palette note"
git push
```

- [ ] **Step 6: Verify on production after deploy**

Poll until live:
```bash
curl -s https://chrisayersbooks.com/ | grep -c 'ow-scroll'   # expect 1 once deployed
```
Expected: the full-screen overworld + scroll cue is live. Manually confirm in a browser: full-screen network on arrival, node reticle frames "The Broadcast" without covering its label, scrolling reveals the signup + footer, and Works/book/About/404 all read as one cyberpunk brand with readable body copy and no green.

---

## Post-implementation notes (out of plan scope)

- Exact nav-height offset for the stage and scroll-cue copy can be tuned live.
- Footer flavor-line and node-label copy can be iterated in GM voice.
