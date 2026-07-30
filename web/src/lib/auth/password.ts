import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/** `scrypt` (Node built-in, NIST-recommended KDF) — no new dependency for
 * password hashing. Stored as `salt:hash`, both hex. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  // Lengths must match before timingSafeEqual (it throws on mismatch) —
  // a corrupt/foreign hash should fail closed, not throw past this check.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
