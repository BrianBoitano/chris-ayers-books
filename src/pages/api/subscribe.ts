// Email-list capture API — stores subscribers in Upstash Redis.
//
// Datastore: the same Upstash Redis the reactions API uses (REST, no SDK).
// Storage model: a sorted set `subscribers:list` where member = email and
// score = first-seen epoch ms. ZADD ... NX keeps the original signup time on
// repeat submits and dedupes for free.
//
// Required env (injected by the Upstash / Vercel Marketplace integration):
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   (or KV_REST_API_URL + KV_REST_API_TOKEN)
//
// Optional env for export:
//   SUBSCRIBE_ADMIN_TOKEN — when set, GET /api/subscribe?token=... returns the
//   list as CSV. When unset, GET is disabled (403) so the list is never public.
//
// GRACEFUL DEGRADATION: no creds -> POST returns {ok:false,disabled:true} and
// the form shows a fallback message. The page never 500s.

import type { APIRoute } from 'astro';
import {
  validateSubscribe,
  SUBSCRIBE_RATE_LIMIT,
  SUBSCRIBE_RATE_TTL_SECONDS,
} from '../../lib/subscribeRules';

export const prerender = false;

const SET_KEY = 'subscribers:list';

interface UpstashCreds {
  url: string;
  token: string;
}

function getCreds(): UpstashCreds | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

async function upstashSingle(creds: UpstashCreds, cmd: (string | number)[]): Promise<any> {
  const res = await fetch(creds.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

async function upstashPipeline(
  creds: UpstashCreds,
  cmds: (string | number)[][]
): Promise<any[]> {
  const res = await fetch(`${creds.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for') || '';
  const first = xff.split(',')[0]?.trim();
  return first || 'unknown';
}

// ---- POST: add an email to the list ----------------------------------------
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'bad json' }, 400);
    }

    const valid = validateSubscribe(body as any);
    if (!valid) {
      // Could be invalid email OR a tripped honeypot. If the honeypot was
      // filled, pretend success so bots get no signal; otherwise 400.
      const honeypot =
        body && typeof (body as any).company === 'string' &&
        (body as any).company.trim().length > 0;
      if (honeypot) return json({ ok: true, subscribed: true });
      return json({ ok: false, error: 'invalid email' }, 400);
    }

    const creds = getCreds();
    if (!creds) return json({ ok: false, disabled: true });

    const ip = clientIp(request);
    const rlKey = `rl:sub:${ip}`;

    // Best-effort per-IP rate limit.
    try {
      const rl = await upstashPipeline(creds, [
        ['INCR', rlKey],
        ['EXPIRE', rlKey, String(SUBSCRIBE_RATE_TTL_SECONDS)],
      ]);
      const hits = Number(rl?.[0]?.result ?? 0);
      if (Number.isFinite(hits) && hits > SUBSCRIBE_RATE_LIMIT) {
        return json({ ok: true, subscribed: true, limited: true });
      }
    } catch {
      // rate-limit infra down — proceed best-effort
    }

    // ZADD NX: insert with first-seen timestamp, never overwrite an existing one.
    await upstashSingle(creds, ['ZADD', SET_KEY, 'NX', String(Date.now()), valid.email]);
    return json({ ok: true, subscribed: true });
  } catch {
    return json({ ok: false, disabled: true });
  }
};

// ---- GET: token-gated CSV export -------------------------------------------
export const GET: APIRoute = async ({ url }) => {
  const adminToken = process.env.SUBSCRIBE_ADMIN_TOKEN;
  // No token configured -> export disabled (never expose the list publicly).
  if (!adminToken) return json({ ok: false, error: 'export disabled' }, 403);

  const provided = url.searchParams.get('token');
  if (!provided || provided !== adminToken) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  const creds = getCreds();
  if (!creds) return json({ ok: false, disabled: true }, 503);

  try {
    // ZRANGE 0 -1 WITHSCORES -> [email, ts, email, ts, ...]
    const r = await upstashSingle(creds, ['ZRANGE', SET_KEY, '0', '-1', 'WITHSCORES']);
    const flat: unknown[] = Array.isArray(r?.result) ? r.result : [];
    const rows: string[] = ['email,subscribed_at_iso'];
    for (let i = 0; i + 1 < flat.length; i += 2) {
      const email = String(flat[i]).replace(/"/g, '""');
      const ts = Number(flat[i + 1]);
      const iso = Number.isFinite(ts) ? new Date(ts).toISOString() : '';
      rows.push(`"${email}",${iso}`);
    }
    return new Response(rows.join('\n'), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="subscribers.csv"',
      },
    });
  } catch {
    return json({ ok: false, error: 'read failed' }, 500);
  }
};
