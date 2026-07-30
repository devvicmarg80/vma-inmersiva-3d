<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Auth system (login + /portal)

Real infrastructure, not a demo: `src/lib/db` (Node's built-in `node:sqlite`,
zero dependencies — confirmed working unflagged on both local Node and the
VPS's Node 22.23), `src/lib/auth` (scrypt password hashing, opaque
cookie-token sessions stored in a `sessions` table, in-memory rate limiting).
Routes: `POST /api/auth/{activate,login,logout}`, `GET /api/auth/me`. UI:
`AuthButton`/`AuthModal` in the header, `LogoutButton` on `/portal`.

Two-step flow by design — the documento (cédula) is a one-time proof of
identity at activation, never the ongoing password (it isn't a secret, and
it's protected personal data under Colombia's Ley 1581/2012):
1. **Activar cuenta**: email + documento (checked against `approved_users`)
   + a new password the user picks → creates the `accounts` row.
2. **Iniciar sesión**: email + that password, afterwards.

`approved_users` is seeded from VMA's real registration sheet ("VMA - BOT
REGISTROS EMPRESARIALES", a Google Form) via `scripts/import-users.mjs
<export.csv>` — reads only the email + documento columns by header name,
never the ID-photo/payment-voucher/contract columns also in that sheet.
Re-running it with a fresher export is safe (upserts by email).

`web/data/app.db` holds real user data — gitignored (`/data/` in
`web/.gitignore`), never commit it or anything derived from it.
