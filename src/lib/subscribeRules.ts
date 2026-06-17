// Pure, dependency-free email validation/normalization for the subscribe API.
// Shared by the server route and unit-testable in isolation.

/** Max accepted email length (RFC 5321 practical limit). */
export const MAX_EMAIL_LEN = 254;

// Pragmatic email check: one @, no spaces, a dotted domain, sane local part.
// Not RFC-perfect (nothing sane is) but rejects the obvious junk.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Normalize an email for storage: trim + lowercase. */
export function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

/** True when the (already-normalized or raw) value is a plausible email. */
export function isValidEmail(raw: unknown): boolean {
  const e = normalizeEmail(raw);
  return e.length > 0 && e.length <= MAX_EMAIL_LEN && EMAIL_RE.test(e);
}

export interface SubscribeInput {
  email: unknown;
  /** Honeypot: must be empty. Bots tend to fill every field. */
  company?: unknown;
}

export interface ValidatedSubscribe {
  email: string;
}

/**
 * Validate a subscribe POST body. Returns the normalized email on success,
 * or null when invalid (caller responds 400). A filled honeypot also returns
 * null so the caller can silently no-op without storing the bot.
 */
export function validateSubscribe(input: SubscribeInput): ValidatedSubscribe | null {
  // Honeypot tripped -> reject (caller should fake-succeed, not store).
  if (typeof input.company === 'string' && input.company.trim().length > 0) return null;
  if (!isValidEmail(input.email)) return null;
  return { email: normalizeEmail(input.email) };
}

/** Per-IP cap on signups before further attempts are ignored, per TTL window. */
export const SUBSCRIBE_RATE_LIMIT = 10;
export const SUBSCRIBE_RATE_TTL_SECONDS = 3600;
