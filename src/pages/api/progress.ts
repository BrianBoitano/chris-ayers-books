// Save/load API for the playable reader (The Haunt). Stores a player's character +
// progress in Upstash Redis under a short save code, so a player can resume on any
// device by entering the code. No accounts, no passwords.
//
// Reuses the same Upstash REST creds as the email list. Graceful degradation: with
// no creds, POST returns {ok:false,disabled:true} and the client falls back to
// local-only save. The page never 500s.
//
//   POST /api/progress  { code, save }   -> { ok, code }   (save: object, capped)
//   GET  /api/progress?code=XXXXXX        -> { ok, save }   or { ok:false }

import type { APIRoute } from 'astro';

export const prerender = false;

const PREFIX = 'haunt:save:';
const TTL_SECONDS = 60 * 60 * 24 * 365; // a year
const MAX_BYTES = 16 * 1024;
const CODE_RE = /^[A-Z0-9]{6,12}$/;

interface Creds { url: string; token: string; }

function getCreds(): Creds | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function upstash(creds: Creds, cmd: (string | number)[]): Promise<any> {
  const res = await fetch(creds.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creds.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0]?.trim() || 'unknown';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }

    const code = String(body?.code || '').toUpperCase();
    if (!CODE_RE.test(code)) return json({ ok: false, error: 'bad code' }, 400);
    const save = body?.save;
    if (!save || typeof save !== 'object') return json({ ok: false, error: 'bad save' }, 400);

    const payload = JSON.stringify(save);
    if (payload.length > MAX_BYTES) return json({ ok: false, error: 'too big' }, 413);

    const creds = getCreds();
    if (!creds) return json({ ok: false, disabled: true });

    // best-effort per-IP write rate limit
    try {
      const ip = clientIp(request);
      const rl = await upstash(creds, ['INCR', `rl:save:${ip}`]);
      await upstash(creds, ['EXPIRE', `rl:save:${ip}`, '60']);
      if (Number(rl?.result ?? 0) > 60) return json({ ok: true, code, limited: true });
    } catch { /* proceed */ }

    await upstash(creds, ['SET', `${PREFIX}${code}`, payload, 'EX', String(TTL_SECONDS)]);
    return json({ ok: true, code });
  } catch {
    return json({ ok: false, disabled: true });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const code = String(url.searchParams.get('code') || '').toUpperCase();
  if (!CODE_RE.test(code)) return json({ ok: false, error: 'bad code' }, 400);
  const creds = getCreds();
  if (!creds) return json({ ok: false, disabled: true });
  try {
    const r = await upstash(creds, ['GET', `${PREFIX}${code}`]);
    const raw = r?.result;
    if (!raw) return json({ ok: false, notfound: true });
    return json({ ok: true, save: JSON.parse(raw) });
  } catch {
    return json({ ok: false, error: 'read failed' }, 500);
  }
};
