// Gated free-ebook delivery for the ENCORE readers.
//
// The EPUBs are NOT served from a static path. Instead they live embedded in
// src/lib/ebooks-data.ts and are streamed only by this function, and only with a
// valid completion token. A reader earns the token by POSTing a real ending
// section of the book (a soft, low-friction gate, not DRM):
//
//   POST /api/ebook   { slug, section }   -> { ok, token }   (section must be a real ending)
//   GET  /api/ebook?slug=<slug>&t=<token>  -> the EPUB bytes  (403 without a valid token)
//
// The token is an HMAC over the slug + a coarse time bucket, signed with a server
// secret (reuses the Upstash/KV token already present in the env; falls back to an
// EBOOK_SECRET env var). If NO secret is configured the gate opens (never blocks a
// legit download), so the site degrades gracefully.

import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { EBOOKS_B64, TERMINALS, TITLES } from '../../lib/ebooks-data';

export const prerender = false;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function secret(): string {
  return (
    process.env.EBOOK_SECRET ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ''
  );
}

// ~30-day buckets, so a leaked token self-expires in at most ~60 days while a player
// who finished is never nagged to re-claim within the window.
const BUCKET_MS = 1000 * 60 * 60 * 24 * 30;

function sign(slug: string, bucket: number): string {
  return crypto.createHmac('sha256', secret() || 'encore').update(`${slug}:${bucket}`).digest('hex').slice(0, 24);
}

function mint(slug: string): string {
  return sign(slug, Math.floor(Date.now() / BUCKET_MS));
}

function valid(slug: string, token: string): boolean {
  if (!secret()) return true; // no secret configured -> open mode, never block
  if (!token) return false;
  const b = Math.floor(Date.now() / BUCKET_MS);
  return token === sign(slug, b) || token === sign(slug, b - 1);
}

// POST { slug, section } -> mint a token if section is a genuine ending of the book.
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
  const slug = String(body?.slug || '');
  const section = Number(body?.section);
  if (!EBOOKS_B64[slug]) return json({ ok: false, error: 'unknown book' }, 404);
  const terminals = TERMINALS[slug] || [];
  if (!Number.isFinite(section) || !terminals.includes(section)) {
    return json({ ok: false, error: 'not an ending' }, 403);
  }
  return json({ ok: true, token: mint(slug), title: TITLES[slug] || slug });
};

// GET ?slug=&t= -> stream the EPUB if the token is valid.
export const GET: APIRoute = async ({ url }) => {
  const slug = String(url.searchParams.get('slug') || '');
  const token = String(url.searchParams.get('t') || '');
  const b64 = EBOOKS_B64[slug];
  if (!b64) return json({ ok: false, error: 'unknown book' }, 404);
  if (!valid(slug, token)) return json({ ok: false, error: 'play to an ending to unlock this ebook' }, 403);
  const bytes = Buffer.from(b64, 'base64');
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'application/epub+zip',
      'content-disposition': `attachment; filename="${slug}.epub"`,
      'content-length': String(bytes.length),
      'cache-control': 'private, no-store',
    },
  });
};
