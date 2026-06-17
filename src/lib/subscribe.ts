// Browser-side subscribe helper. Talks to /api/subscribe. Best-effort:
// resolves to a small result object the form can branch on.

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'disabled' | 'error' };

export async function subscribe(email: string, honeypot = ''): Promise<SubscribeResult> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, company: honeypot }),
    });
    if (res.status === 400) return { ok: false, reason: 'invalid' };
    if (!res.ok) return { ok: false, reason: 'error' };
    const data = await res.json();
    if (data?.disabled) return { ok: false, reason: 'disabled' };
    if (data?.subscribed) return { ok: true };
    return { ok: false, reason: 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
