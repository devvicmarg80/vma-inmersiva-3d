const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** In-memory only — resets on every deploy/restart. A real limiter (Redis
 * or a DB-backed counter) would survive restarts, but at this project's
 * scale a login endpoint getting hammered *during* a deploy window is an
 * acceptable gap, not worth a new service for. */
const attempts = new Map<string, { count: number; resetAt: number }>();

/** `key` should combine IP + email so one bad actor can't lock out a
 * legitimate user's email by spamming failed attempts for it, and one IP
 * can't be blocked forever from a single stale entry. Returns `true` if
 * the request is allowed to proceed. */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}
