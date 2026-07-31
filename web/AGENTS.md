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

**displayedTime eases toward its target proportionally to the gap size**
(`CATCHUP_RESPONSE` in the same `tick`) — not a fixed or velocity-based
rate. Two earlier designs both got tried and rejected here, in order:
1. A flat `MAX_RATE = 2.2` (video-seconds/sec cap). Windows Chrome's
   default wheel-scroll step is a much bigger pixel jump per notch than
   macOS's trackpad scrolling, and the whole page is wrapped in Lenis
   (`layouts/scroll-layout.tsx`, `duration: 0.5`, `wheelMultiplier: 1.4`)
   which just multiplies whatever raw delta the browser reports rather
   than normalizing it — so a fast Windows/Chrome wheel-spin opened a
   large gap between scroll position and video time, and the video kept
   auto-advancing at the capped rate well after the user's hand had
   stopped. Reported as "the video runs ahead of my scrolling."
2. Estimating the user's *current* scroll velocity (EMA-smoothed,
   bounded) and using that as the rate instead of a flat constant. This
   is the wrong fix for the actual failure: the instant the user stops
   scrolling, current velocity drops to ~0, and a velocity-derived rate
   collapses right along with it — at exactly the moment a large backlog
   (built up during the fast spin) most needs a *high* rate to close.
   Measured directly with an in-page synthetic wheel-event trace (see
   below): after an 8-notch/~500ms burst, the video was still several
   seconds of footage behind and closing that gap at barely above the
   rate floor for 3+ more seconds — the user kept seeing motion for
   seconds after their hand had already stopped, which is what "va más
   rápido" actually turned out to mean.

The fix: `displayedTime += diff * (1 - Math.exp(-CATCHUP_RESPONSE * dt))`
— proportional/exponential easing, where the step size scales with the
*size of the remaining gap*, not with how fast the target is currently
moving. A large backlog closes quickly (~95% within ~300ms at
`CATCHUP_RESPONSE = 10`) precisely because it's large; a small, steady
gap during ordinary continuous scrolling closes at a correspondingly
small rate. No "how fast is the user scrolling right now" estimate
needed at all — removed that tracking code entirely rather than layering
a fix on top of it.

Verified with an in-page trace, not CDP's `Input.dispatchMouseEvent`
(its round-trip latency — ~130ms+/event — can't simulate a real fast
wheel-spin; events end up seconds apart instead of tens of ms apart).
Instead, inject a script via `Runtime.evaluate` that dispatches synthetic
`WheelEvent`s directly in-page with short `setTimeout` gaps and logs
`{t, scrollY, videoTime}` into a `window.__trace` array on every event,
then read that array back afterward — this is the only way to get
faithful sub-100ms timing for this kind of scroll-physics test. Compare
old-vs-new by running the identical trace against each version: the old
(velocity-based) design left `videoTime` still climbing 3.5s after the
burst ended; the new one reaches its final value and holds flat within
~1s. If you touch this again, verify the same way — a single before/after
rate snapshot is *not* enough, it can land on a lull and look like the
opposite of what's actually happening (this happened twice while building
this fix).

**None of the above was actually the "Windows/Chrome goes faster" bug.**
Both `tick`-loop redesigns above target *lag* — the video visibly still
moving after the user's hand stopped. Shipped both, user said it still
wasn't fixed. Asked one precise follow-up (what exactly looks wrong) and
the real answer was different: a *small* physical scroll moves the video
*a lot* — a distance/pacing problem, not a timing one, so no amount of
tuning `tick`'s catch-up math could have fixed it. The actual cause is in
`layouts/scroll-layout.tsx`'s Lenis config: `wheelMultiplier: 1.4`
amplifies whatever `deltaY` the browser reports for a wheel event, and
Chrome on Windows commonly reports a much bigger native `deltaY` per
wheel "notch" than macOS's trackpad does for an equivalent nudge — so the
same physical gesture produces very different scroll distances (and,
through it, very different amounts of video-time) depending on
OS/browser. Fixed via Lenis's `virtualScroll` hook (confirmed by reading
`node_modules/lenis/dist/lenis.mjs`, not just the `.d.ts` — the hook can
mutate `data.deltaY`/`data.deltaX` in place before Lenis's `onWheel`
destructures them, per `onVirtualScroll`'s source), capping the
*post-multiplier* delta from any single wheel event to `WHEEL_DELTA_CAP`
(48px), guarded to `WheelEvent` only so touch/trackpad-momentum scrolling
is untouched. Verified with a single synthetic 150px `WheelEvent`
(bigger than a typical Windows notch): before the cap it produced
`scrollY = 210` (150 × 1.4, unclamped); after, `scrollY = 48`. A sustained
20-notch spin still accumulated to a proportionate `scrollY = 959` —
continuous scrolling isn't hobbled, only a single oversized event is
bounded.

The lesson, if this comes up again: when a report says "X but for a
different browser/OS than mine," don't assume it's the same class of bug
you already understand just because it's the same feature. Get the exact
symptom before re-deriving a fix — "runs ahead after I stop" and "barely
moved my scroll and it jumped a lot" are different bugs with different
fixes, and this file's *first* fix attempt (the velocity-based `tick`
redesign) was built on an assumption never actually confirmed against
what the user was seeing.

**`WHEEL_DELTA_CAP` was tuned down from 48 to 24, from real telemetry, not
a second guess.** Once `?scrolldebug=1` (see `ScrollDebugOverlay.tsx`)
could show the user's own numbers, they showed the 48px cap *was*
engaging correctly (consistent ~48px scrollY steps) — it just still let
one deliberate, well-spaced wheel click (180ms-2s apart, clearly not a
fast spin) move 0.3-0.9s of the 34s video. Halved to 24px on that
evidence. If this needs retuning again, get fresh `?scrolldebug=1` data
first rather than picking a new number by feel — the whole point of that
overlay is that "feels right" here has repeatedly not matched what the
numbers showed.

**Seeking can still stall for real — clamped to the buffered range, not
timing-tuned away.** After the wheel-delta fix, next reports were "freezes
for seconds while scrolling" and "doesn't stop where I left it / jumps
back." Confirmed directly via `?scrolldebug=1`'s continuous poll (not
wheel-triggered — this can happen with no new input, so it needed its own
poll loop): a **4.6-second continuous `video.seeking` stall** on a real
connection. Root cause was already half-documented in this file's own
`useEffect` comment above the blob-fetch effect: before that background
`fetch()` finishes swapping the `<video>` to a local blob, it's still the
native `preload="auto"` element streaming progressively, and a seek past
whatever byte range it's actually downloaded blocks on the network —
easy to trigger by scrolling fast in the first several seconds after
page load, before a ~14MB fetch has had time to finish on a real (non-
localhost) connection. Once a stalled seek finally resolves, the target
may have moved a lot in the meantime, which is what read as "jumps back."
Fixed in the tick loop: while `blobReadyRef.current` is still `false`,
`targetTime` is clamped to `video.buffered`'s end (minus a 1.5s safety
margin) instead of the raw scroll-implied value — so it never *requests*
a seek past what's actually downloaded, and just holds/advances smoothly
with the buffer instead of firing a seek that will block. Verified with
`Network.emulateNetworkConditions` (~1.5 Mbps, throttled *before*
navigating so the blob fetch has no chance to finish) plus an immediate
`window.scrollTo` to ~96% progress: `currentTime` correctly held at 0 for
~5s while `buffered` end crept up, then began advancing smoothly the
moment buffered end passed the safety margin — `seeking` never stayed
`true` for more than one ~150ms poll tick. Once `blobReadyRef.current`
flips to `true` (blob swap's `loadedmetadata` fired), this clamp is
skipped entirely and seeking is unclamped, matching the pre-existing
design for the common case where the fetch wins the race.

`ScrollDebugOverlay.tsx` (mounted in `layout.tsx`, gated behind
`?scrolldebug=1`) is the tool that made all three of the diagnoses above
possible — remove it (and its mount) once this whole investigation is
closed out and confirmed fixed on the user's own machine, not before. It
exists because asking a non-developer to paste a script into DevTools
console hit Chrome's "type allow pasting to continue" wall and silently
produced nothing; an on-page overlay needs no console at all. If a future
scroll/video-timing report needs the same kind of real-device telemetry,
extend this file rather than starting over — it already knows how to
avoid `elementFromPoint`-vs-`pointer-events:none` confusion (don't use
`elementFromPoint` to verify a `pointer-events:none` overlay is visually
on top — hit-testing skips it by design; check `getComputedStyle` /
`getBoundingClientRect` instead), and the general lesson under all of
this: prefer a live measurement on the reporting user's own machine over
another synthetic CDP reproduction once a first synthetic-only fix has
already failed to resolve a report — this session needed three real
telemetry captures to actually nail down two genuinely different root
causes that a synthetic macOS/localhost repro could not have surfaced.

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

# public/video/VMA_Narrative.mp4 — H.264 Main profile, not committed to git

The Hero video is gitignored (`web/public/video/**/*.mp4`) — it's deployed
by `scp`ing straight to the VPS, never via `git pull`, so a change to this
file needs its own manual deploy step, not just a commit+push.

Re-encoded from High to **Main** H.264 profile (same 1280x720/24fps,
same ~3.4Mbps, same 6-frame/0.25s keyframe interval — `ffmpeg -profile:v
main -level 3.1 -g 6 -keyint_min 6 -sc_threshold 0`) after the buffered-
range clamp (see the ScrollExperience section above) still left real,
user-measured multi-second `video.seeking` stalls — but this time
confirmed via `?scrolldebug=1`'s v4 event log that *every single one* of
10 logged stalls (397ms-4.4s) happened with `blob=SÍ`, i.e. on a fully
downloaded local blob with `readyState=4`. That ruled out network/
buffering as the cause entirely — it pointed at decode cost on that
user's specific hardware. Directly re-verified keyframe density first
(`ffprobe -show_entries frame=pict_type`, counted I-frames at positions
1,7,13,19...) rather than assuming it — confirmed already dense, so
sparse keyframes forcing long forward-decode-from-keyframe on backward
seeks wasn't the cause either. High profile's extra decode complexity
(8x8 transforms, more reference-frame options) over Main was the
remaining lever available purely in software, without reducing
resolution/bitrate (asked the user first — re-encoding at lower quality
is a visual tradeoff, not a pure bug fix, so it wasn't done silently).
Visually verified frame-for-frame against the original (identical, no
perceptible difference) before replacing. If this *doesn't* resolve the
remaining stalls, the next lever is lower resolution/bitrate, which the
user has already been asked about and can authorize — don't silently
degrade video quality without asking again if that becomes necessary.

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
