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

# Contact form ("Hablemos") + /portal/mensajes admin inbox

`POST /api/contact` always inserts into `contact_messages` (name, email,
interest, message, created_at) — that's the durable path, confirmed
end-to-end (submitted via the real route, verified the row in
`data/app.db`). Forwarding to `CONTACT_ENDPOINT` (still unconfigured — see
the note in the route) is optional and additive on top of that, not a
replacement — if it's ever set and the forward fails, the message still
isn't lost.

`/portal/mensajes` lists them, gated by `isAdminEmail()`
(`src/lib/auth/admin.ts`) against the `ADMIN_EMAILS` env var (comma-separated,
empty by default — nobody can see it until it's set on the VPS). This is
deliberately an env var, not a `role` column on `accounts`: `approved_users`
is seeded from VMA's *external* registration sheet (investors/allies), so
"has an activated account" and "is VMA staff" are different populations —
a DB role would need real role-management UI nobody asked for, and every
approved user must NOT see every other lead's contact info by default.
Confirmed via real session cookies (one admin, one non-admin) that a
non-admin session gets redirected straight back to `/portal` without ever
rendering the list. `/portal/page.tsx` only shows the "Ver mensajes de
contacto" link when `isAdminEmail(email)` — a non-admin isn't shown a link
to a page they can't use.

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

# Comets (PhotoGlobe)

Same file, same draw loop as the stars/constellations already there — a
rare shooting star (`COMET_MIN_GAP_MS`–`COMET_MAX_GAP_MS`, currently
9-22s, at most one in flight at a time) crossing the starfield, drawn in
`drawSpaceBackground`. Deliberately hand-rolled, not a third-party
particle/animation library — the codebase's whole graphics stack (this
file, `CursorDistortion.tsx`, `HudCard`'s tilt) is hand-rolled Canvas
2D/WebGL on purpose, and a comet is simple enough not to need a dependency
for it. Respects `prefers-reduced-motion` (never spawns). Verified by
temporarily shortening the gap constants and confirming via CDP
screenshots that a comet actually renders — remember to restore the real
gap values if you do that again, don't leave the shortened ones in.

# ScrollExperience — act opacity is DOM, not React state

`components/ScrollExperience.tsx`'s scroll-driven video (`tick`, inside
the main non-reduced-motion `useEffect`) writes each act's
opacity/pointer-events/transform straight to its DOM node via a ref array
(`actRefs`), not `useState`. It used to be `setActiveStyles` on every
`requestAnimationFrame` tick — measured via CDP with mobile device metrics
+ `Emulation.setCPUThrottlingRate(4)` (simulating a mid/low-end phone):
~60% of frames missed the 16.6ms/60fps budget (avg 27ms/frame). Routing
that same per-frame value through DOM refs instead of React state dropped
it to ~10% (avg ~18ms/frame, confirmed again against a production build).
This was the fix for the "scroll lags on mobile" report — not the video
seeking itself (already reasonably cheap; keyframes every ~6 frames) and
not `HeroStarfield`/`CursorDistortion` (separate canvases, cheap on their
own). If a future feature wants to add more per-frame visual state here,
extend this same direct-DOM pattern rather than reintroducing setState in
the hot path.

**Catch-up rate is adaptive, not a fixed constant** (`catchUpRate` in the
same `tick`). It used to be a flat `MAX_RATE = 2.2` (video-seconds/sec cap
on how fast `displayedTime` eases toward the scroll-implied target) — fine
when real scroll throughput stays near that pace, but Windows Chrome's
default wheel-scroll step is a much bigger pixel jump per notch than
macOS's trackpad scrolling, and the whole page is wrapped in Lenis
(`layouts/scroll-layout.tsx`, `duration: 0.5`, `wheelMultiplier: 1.4`) —
Lenis just multiplies whatever raw delta the browser reports, so a bigger
native delta still produces a bigger real scroll velocity through it, not
a normalized one. The fixed cap left a large, growing gap on fast
Windows/Chrome scrolling, and the video kept auto-advancing at the capped
rate well after the user's hand had stopped — reported as "the video runs
ahead of my scrolling." Fixed by estimating actual scroll velocity
(video-seconds implied per real second, each time the `dirty`-gated
recompute runs) and EMA-smoothing it into `catchUpRate`, bounded to
[1.4, 8] so a single large event can't make it feel instant. Verified by
temporarily exposing it as `window.__debugCatchUpRate`, dispatching a
sustained fast-wheel burst via CDP, and confirming it actually spikes
toward the ceiling during the burst and decays once scrolling stops —
removed that debug hook before committing (same pattern as the comet
verification elsewhere in this file, use it again if you touch this).

# Adaptive scaling grid — mobile tier holds a flat 16px

`src/app/globals.css`'s `html { font-size }` media-query ladder (see
`grid.config.ts` for the full rationale) scales the root font-size so a
rem-based layout stays proportional across viewports. The ≤640px tier used
to follow the same `baseWidth === maxWidth` formula as the tiers above it
(`2.5vw`, i.e. `16 * 100 / 640`) — but that formula only equals 16px right
at the 640px edge, and no real phone is 640px wide, so every actual phone
landed below it (a 390px phone measured 9.75px root font-size — confirmed
live via `getComputedStyle`, not assumed). Every `rem`-based Tailwind
text-* class sitewide was rendering at ~60% of its authored size on
mobile — this was the root cause of the "mobile font is too small /
white text is unreadable" report, not a per-component sizing issue. Fixed
by holding that tier at a flat `16px` instead of continuing the vw
formula; the 1024/1440/1920 tiers are untouched (those correspond to real
desktop/tablet viewports scaling proportionally and weren't reported
broken). If you add a new breakpoint below 640px, keep it flat too — don't
reach for `Nvw` there.

Fixing this uncovered one real layout side effect: `ScrollExperience`'s
"territorio" act (5 stacked pillar cards) was tall enough, at now-correct
font sizes, to push its tag/headline behind the fixed `SiteHeader` on a
390px viewport. Fixed with two changes scoped to that act only: the
pillars grid is `grid-cols-2` from the start (not just `sm:`), and the act
wrapper has `pt-20 sm:pt-0` so content centers below the header instead of
across it. Confirmed via live `getBoundingClientRect()` measurements
(header height, content top/bottom vs viewport), not just a screenshot.
If a future act's content ever gets this tall again on mobile, re-check
the same way rather than assuming centering alone is safe.

# HeroStarfield

`components/HeroStarfield.tsx`, mounted in `ScrollExperience.tsx` right
after `CursorDistortion`, rendering on top of both the Hero video and its
distortion canvas. A transparent-background Canvas 2D overlay — twinkling
stars plus up to `MAX_CONCURRENT_COMETS` (3) comets in flight at once,
each randomized in size (`scale`, 0.6-1.9x) and speed (`duration`,
650-2600ms) independently — deliberately not sharing code with
`PhotoGlobe.tsx` (different tuning problem: staying legible over
*varying* video content across every act, space and terrain/community
scenes alike, vs. PhotoGlobe owning its own opaque background). No
third-party library, same reasoning as PhotoGlobe's comets. An earlier
version also drew two faint hand-placed constellations; removed at the
user's request after reviewing a screenshot preview — don't re-add them
without checking first. Respects `prefers-reduced-motion` and pauses (via
canvas opacity, no per-frame work) on tab-hidden/window-blur, same
pattern as `CursorDistortion.tsx`.
