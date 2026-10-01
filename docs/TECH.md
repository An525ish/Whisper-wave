# Whisper Wave — Tech Plan (simple + cheap)

> Living document. Update when tech decisions change.
> Last updated: Aug 2026
>
> Product vision: [`PRODUCT.md`](./PRODUCT.md)
> Backend user journey: [`USER_JOURNEY.md`](./USER_JOURNEY.md)
> Phase 1 backend plan: `.cursor/plans/backend_prod_refactor_bcb4b8d9.plan.md`

---

## Rule #1: $0 until we have users

We build and run this at **zero paid cost** for as long as possible.

That means:

- Run locally on your machine
- Use only **free tiers** of tools we already have
- Do **not** add paid APIs, paid hosting, paid monitoring, or paid Redis until we actually need them
- Prefer open-source libraries that run on our own server

We only spend money later if:

1. Real users outgrow free limits, or
2. Premium (Spark Pass) is live and bringing money in

---

## What we already have (keep it)

| Thing | Cost | Why we keep it |
|---|---|---|
| **Node 20+ + Express 5** | Free | Evented I/O fits chat. Express 5 is the current major (named wildcards, promise-aware middleware). |
| **MongoDB Atlas + Mongoose 9** | Free (M0) | Permanent data: users, chats, messages, connections. |
| **Socket.IO 4** | Free | Real-time chat without inventing our own protocol. |
| **Cloudflare R2** | Free tier (10GB storage, 1M Class A ops/month) | Object storage for avatars + attachments. S3-compatible API via `@aws-sdk/client-s3`. |
| **ImageKit** | Free tier (20GB bandwidth/month) | CDN delivery + image transforms (resize, `f-auto`, `q-auto`). Raw R2 key stored in DB; delivery URL built at read time via `buildDeliveryUrl()`. |
| **JWT + cookies** | Free | Login without a paid auth product. |
| **Vite + React client** | Free | SPA on latest majors (React 19, Vite 8, RR7, Tailwind 4, TanStack Query, Zustand). |
| **TypeScript 7 / Zod 4 / Multer 2 / Jimp 1** | Free | Phase 1 baseline — Phase 2 follows the same majors. |

We are **not** removing MongoDB. We are **not** rewriting the backend in another language.

### Dependency policy

Phase 1 is on **latest majors** (server and client). Phase 2 must not invent an older parallel stack.

- Prefer current majors: Express 5, Mongoose 9, Multer 2, Jimp 1, uuid 14, Zod 4.
- Client: React 19, Vite 8, React Router 7, Tailwind 4, TanStack Query 5, Zustand 5, TypeScript 7.
- Client ESLint: until `typescript-eslint` supports TS ≥7.1, keep the Microsoft side-by-side install — `typescript` → `@typescript/typescript6` (for eslint), `typescript-7` → `typescript@7` (for `tsc` / typecheck / build). No `legacy-peer-deps`.
- **No `dotenv`** — Node 20+ `--env-file` / `--env-file-if-exists` loads `.env` (see npm scripts).
- When adding Redis / Stripe later, install the current major at that time.
- After big upgrades: `npm run typecheck` + `npm run build` + hit `/health`.
- Require **Node >= 20** (`engines` in `server/package.json` and `client/package.json`).

### Notable upgrade adaptations already in the code

- Express 5 SPA fallback: `app.get('/{*splat}', …)` (unnamed `*` is gone).
- Jimp 1: `import { Jimp, JimpMime } from 'jimp'`, `fromBuffer` + `getBuffer` (no `getBufferAsync` / default export).
- Mongoose 9: stricter `create()` / ObjectId typing in controllers.
- uuid 14: still `import { v4 as uuid } from 'uuid'` (ships its own types — no `@types/uuid`).

---

## Two places data lives (and why)

Think of it like a whiteboard vs a notebook.

### MongoDB = the notebook (permanent)

Used for anything we must remember after the user closes the tab:

- Accounts (name, username, password hash, avatar)
- Connected chats, groups, messages, friend requests
- Later: “we connected” records + premium subscription status

**Why Mongo, not Postgres?** We already have it, schemas are flexible, free Atlas cluster exists. Switching DBs now is unpaid work with zero user benefit.

### Redis = the whiteboard (temporary) — Phase 2 only

Used for things that should **disappear**:

- Who is waiting in the random-match queue
- The anonymous chat happening right now
- Who liked whom in that chat
- Who is online (socket id)

**Why Redis, not Mongo, for anonymous chat?**

- Product: if they disconnect, that person is gone. If we save it in Mongo, we secretly kept them.
- Speed: matching is “who is waiting?” — Redis lists are built for queues.
- Cost: we do **not** add Redis in Phase 1. Phase 1 uses an in-memory `Map` on the server (free, enough for local + small traffic).
- When Phase 2 starts: use **Upstash Redis free tier** or **Redis Cloud free tier** (~30MB). Still $0.

If free Redis is not enough later, *then* we pay. Not now.

---

## What we will do in Phase 1 (now)

Goal: make the **existing connected-chat** stack clean, typed, and safe — without new product features and without new paid services.

Server: TypeScript, services layer, Zod, Helmet, rate limits, indexes, admin API (`adminToken`).

Client: latest majors, TanStack Query + Zustand, modular folders, real admin UI wiring, no intentional visual redesign.

**Phase 1 client status:** complete (latest majors, TQ + Zustand, admin API wired, virtualized lists, Zod validators, shared Searchbar/SuggestionListItem, **full `.tsx`/`.ts` conversion**).

**Phase 1 actual scope (exceeded original plan):** Beyond the backend refactor + client cleanup, the following were also shipped during Phase 1:
- Migrated storage from Cloudinary → **Cloudflare R2 + ImageKit** (R2 for storage, ImageKit for CDN delivery + transforms). Raw R2 key stored in DB; `buildDeliveryUrl()` constructs ImageKit URL at read time.
- Full marketing landing page (`features/landing/`) with `TranscriptHero`, `BentoSection`, `MomentsSection`, `HeroSection`, `SafetySection`, `FinalCTASection`, `LandingFooter` — complete with design system (HoloMesh, SignalWave, grain, glass cards, `clamp`-based mobile sizing)
- SparkPass pricing/marketing page (`pages/SparkPass.tsx`) — ticket card, pricing tiers, feature table
- Legal pages (`pages/legal/`) — Terms, Privacy, Guidelines, Safety, Help, About, Cookies, Contact
- Complete notification system (`features/notifications/`)
- Complete profile system (`features/profile/`) — ProfilePanel, ProfileSheet, shared media grid, edit flow
- Group roles enforced end-to-end (creator/admin/member)
- GIF handling — `isGifFile` helper, ImageKit transform bypass for animated GIFs across all surfaces
- Find in Chat — media tab with image/video/audio thumbnails, `SearchResultItem` with `MediaThumb`
- ImageViewer GIF fix — `transformWidth={undefined}` for GIFs to preserve animation
- `Image.tsx` loading shimmer — `animate-pulse bg-border/25` skeleton during avatar load

---

## What we will do in Phase 2 (after foundation) — still $0 if possible

This is the anonymous product: queue → random chat → like → connect → signup.

| We will do | Why | Cost |
|---|---|---|
| Add **Redis** (Upstash/Redis Cloud free) | Queue + ephemeral anon rooms | $0 free tier |
| `/anon` Socket.IO namespace | Anonymous users should not use the logged-in socket path | Free |
| `Connection` model in **Mongo** | When two people connect, that *is* permanent | Free (same Atlas) |
| `connectToken` (short JWT) | Bridge “anon chat” → “create account” without extra DB tables | Free |
| Report + block | Safety without buying AI moderation yet | Free |

**Still skip in Phase 2 unless we have revenue:**

- Stripe live payments (Stripe itself is free to integrate; we only pay % when someone actually buys Spark Pass)
- AWS Rekognition / Google Perspective (paid moderation)
- BullMQ workers / extra servers
- FCM push, Sentry, paid hosting, CDN

---

## Hosting: $0 for now

| Stage | Where it runs | Cost |
|---|---|---|
| **Now (dev)** | Your laptop: `npm run server` + Vite | $0 |
| **First share with friends** | Optional: Render / Railway / Fly **free** web service + Atlas M0 + Cloudinary free | $0, with caveats (free hosts sleep, Socket.IO can be flaky) |
| **Real public launch** | Cheap VPS (Hetzner/Oracle always-free) **or** paid Render when users exist | Pay only then |

We do **not** use Vercel for the API. Vercel serverless cannot hold Socket.IO connections. The chat server must be a long-running Node process.

Frontend can stay on free Vite preview / Cloudflare Pages / GitHub Pages later. Not in scope now.

---

## Safety without paying

Paid AI moderation is nice later. For $0 now:

1. **Report + block** in chat (we build this ourselves)
2. **Rate limits** on login, search, queue join (stop bots)
3. **Helmet** security headers
4. **No storing anon chat in Mongo** (less PII, less legal risk)
5. Age gate as a simple checkbox / DOB field when we add premium — not a paid KYC vendor
6. **Local content filter** — a word list in `server/src/services/match/moderation.ts`
   (sexual solicitation, scam/contact solicitation, violence, CSAM-adjacent terms),
   with leetspeak/separator normalisation. Fails **open** on internal error and
   auto-files a `Report` on a hit. This is a blocklist, not a classifier.
7. **Funnel analytics** — self-hosted or free-tier collector only, configured via
   the client var `VITE_ANALYTICS_ENDPOINT` (approved in
   `.cursor/rules/product-and-cost.mdc`). Sends no PII and no-ops when unset.
   Paid error/analytics vendors (Sentry, PostHog, Amplitude paid) are still out.

When Spark Pass makes money, *then* add automated text/image moderation
(Perspective API) and paid error monitoring.

---

## What we are explicitly NOT doing (and why)

| Idea | Why not (now) |
|---|---|
| Rewrite backend in Go / Elixir / Rust | Time cost is huge. Node is fine for this chat app. |
| Migrate frontend to Next.js | Chat is behind login / sockets. Next.js doesn’t help; Vercel doesn’t fit sockets. |
| Drop MongoDB | We need it for accounts + connected chats. |
| Put anonymous chats in Mongo | Breaks “they’re gone if you disconnect” + extra Atlas usage on free tier. |
| Redis in Phase 1 | Extra moving part + another account. In-memory `Map` is enough until matching exists. |
| Auth0 / Firebase / Clerk | Cost at scale. JWT + cookies is enough. |
| Datadog / Sentry / Logtail | Pino to stdout is free. |
| Stripe before Spark Pass UI exists | No one to charge yet. Integrate when premium ships. |
| Separate media worker (BullMQ) | Needs Redis + more ops. Keep compression in-process until it hurts. |
| Kubernetes / microservices | One Node process is correct until we have real load. |

---

## Simple architecture (target)

```
Your laptop (or later one small server)     $0
        │
        ├── Vite React app                  $0
        │
        └── Node + Express + Socket.IO      $0
                │
                ├── MongoDB Atlas M0        $0  (accounts, chats, messages, connections)
                ├── Cloudinary free         $0  (images/files)
                └── Redis free tier         $0  (Phase 2 only: queue + anon rooms)
```

Phase 1 was only the Node box + Mongo + Cloudinary. **Phase 2 has landed**, so
Redis is now part of the stack (free tier only — see Cost).

---

## Phase 2 backend — anonymous matching (Redis + `/anon`)

Phase 2 adds the anonymous layer: pick a vibe → get matched → chat ephemerally →
mutual like → reveal into a real DM. Everything ephemeral lives in Redis; only a
successful reveal writes to Mongo.

### Why Redis

Queues need atomic claim operations. Mongo has no native queue primitive, and a
`findOneAndUpdate` poll races under concurrency. Anon sessions must also *die*
when users leave — TTL is built for that. See `PHASE2.md` for the full rationale
and the cost model (free tier ≈ 650 sessions/day).

Client: `ioredis` with explicit `host`/`port`/`tls.servername` so TLS SNI is set
correctly for Upstash (passing a `rediss://` URL string skips SNI and fails with
ECONNRESET). Redis is a **hard boot dependency in production**; `/health`
returns 503 when it is unreachable.

### Redis key schema (`server/src/services/match/keys.ts`)

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `match:queue:global` | List | — | FIFO queue of anonIds. Claimed atomically via Lua `LREM`. |
| `match:waiting:{anonId}` | String (JSON) | 24 h | **Identity card** (alias, vibes, gender). Not queue membership — that is the list above. Refreshed on every interaction. |
| `match:session:{sessionId}` | String (JSON) | 24 h | Active anon session (both anonIds, both aliases/tags, status). |
| `match:likes:{sessionId}` | Set | 24 h | anonIds that sent a vibe. `SCARD == 2` ⇒ mutual. |
| `match:messages:{sessionId}` | List | 24 h | Last 50 messages, so a refresh doesn't blank the thread. |
| `match:active:{anonId}` | String | 24 h | anonId → current sessionId (reconnect replay). |
| `match:presence:{anonId}` | String | **45 s** | Set when a socket drops. The match is only torn down when this lapses — a network blip must not end the conversation. |
| `match:blocked:{anonId}` | Set | 30 d | Blocked partners. Checked both ways before pairing. |

### `/anon` namespace events

Separate from `/` because anon users have no JWT — the namespace authenticates
via the httpOnly `anonId` cookie instead of `applySocketAuth`.

| Direction | Events |
|---|---|
| Client → server | `ANON_MESSAGE` (acked), `ANON_TYPING_START`, `ANON_TYPING_STOP`, `ANON_LIKE`, `ANON_NEXT`, `ANON_REQUEUE` |
| Server → client | `QUEUE_JOINED`, `MATCH_FOUND`, `MATCH_MESSAGE`, `MATCH_TYPING_START`, `MATCH_TYPING_STOP`, `SOMEONE_VIBING`, `MATCH_PARTNER_VIBED`, `MUTUAL_LIKE`, `MATCH_DISCONNECTED`, `MATCH_MESSAGE_REJECTED`, `MATCH_ERROR`, `SESSION_EXPIRED`, `CONNECTION_READY` |

### Reveal flow

`connectToken` is a short-lived JWT (default 10 min, `ANON_TOKEN_TTL_MIN`) signed
with its own `ANON_JWT_SECRET` — deliberately *not* `ACCESS_TOKEN_SECRET`, so a
compromised access token can't forge connection intent. Both sides call
`POST /api/connection/complete`; the first writes its `userId` into
`PendingConnection`, the second completes it (Chat + `Connection` records) and
both receive `CONNECTION_READY`. `pairKey` is a unique index on the sorted user
pair, which is what enforces "one connection per pair".

---

## How this maps to folders

| Doc / plan | What it’s for |
|---|---|
| [`PRODUCT.md`](./PRODUCT.md) | What the app *is* (anonymous → connect → premium) |
| [`USER_JOURNEY.md`](./USER_JOURNEY.md) | Step-by-step: user action → backend operation → what is stored |
| This file (`TECH.md`) | What we build with, why, and how we stay at $0 |
| Phase 1 cursor plan | Exact backend refactor steps (TypeScript, bugs, structure) |

### Server naming convention

Folder already says the role — do **not** double-suffix files:

- `middlewares/auth.ts` (not `auth.middleware.ts`)
- `controllers/chat.ts` (not `chat.controller.ts`)
- `services/chat.ts` (business logic — not in controllers)
- `repositories/user.ts` (DB access only — services/middlewares call these, not models)
- `models/user.ts` (schemas only; types live in `types/`)
- `types/user.ts` (all shared TS types)
- `validators/auth.ts` / `routes/auth.ts`

### Layering

```
routes → middlewares → controllers (HTTP only) → services (business) → repositories → models
                                                      ↑
                                                   types/
```

Controllers parse `req`/`res`, call services, set cookies/status. Services never import Express or `models/`. Repositories own all Mongoose queries. Types are never defined inside controllers/services when shared — put them in `types/`.

**Route registration:** only in `routes/index.ts` via `registerRoutes(app)`. `app.ts` must not mount feature routers itself.

**Barrels:** required for `routes/index.ts` + `types/index.ts`; optional for `services/` + `middlewares/`; skip for controllers/models/repositories/validators/config/utils by default.

### Client layout (Phase 1)

Feature-sliced: `pages → features → shared` (shared never imports features). Full standards: `client/CLAUDE.md`. Cursor mirrors: `.cursor/rules/client-architecture.mdc`, `client-code-quality.mdc`.

```
client/src/
  app/                 providers, router, queryClient, RouteError
  pages/               thin route entries (compose features)
  layout/              AppWrapper / AdminWrapper
  features/<domain>/   auth · chat · admin · profile · notifications · landing
                       api/ components/ hooks/ stores/ utils/ types.ts index.ts
  shared/              domain-agnostic UI, hooks, constants, types, lib/api (fetch), lib/socket
  assets/  styles/  main.tsx
```

- Server state → TanStack Query. Client/UI state → Zustand. Cross-feature imports only via `features/<domain>/index.ts`.
- Admin auth: httpOnly `adminToken` cookie; `ADMIN_SECRET` never in `VITE_*`.

Cursor rules live in `.cursor/rules/` (`acknowledge-rules`, `server-architecture`, `server-code-quality`, `client-architecture`, `client-code-quality`, `product-and-cost`).

When we start Phase 2, add a short “Phase 2 backend” section here (Redis keys, `/anon` events) instead of inventing a new stack.

---

## Decision log (so we don’t relitigate)

| Date | Decision | Reason |
|---|---|---|
| Aug 2026 | Keep Node + Express + Mongo + Socket.IO | Already built; right fit; $0 |
| Aug 2026 | TypeScript on server first, not Next.js rewrite | Highest quality gain, no hosting lock-in |
| Aug 2026 | Mongo for permanent data, Redis later for ephemeral match | Product + cost + speed |
| Aug 2026 | No Redis / Stripe / paid moderation in Phase 1 | $0 now; add when the feature exists |
| Aug 2026 | In-memory presence `Map` in Phase 1, swap file later | Same code shape, zero extra infra |
| Aug 2026 | Client: TanStack Query + Zustand (drop Redux) | Lighter server-state model; matches latest majors |
| Sep 2026 | Client: feature-sliced (`features/` + `shared/`), fetch via `shared/lib/api` | Align Cursor rules + CLAUDE.md; one-way deps |
| Aug 2026 | Client latest majors (React 19, Vite 8, RR7, Tailwind 4) | Same dependency policy as server |
| Aug 2026 | Admin `adminToken` cookie + `ADMIN_SECRET` | Real admin auth without leaking secret to Vite |
| Sep 2026 | Landing + SparkPass + legal pages shipped in Phase 1 | Marketing shell needed before any public share; design system built once and reused |
| Sep 2026 | `SameSite: 'none'` (not `'strict'`) on refresh cookie in prod | `strict` blocks cross-origin cookie sends when client and API are on different domains |
| Sep 2026 | Storage migrated from Cloudinary → R2 + ImageKit | R2: cheaper ($0.015/GB vs Cloudinary's credit model), no transformation credit limit. ImageKit: transform via URL params (`tr=w-N,f-auto,q-80`), 20GB free bandwidth. Raw key in DB means zero migration when swapping CDN. |
| Sep 2026 | GIFs bypass ImageKit transform (`transformWidth={undefined}`) | ImageKit `f-auto` may strip animation; GIF identity requires raw delivery |
| Sep 2026 | Cookie `path` stays `/` for refresh token (not scoped to `/api/auth/refresh`) | Scoped path causes Set-Cookie/clearCookie sync bugs on sign-in, sign-out; single-path is simpler and still httpOnly+secure |
