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
  const onGmSay = (e: any) => setDaemon(e.detail?.context || 'idle');
  document.addEventListener('gm:say', onGmSay);
  const stopIdle = () => { clearInterval(idleTimer); document.removeEventListener('gm:say', onGmSay); };
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

  const placeCursor = (focus = false) => {
    const n = bySlug(current);
    if (cursor) { cursor.style.left = n.x + '%'; cursor.style.top = n.y + '%'; cursor.style.transition = reduceMotion ? 'none' : 'left .18s, top .18s'; }
    if (focus) n.el.querySelector<HTMLElement>('.term')?.focus({ preventScroll: true });
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
    if (k in keymap) { const to = move(nodes, edges, current, keymap[k] as Dir); if (to) { current = to; placeCursor(true); e.preventDefault(); } }
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
