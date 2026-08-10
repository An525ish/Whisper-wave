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
| **Cloudinary** | Free tier | Avatars + attachments. |
| **JWT + cookies** | Free | Login without a paid auth product. |
| **Vite + React client** | Free | Not touching frontend yet. |
| **TypeScript 7 / Zod 4 / Multer 2 / Jimp 1** | Free | Phase 1 baseline — Phase 2 follows the same majors. |

We are **not** removing MongoDB. We are **not** rewriting the backend in another language.

### Dependency policy

Phase 1 is on **latest majors**. Phase 2 must not invent an older parallel stack.

- Prefer current majors: Express 5, Mongoose 9, Multer 2, Jimp 1, uuid 14, Zod 4.
- **No `dotenv`** — Node 20+ `--env-file` / `--env-file-if-exists` loads `.env` (see npm scripts).
- When adding Redis / Stripe later, install the current major at that time.
- After big upgrades: `npm run typecheck` + `npm run build` + hit `/health`.
- Require **Node >= 20** (`engines` in `server/package.json`).

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

## What we will do in Phase 1 (now) — backend only

Goal: make the **existing connected-chat server** clean, typed, and safe — without new product features and without new paid services.

| We will do | Why (simple) | Cost |
|---|---|---|
| Move server to **TypeScript** | Catch bugs before users hit them (wrong `chatId`, missing sender, etc.) | Free |
| Split `index.js` into `app` / `server` / `socket` / `config` | One 162-line file mixing everything is hard to change. Phase 2 will be painful if we don’t. | Free |
| Fix real bugs (double signup response, auth-after-update, etc.) | Current register/update/leave-group paths can fail or be insecure | Free |
| **Zod** for env + request validation | Crash at startup if `.env` is wrong. Reject garbage input instead of trusting `req.body` | Free (open source) |
| **Helmet + rate limit + smaller JSON body** | Basic protection from bots / brute-force login. No paid WAF. | Free |
| **Pino** logs instead of `console.log` | Structured logs we can read later. Not Datadog/Sentry (those cost money). | Free |
| Mongo **indexes** | Chat lists and message history stay fast as data grows. Indexes are free. | Free |
| Auth middleware: verify JWT only, no DB hit every request | Faster + cheaper on Atlas free tier (fewer reads) | Free |
| Isolate presence in `utils/socket.ts` (`Map`) | Same API later when we plug Redis. We don’t pay for Redis yet. | Free |
| Health route + graceful shutdown | Needed when we eventually deploy. Costs nothing now. | Free |
| Keep FFmpeg/Jimp **in-process** | Moving to a worker queue needs Redis + extra process. Skip until uploads actually hurt. | Free |

**Phase 1 does not include:** anonymous matching, Redis, Stripe, moderation APIs, push notifications, new frontend.

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

When Spark Pass makes money, *then* add automated text/image moderation.

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

Phase 1 is only the Node box + Mongo + Cloudinary. Redis stays off.

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
- `models/user.ts` (schemas only; types live in `types/`)
- `types/user.ts` (all shared TS types)
- `validators/auth.ts` / `routes/auth.ts`

### Layering

```
routes → middlewares → controllers (HTTP only) → services (business) → models
                                                      ↑
                                                   types/
```

Controllers parse `req`/`res`, call services, set cookies/status. Services never import Express. Types are never defined inside controllers/services when shared — put them in `types/`.

**Route registration:** only in `routes/index.ts` via `registerRoutes(app)`. `app.ts` must not mount feature routers itself.

**Barrels:** required for `routes/index.ts` + `types/index.ts`; optional for `services/` + `middlewares/`; skip for controllers/models/validators/config/utils by default.

Cursor rules enforcing this live in `.cursor/rules/` (`acknowledge-rules`, `server-architecture`, `server-code-quality`, `product-and-cost`).

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
