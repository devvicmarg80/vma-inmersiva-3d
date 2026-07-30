import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

const COOKIE_NAME = "vma_session";
const SESSION_DAYS = 30;

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString();
}

/** Opaque random token in an httpOnly cookie, resolved against a `sessions`
 * row on every request — revocable server-side (logout actually invalidates
 * it), unlike a self-contained JWT. No session library needed at this scale. */
export async function createSession(email: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  getDb()
    .prepare(
      "INSERT INTO sessions (token, email, expires_at) VALUES (?, ?, ?)",
    )
    .run(token, email, expiresAt());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Current session's email, or `null` if there isn't a valid one — expired
 * rows are treated as absent (and opportunistically swept). */
export async function getSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getDb();
  const row = db
    .prepare("SELECT email, expires_at FROM sessions WHERE token = ?")
    .get(token) as { email: string; expires_at: string } | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return { email: row.email };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  store.delete(COOKIE_NAME);
}

/** For server components on protected routes — no valid session sends the
 * visitor back to Home instead of rendering a bare 401. */
export async function requireSession(): Promise<{ email: string }> {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}
