import { z } from "zod";

import { ApiError, handle } from "@/lib/api";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/normalize";
import { checkRateLimit } from "@/lib/auth/rate-limit";

/**
 * First-time activation: proves the visitor is one of VMA's pre-approved
 * users (email + documento matching a row seeded by `scripts/import-users.mjs`
 * from the real registration sheet) and lets them set their own password —
 * the documento is a one-time proof of identity, never the ongoing
 * credential (see the plan's rationale: it isn't a secret, and storing it
 * as a password would misuse protected personal data).
 */
const activateSchema = z.object({
  email: z.email(),
  documento: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(200),
});

const GENERIC_ERROR =
  "Los datos no coinciden con un registro conocido, o la cuenta ya fue activada.";

export const POST = handle(async (req) => {
  const input = activateSchema.parse(await req.json());
  const email = normalizeEmail(input.email);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`activate:${ip}:${email}`)) {
    throw new ApiError(429, "rate_limited", "Demasiados intentos. Intenta de nuevo más tarde.");
  }

  const db = getDb();

  const approved = db
    .prepare("SELECT documento FROM approved_users WHERE email = ?")
    .get(email) as { documento: string } | undefined;

  if (!approved || approved.documento !== input.documento.trim()) {
    throw new ApiError(401, "not_approved", GENERIC_ERROR);
  }

  const existing = db
    .prepare("SELECT email FROM accounts WHERE email = ?")
    .get(email);
  if (existing) {
    throw new ApiError(401, "not_approved", GENERIC_ERROR);
  }

  const passwordHash = await hashPassword(input.password);
  db.prepare(
    "INSERT INTO accounts (email, password_hash) VALUES (?, ?)",
  ).run(email, passwordHash);

  await createSession(email);

  return { activated: true };
});
