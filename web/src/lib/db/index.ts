import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * `node:sqlite` (Node's built-in SQLite) instead of `better-sqlite3` —
 * zero new dependencies and no native binary to compile on the VPS.
 * Experimental per Node's own warning, but the API is stable enough for
 * this scale (verified working, unflagged, on both the VPS's Node 22.23
 * and local Node 24).
 *
 * Server-only by construction — every caller is a route handler or a
 * server component, never bundled to the client.
 */
const DB_PATH = join(process.cwd(), "data", "app.db");

let instance: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (instance) return instance;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  instance = new DatabaseSync(DB_PATH);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS approved_users (
      email TEXT PRIMARY KEY,
      documento TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      email TEXT PRIMARY KEY REFERENCES approved_users(email),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL REFERENCES accounts(email),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `);
  return instance;
}
