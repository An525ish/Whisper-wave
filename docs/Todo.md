# Whisper Wave — TODO

## Network & connectivity UX

**Verdict:** Good idea — do it in phases, not as one blanket "all actions" pass.

### Why it's worth doing

- Chat is real-time; users on mobile/slow Wi‑Fi need to know *why* something feels stuck.
- Without feedback, failed sends and stale lists feel like bugs (we already have optimistic sends — they need a clear offline/failed state).
- WhatsApp/Telegram pattern: one global status + retries on writes, not a custom network message on every button.

### Why not "everything at once"

- `navigator.onLine` is coarse (Wi‑Fi with no internet still shows "online").
- "Slow internet" has no reliable cross-browser signal; better as timeouts + "Still trying…" on long requests.
- Socket can be disconnected while HTTP still works (and vice versa) — need **two signals**: browser online + Socket.IO connected.
- Phase 1 should stay $0: no Sentry, no paid uptime services.

### Recommended phases

| Phase | Scope | Priority |
|-------|--------|----------|
| **1** | Global banner: offline / reconnecting / back online (browser `online`/`offline` + socket `connect`/`disconnect`) | High |
| **1** | Failed outbound message: visible failed state + tap to retry (text, attachments, GIF) | High |
| **2** | Outbound queue while offline: hold sends, flush when socket reconnects | Medium |
| **2** | Distinguish loading vs slow: after ~3s show "Still sending…" / "Still loading…" | Medium |
| **3** | Read-side: React Query `networkMode` / refetch on reconnect for chats & messages | Low |
| **3** | Optional: disable or warn on destructive actions when offline (delete, clear chat) | Low |

### Out of scope for now

- Per-action network toasts on every mutation (noisy).
- Custom "slow network" detector via `navigator.connection` (Safari gaps, flaky).
- Background sync / service worker offline cache (Phase 2+ product, extra complexity).

### Implementation notes (when we build)

- **Client:** small `useNetworkStatus` hook (online + socket connected); banner in `AppWrapper` or chat layout.
- **Client:** extend existing pending/failed message rows in `useChatMessages` / `ConversationPanel`.
- **Server:** no change required for Phase 1 banner; retries reuse existing APIs.
- **Test:** toggle DevTools → Network → Offline; kill server; throttle to Slow 3G.

---

## Image & video loading fallbacks

**Verdict:** Good idea for **user media** (chat attachments, shared content, viewer) — not for every `<img>` in the app.

### What we already have

| Piece | Role |
|-------|------|
| `RetryableMediaImage` / `RetryableMediaVideo` | Loading shimmer + error fallback + retry while URL warms up |
| `MediaPlaceholder` | Picture/video icon + shimmer (`/icons/picture-icon.svg`, `/icons/video-icon.svg`) |
| `useRetryableMediaSrc` | Handles load state, retries, Cloudinary transform |

**Already using RetryableMedia:** chat bubbles (`RenderAttachments`), profile shared media (`MediaGrid`, `ProfileActions`), image viewer (`ImageViewer`, `ImageViewerNav`).

**Separate path — avatars:** `@/components/ui/Image` fades in on load and swaps to `AVATAR_FALLBACK` on error, but shows **nothing** while loading (`opacity-0` until `onLoad`).

### Gaps (raw `<img>` / `<video>`, no loading placeholder)

- Admin: `MediaCard`, `AttachmentChip`, `LinkCard` thumbnails
- Composer: `FilePreview` (local blob preview — lower priority)
- Search: `SearchResultItem`, `SearchFilters` avatars
- `LinkPreview` og:image
- `GifPicker` tiles (external CDN — optional shimmer only)

### Recommended approach

| Surface | Use | Priority |
|---------|-----|----------|
| Chat attachments, shared media, viewer | Keep / extend `RetryableMedia*` | Done |
| Avatars (`Image.tsx`) | Add loading skeleton or `MediaPlaceholder` behind fade-in | Medium |
| Admin attachment grids | Migrate to `RetryableMedia*` or shared wrapper | Low |
| Static icons, logos, empty-state art | Leave as plain `<img>` | — |

### Rule for new code

User-uploaded **image or video URL from our CDN** → `RetryableMediaImage` / `RetryableMediaVideo`.  
Avatars / small thumbs → `Image` (after we add a loading state).  
Decorative assets → inline `<img>` is fine.

### Out of scope

- Placeholder on every icon, logo, and SVG in the app.
- Audio files already use a static music icon — no video-style loader needed.

---

## Profile name & bio change cooldown (7 days)

**Verdict:** Good idea for **display name** — worth doing for **bio** too, but keep them **independent** (separate timers, not one shared slot).

### Why it's worth doing

- Stops rapid identity flipping in chats (impersonation vibes, confusion in message history).
- Cuts spam/abuse in bios without heavy moderation tooling (Phase 1 = $0).
- Matches how people actually use profiles — names and bios rarely need daily edits.

### Caveats

- **Username** is the real identity handle — if username stays freely changeable, a name-only cooldown helps less. Consider username on a **longer** cooldown (e.g. 14–30d) or leave username as-is if it's already scarce/unique.
- **Group name/bio** — only apply cooldown to **self profile**, not group owner renames (or document group policy separately).
- **Avatar** is often changed more often — don't bundle avatar into the same 7d lock unless product explicitly wants that.

### UX (no inline countdown)

- Do **not** show persistent inline copy like “Next change on &lt;date&gt;” on the profile form.
- On save attempt when cooldown is active → **modal** (confirmation-style): explains the 7-day limit, when they can change again, and that this applies to name or bio separately. Single primary action (e.g. “Got it”).
- On save attempt when cooldown allows → **confirmation modal** before commit: “You can only change your &lt;name|bio&gt; once every 7 days. Continue?” — Cancel / Confirm.
- API still returns a clear error if client is bypassed (`429` or domain error with `nextChangeAt` for the modal payload).

### Suggested rules

| Field | Cooldown | Notes |
|-------|----------|--------|
| Display name | 7 days | Per user; reset timer only when name actually changes |
| Bio | 7 days | Independent timer from name |
| Username | TBD | Stricter or unchanged — decide before ship |
| Avatar | None (for now) | Already separate upload path |
| **Admin edits** | **None** | Admin panel can change any user’s name/bio regardless of cooldown |

### Implementation notes (when we build)

- **Server:** `User.nameChangedAt`, `User.bioChangedAt`; check in `userService.updateProfile` before write (skip for admin routes / `adminToken` context).
- **Server:** skip bump if value unchanged (trim + normalize).
- **Client:** `ProfileForm` / `useProfilePanel` — intercept save → confirmation modal if allowed; blocked modal if cooldown active (data from profile API or error response).
- **Admin:** user edit in admin panel **bypasses** cooldown; no modal gate for admins.

---

## Marketing landing page & legal pages

**Verdict:** Required before public launch — we currently have **no public landing** (`/` → authed chat, `/auth` → login). Guests need a story, trust signals, and legal coverage.

### Landing page (creative, on-brand)

**Goal:** One scroll-stopping page that sells serendipity + safety, not another generic SaaS hero.

**Tone:** Gen Z, anonymous-but-warm, “whisper” (intimate) + “wave” (reach out). Dark-first, fluid motion, not corporate.

**Suggested sections**

| Section | Content |
|---------|---------|
| **Hero** | Headline + subcopy (anonymous chat → real connection), primary CTA **“Start a wave”** / **“Find someone”**, secondary **“Log in”** |
| **How it works** | 3–4 steps: vibe name → match → whisper → spark & connect (align with `PRODUCT.md` user states) |
| **Why Whisper Wave** | Serendipity, no algorithm feed, ephemeral until you choose to connect |
| **Safety** | Short trust block — moderation stance, report/block, 18+ (link to guidelines) |
| **Spark Pass** (teaser) | Premium filters / re-find — no hard sell, “coming soon” or waitlist OK for Phase 1 |
| **Social proof** | Placeholder stats or quotes until real — design should work empty |
| **Final CTA** | Repeat primary action → queue or `/auth` |

**Creative direction (pick 1–2, don’t overload)**

- Subtle **wave / ripple** WebGL or CSS mesh gradient background (respect `prefers-reduced-motion`).
- **Floating vibe tags** (`cozy`, `deep talks`, `chaotic`) drifting like chat bubbles.
- **Typography-led** hero with oversized “Whisper” / animated underline on “Wave”.
- Micro-interactions on CTA (magnetic button, soft glow pulse).
- Optional: short looped **abstract chat silhouette** — no stock photos of people.

**Tech notes**

- Route: `/` for guests → landing; authed users still redirect to chat home (or `/app`).
- Shared `MarketingLayout` + `SiteFooter` — not inside `AppWrapper` / socket shell.
- SEO: `<title>`, meta description, Open Graph image, semantic `h1`.
- Performance: lazy-load heavy animation; LCP-friendly hero (no full-screen video on mobile).
- Reuse design tokens from Tailwind theme — no one-off color system.

### Legal & trust pages (footer)

**Footer on:** landing, auth, and all static legal routes. **Not** on in-app chat chrome (sidebar footer stays session-focused); link “Legal” from auth footer is enough for logged-in users who need it.

| Page | Route | Purpose |
|------|-------|---------|
| Terms of Service | `/terms` | Binding use agreement, account rules, termination |
| Privacy Policy | `/privacy` | Data collected, cookies/JWT, retention, third parties (Cloudinary, etc.) |
| Community Guidelines | `/guidelines` | Acceptable conduct, harassment, spam — critical for anonymous chat |
| Cookie Policy | `/cookies` | httpOnly cookies (`accessToken`, `adminToken`), analytics if any |
| Safety Center | `/safety` | Report/block, what we moderate, crisis resources (optional links) |
| Help / FAQ | `/help` | Matching, Spark, account, password reset |
| Contact | `/contact` | Support email or form — abuse@, hello@ |
| About | `/about` | Mission, team blurb (can be minimal) |

**Nice-to-have later:** `/dmca`, `/accessibility`, `/spark-pass` (pricing), `/blog` or `/changelog`.

**Content**

- Start from templates, **lawyer review before launch** — Todo is structure + routes, not legal advice.
- Single source: `client/src/content/legal/*.md` or constants — avoid copy duplicated across pages.
- Last updated date on each legal page.

### Implementation checklist

| Task | Priority |
|------|----------|
| `MarketingLayout` + `SiteFooter` component | High |
| Landing page (`pages/Landing.tsx` or `pages/marketing/Landing.tsx`) | High |
| Router: guest `/` → landing, `/app` or keep `/` with auth redirect logic | High |
| Legal pages (markdown renderer or simple static sections) | High |
| Footer links wired on landing + auth | High |
| OG image + meta tags | Medium |
| Sitemap + `robots.txt` | Low |

### Out of scope for v1 landing

- Full CMS for marketing copy.
- Paid animation libraries or video CDN hero.
- Localized legal pages (English first).

---

## Testing strategy (unit, integration, load, E2E)

**Verdict:** Required before scale / public launch — we currently have **zero automated tests** (`server` `npm test` is a stub; no `*.test.ts` in the repo).

### Why it's worth doing

- Real-time chat + Socket.IO + MongoDB = race conditions and regressions you won't catch manually.
- Auth, messages, presence, and admin paths are security-sensitive — integration tests pay off fast.
- Load testing answers “how many concurrent sockets / messages before we melt?” before users do it for us.

### Test pyramid (recommended)

| Layer | Tool (stay $0) | What to cover |
|-------|----------------|---------------|
| **Unit** | Vitest (server + client) | Pure utils (`token`, validators/Zod, `statsBuckets`), service logic with mocked repos |
| **Integration** | Vitest + Supertest + `mongodb-memory-server` | HTTP routes: auth, user profile, messages, chats, admin; cookie/JWT flows |
| **Socket integration** | Vitest + `socket.io-client` against test server | Connect/auth, `NEW_MESSAGE`, presence join/leave, room membership |
| **E2E** | Playwright | Critical journeys: sign up → send message → receive; admin login → user list |
| **Load / stress** | k6 (OSS) or Artillery | Concurrent connections, message fan-out, match queue (Phase 2), API rate limits |

### Server — priority targets

| Area | Unit | Integration | Load |
|------|------|-------------|------|
| `validators/request.ts` (Zod) | ✓ | — | — |
| `utils/token.ts`, `middlewares/auth.ts` | ✓ | ✓ (protected routes 401/403) | — |
| `services/message.ts`, `repositories/message.ts` | ✓ (mock DB) | ✓ (pagination, context, delete) | ✓ (send burst) |
| `services/user.ts`, profile updates | ✓ | ✓ | — |
| `socket/handlers.ts`, `services/presence.ts` | partial unit | ✓ (multi-client) | ✓ (N sockets, heartbeat) |
| `services/admin.ts` | ✓ | ✓ (`adminToken` only) | low |
| Rate limits (`express-rate-limit`) | — | ✓ | ✓ (429 thresholds) |
| File upload / Cloudinary | mock only | smoke (small fixture) | out of scope v1 |

### Client — priority targets

| Area | Unit | E2E |
|------|------|-----|
| Hooks: `useRetryableMediaSrc`, `useMessageJump`, `useChatScroll` | ✓ | — |
| Utils / Zod schemas | ✓ | — |
| `RetryableMedia`, `Image` loading states | component (RTL + Vitest) | — |
| Auth flow, chat send/receive | — | ✓ |
| Admin media grid / message feed | — | smoke |

### Load testing — scenarios to script

1. **Baseline:** 100 → 500 → 1k concurrent Socket.IO connections (ramp, hold 5 min, ramp down).
2. **Message storm:** 50 users × 10 msg/s in one chat room — latency p50/p95/p99, no dropped events.
3. **Fan-out:** 1 sender → 20 group chats / 200 members — server CPU + Mongo write throughput.
4. **HTTP under load:** `GET /message/:chatId` pagination while sockets active.
5. **Reconnect storm:** mass disconnect + reconnect (mobile network simulation).
6. **SLOs to define:** e.g. p95 message delivery &lt; 500ms @ 200 CCU; error rate &lt; 0.1%.

Run against **staging** or local Docker stack — never prod. Document hardware (CPU/RAM) with results in `docs/load-test-results/`.

### CI & workflow

| Task | Priority |
|------|----------|
| Add Vitest to `server/` and `client/` | High |
| `npm test` + `npm run test:integration` scripts | High |
| GitHub Actions: unit + integration on PR | High |
| Playwright on main / nightly | Medium |
| k6 load job — manual or weekly cron, not every PR | Medium |
| Coverage gate (e.g. 60% server services) — raise over time | Low |

### Implementation notes

- **Test DB:** `mongodb-memory-server` for CI; optional `.env.test` pointing at local Mongo for dev.
- **Fixtures:** reuse `@faker-js/faker` (already in server devDeps) for users/chats/messages.
- **Socket tests:** spin minimal `http.Server` + Socket.IO from `src/server.ts` pattern; tear down after suite.
- **No paid services:** k6 OSS, Playwright free, no BrowserStack until needed.
- **Phase 2:** matchmaking queue load tests when Redis/queue lands.

### Out of scope for v1 test pass

- Visual regression (Percy/Chromatic).
- Chaos engineering / multi-region.
- Full Cloudinary integration load tests.

---

_Add new items below as needed._
