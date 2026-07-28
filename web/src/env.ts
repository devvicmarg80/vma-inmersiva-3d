/**
 * Validated environment variables.
 *
 * `getServerEnv()` holds server-only values (secrets) — never read it from
 * client code; on the client those values are `undefined`.
 *
 * A missing/invalid variable fails fast with a clear zod error rather than
 * surfacing as a confusing runtime bug later.
 *
 * Ported from next16-claude-starter (Textura); trimmed to what this project
 * uses (the starter's `NEXT_PUBLIC_SITE_URL` / SEO-metadata plumbing wasn't
 * pulled in — this project's SEO metadata is still set directly in
 * `layout.tsx`).
 */

import { z } from "zod";

/**
 * Treat an empty env var as unset.
 *
 * `cp .env.example .env` leaves declared-but-blank keys (`CONTACT_ENDPOINT=`),
 * which reach us as `""` — and `""` is not `undefined`, so an `.optional()`
 * schema would reject it as "Invalid URL". Without this, the documented setup
 * flow would break every optional variable the moment someone copied the
 * example file.
 */
const optionalUrl = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

const serverSchema = z.object({
  /** Optional upstream the contact endpoint forwards leads to (CRM / webhook). */
  CONTACT_ENDPOINT: optionalUrl(),
});

let cachedServerEnv: z.infer<typeof serverSchema> | undefined;

/**
 * Server-only env. Call from route handlers / server code only — parsed
 * lazily so the client bundle never evaluates it.
 */
export function getServerEnv() {
  cachedServerEnv ??= serverSchema.parse({
    CONTACT_ENDPOINT: process.env.CONTACT_ENDPOINT,
  });
  return cachedServerEnv;
}
