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
  /** Comma-separated emails allowed to see /portal's contact-message inbox.
   * No admin *role* in the DB by design — `approved_users` is seeded from
   * VMA's external registration sheet (investors/allies), not a staff
   * directory, so "is an approved user" and "is VMA staff" are different
   * things. This env var is the simplest thing that keeps other approved
   * users' leads private without a role-management UI nobody asked for. */
  ADMIN_EMAILS: z.preprocess(
    (v) => (v === "" || v === undefined ? [] : String(v).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)),
    z.array(z.string()),
  ),
});

let cachedServerEnv: z.infer<typeof serverSchema> | undefined;

/**
 * Server-only env. Call from route handlers / server code only — parsed
 * lazily so the client bundle never evaluates it.
 */
export function getServerEnv() {
  cachedServerEnv ??= serverSchema.parse({
    CONTACT_ENDPOINT: process.env.CONTACT_ENDPOINT,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  });
  return cachedServerEnv;
}
