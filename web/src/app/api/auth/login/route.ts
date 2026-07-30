import { z } from "zod";

import { ApiError, handle } from "@/lib/api";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/normalize";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

// One message for "no account" and "wrong password" alike — a specific
// "that email isn't registered" response would let the form be used to
// enumerate which emails exist. The modal always offers the "activar
// cuenta" toggle regardless, so a not-yet-activated user still has a way
// forward without the server confirming their status.
const GENERIC_ERROR = "Credenciales inválidas.";

export const POST = handle(async (req) => {
  const input = loginSchema.parse(await req.json());
  const email = normalizeEmail(input.email);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`login:${ip}:${email}`)) {
    throw new ApiError(429, "rate_limited", "Demasiados intentos. Intenta de nuevo más tarde.");
  }

  const account = getDb()
    .prepare("SELECT password_hash FROM accounts WHERE email = ?")
    .get(email) as { password_hash: string } | undefined;

  if (!account || !(await verifyPassword(input.password, account.password_hash))) {
    throw new ApiError(401, "invalid_credentials", GENERIC_ERROR);
  }

  await createSession(email);

  return { authenticated: true };
});
