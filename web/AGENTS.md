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

# Pricing page (/precios) + Wompi

`content/pricing.ts` has the 3 services (capacitación, alianzas
estratégicas, auditoría) — same differentiators as `whyVma` in
`content/company.ts`, priced with **reference figures VMA hasn't confirmed**
(shown as "Precio de referencia" in the UI, not final pricing). `PricingCard`
reuses `useMagneticCard` (the same tilt/spotlight physics as `HudCard`) —
see `src/hooks/useMagneticCard.ts`, don't rebuild that animation elsewhere.

Payment goes through Wompi's Web Checkout (a redirect URL, no SDK — see
`src/lib/wompi.ts`), gated on `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, which is
**not set yet** (no Wompi merchant account as of this writing). Until it
is, `isWompiConfigured()` is `false` and every card's button links to
`/contacto` instead of a checkout that would fail. The "Pagos seguros
procesados por Wompi" badge is a text/icon placeholder, not Wompi's actual
logo (no official asset available) — swap it for the real one from Wompi's
brand kit once there's a merchant account.

# Legal footer popups (Habeas Data / PQR) + cookie notice

`content/legal.ts` has the real text — Habeas Data is sourced verbatim
from VMA's actual "POLÍTICA DE HABEAS DATA VMA.pdf" (responsable, correo
`habeasdata@desarrolloeinnovacionvma.com.co`, derechos del titular); PQR
had no source document, so it's composed from Ley 1755 de 2015's response
terms (15 días hábiles general, 10 días for information requests) using
the same contact email. `LegalModal` (`components/common/LegalModal.tsx`)
is a generic version of AuthModal's glass-modal pattern (same
backdrop+panel Spring, portal to body, Escape/scroll-lock) for read-only
scrollable content instead of a form — reuse it for any future legal
text, don't build a new modal shell.

`CookieNotice` (`components/common/CookieNotice.tsx`, mounted in
`layout.tsx`) is informational only, not a consent gate — this site has
no analytics/marketing cookies, only the login's own session cookie
(created solely on active login, never on page load). Dismissal persists
via `localStorage`. If a real tracking/analytics script is ever added,
this stops being sufficient and needs to become an actual opt-in gate.

# Attention Director (PhotoGlobe)

`src/lib/attention-director.ts` — a small state machine, not a React hook
or a new render loop. It ticks once per frame from inside `PhotoGlobe.tsx`'s
existing `requestAnimationFrame` loop (`draw(now)` calls
`attention.update(now)`), nudging 6 of PhotoGlobe's own draw values
(nebula/star/atmosphere/rim/orbital-ring/satellite-glow alpha) by a tiny,
randomized amount (1-3%) on a random 18-35s cycle. Suspends immediately on
any page interaction (scroll/pointermove/keydown/touchstart, listened at
`window` level), disabled entirely under `prefers-reduced-motion` or below
a 640px viewport. Applies automatically everywhere `PhotoGlobe` renders
(Home's post-video globe, and the `/nosotros`/`/proyectos`/`/contacto`
hero backdrops via `HeroGlobeBackdrop`) — opt out per-instance with
`<PhotoGlobe attentionDirector={false} />` if one of those ever shouldn't
have it. Do not add a second RAF loop or a GSAP-style timeline for this —
the whole point is it rides the loop that already exists.
