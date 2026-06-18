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

  let takeoverOpen = false;

  const showTakeover = () => {
    const ov = document.querySelector<HTMLElement>('[data-gm-takeover]');
    if (!ov) return;
    if (takeoverOpen) return; takeoverOpen = true;
    ov.hidden = false;
    const close = ov.querySelector<HTMLElement>('[data-gm-takeover-close]');
    const hide = () => { ov.hidden = true; takeoverOpen = false; document.removeEventListener('keydown', onKey); };
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
        // On the final find the full-screen takeover overlay is the payoff, so we skip
        // the toast (it would just sit behind the overlay). Toast only the earlier finds.
        if (!isComplete(p, TOTAL)) toast(`DATASHARD ${p.eggs.length} / ${TOTAL} RECOVERED`);
        refresh(true);
      }
    });
  }
}
