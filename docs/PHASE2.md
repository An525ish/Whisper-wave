# Whisper Wave — Phase 2 Plan

> Status: **SHIPPED (pending end-to-end verification)** — implementation is
> complete across server, client and moderation. The full two-browser flow still
> needs a manual pass against a live Redis + Mongo before launch.  
> Last updated: Oct 2026  
>
> Read alongside: [`PRODUCT.md`](./PRODUCT.md) · [`TECH.md`](./TECH.md) · [`USER_JOURNEY.md`](./USER_JOURNEY.md)

---

## What Actually Shipped (and how it differs from the plan below)

The original plan is preserved below for context, but several decisions changed
during implementation. This section is the accurate one.

### Deviations from the original plan

| Planned | Shipped | Why |
|---|---|---|
| `/anon` matching guarded by a global `match:lock:global` mutex | Atomic Lua `LREM` claim, no mutex | The lock serialized an O(n) queue scan process-wide — a hard throughput ceiling and a single point of failure. Concurrent matchers are now safe by construction and proven by a race test. |
| `match:waiting:{anonId}` TTL 15 min, deleted at match time | 24 h identity card, **never** deleted on match | The card doubled as "is this user queueing?", so it expired under connected clients and stranded them in a spinner. Identity and queue membership are now separate concerns; disconnect (not TTL) dequeues. |
| Disconnect immediately ends the match | 45 s grace period, then teardown | A dropped socket is not proof of departure. A 2-second blip was destroying the conversation for both people *and* leaving the reconnecting user with no route back into the queue. The Redis message buffer (built for exactly this) was unreachable as a result. |
| Relay-only messaging | Relayed **and** acked, with per-bubble delivery state | The client appended optimistically with no ack, so any server-side rejection (moderation, rate limit, 2000-char cap) left a message sitting in the sender's thread forever looking sent. |
| Freeform vibe tags, no moderation | Canonicalised tags + a first-line content filter | Tags had to be canonicalised or overlap scoring never matched. Unmoderated anonymous text to a stranger on first contact is not shippable. |
| `POST /api/report` guest-accessible with no membership check | Membership-verified | The limiter is per-IP, so without the check anyone could flood a stranger's moderation queue. |
| No age gate | Required 18+ attestation, server-enforced | Non-negotiable for app-store review and for a public anonymous layer. |
| `Connection` records written, never read | `GET /api/connection/:chatId` + in-chat origin strip | The whole point of the model is the "how we met" story. Data written and never shown is a waste of a collection. |
| Success metrics defined, nothing instrumented | `shared/lib/analytics.ts` emits all 7 funnel events | The metrics were unmeasurable. No-op unless `VITE_ANALYTICS_ENDPOINT` is set. |
| No tests | 23 unit tests + Redis integration suite (`npm test`) | The matcher is the most concurrency-sensitive code in the app. The race test exists specifically because the mutex was removed. |
| Separate `/whisper`, `/whisper/chat`, `/whisper/vibe` routes | One `/whisper` route driven by store state | A refresh on a cold sub-route has no session to restore. Browser Back is handled in-page so it steps to the waiting room instead of abandoning a live match. |
| Like button in the chat header | Persistent header heart + one-shot prompt | Prompt dismissal is now local UI state, not store state, so it can never permanently trap a user who changes their mind. |
| Auto requeue after skip (contradicting §6) | Spec behaviour kept: skipper re-queued, partner notified and returned to idle with a clear notice | |

### The vibe-eligibility gate (not in the original plan)

A like is not available immediately. It unlocks when **all** hold:

- ≥ 90 s since the match started
- ≥ 2 messages from **each** side
- ≥ 5 messages total (so at least one person carried more than the bare minimum)

Rationale: the like button is the conversion funnel. Ungated, mutual-like rates
are driven by impatience rather than connection, and a mutual DM between two
people who exchanged three words is a bad first impression for the connected
layer. The rule is duplicated in `server/src/services/match/vibeEligibility.ts`
and `client/src/features/whisper/lib/vibeEligibility.ts` — keep them in sync.
`meetsVibeGate` is pure and unit tested.

### Known follow-ups (not blockers)

- **Redis cost.** Upstash free is 10k commands/day; `tryMatchFromQueue` is O(n)
  per join. Fine to ~650 sessions/day, then PAYG. See Cost Analysis below.
- **No socket.io-redis adapter.** Single-process only. Required before
  horizontal scaling (~800 CCU).
- **Report admin UI.** `GET/PATCH /api/admin/report` exist and are admin-gated,
  but there is no panel in `client/src/features/admin` yet.
- **Moderation is a blocklist, not a classifier.** Perspective API is Phase 3.
  The filter fails *open* on internal error by design.
- **Two tabs, one anonId** will duplicate relayed messages (rooms are keyed by
  anonId, not socket). Low impact; fix by keying on `socket.id`.

---

## What Phase 2 Is

Phase 1 built the **connected layer** — login, DMs, groups, media, admin. It is a functional messaging app, but it has no entry point for the core product promise: *connect with a stranger with no account required*.

Phase 2 builds the **anonymous layer** — everything from "enter a name" to "mutual like → create account → real DM exists." This is the product differentiator. Without it, Whisper Wave is just another chat app. With it, it becomes what Omegle should have been.

The goal is to ship this at **$0** ongoing cost, using only free tiers.

---

## Why Each Piece of Phase 2 Is Needed

### 1. Anonymous matchmaking queue (Redis + `/anon` Socket.IO namespace)

**Why:** The app's core loop is: stranger → chat → maybe connect. None of this exists yet. Without the queue, users land on the auth page and see a messaging app that requires an account. There is no hook.

**Why Redis specifically:**
- Queues need atomic pop operations (`LPUSH`/`RPOP`). MongoDB has no native queue primitive — polling + findOneAndUpdate has race conditions under concurrency.
- Anon sessions **must die** when users disconnect. Redis TTL is built for this. MongoDB documents with a TTL index are slower and add extra collections to a paid Atlas cluster.
- Anon sessions should not be recoverable after disconnect (that is the product). Redis keys are gone on eviction/restart. If a match:session disappears, that's correct.
- Cost: Upstash free tier = 10,000 Redis commands/day, 256MB. At ~15 Redis ops per full anon session (join → match → 5 messages → like → mutual → end), that supports ~650 sessions/day at zero cost. For an app with no users yet, that is plenty.

**Why `/anon` namespace is separate from `/`:**
- The main `/` namespace uses `applySocketAuth` middleware (requires valid JWT). Anon users have no JWT.
- Mixing authenticated and anonymous in one namespace means writing conditional auth middleware that opens bypass paths — fragile. A separate namespace lets each have its own auth strategy cleanly.
- It also means a future Socket.IO clustering upgrade can scale the two namespaces independently if needed.

---

### 2. Vibe name + vibe tags picker (client)

**Why:** The vibe name is the only identity in the anonymous layer. Without it, users connect as "User_1" vs "User_2" — no personality, no reason to engage. The vibe tags serve as soft icebreakers and are the seed for premium interest-aligned matching (Phase 3).

**Why it's important to get right now:** These names and tags are stored in the `Connection.originNames` and `Connection.originVibeTags` fields when two people connect. That's the "origin story" — how they met. If you ship this with bad UX (too long, too slow, no fun name suggestions), you permanently reduce the quality of every future "how we met" moment.

**What to build:**
- Free text input with a character limit (≤24 chars)
- Auto-suggest button: generates a Gen Z aesthetic name from a wordlist on the client (no server call needed — keep a curated list of ~500 adjectives + ~500 nouns)
- Vibe tags: a scrollable chip selector, 2–3 max, from a curated list of ~20 (not freeform — freeform is a moderation nightmare)
- Gender declaration: radio with `prefer not to say` default — used only for premium queue routing in Phase 3, but collect it now

---

### 3. Waiting state / match animation (client)

**Why:** The gap between "join queue" and `MATCH_FOUND` can be anywhere from 0 to 30+ seconds depending on user count. A blank screen here kills the experience and makes it feel broken. The waiting state is also where the emotional tension builds — that anticipation is part of the product.

**What to build:** An animated waiting screen. The design system already has a pulse/ping animation (`motion-safe:animate-lw-ping`). A heartbeat ring, the user's own vibe name displayed, and the vibe tags floating in — all with CSS, no heavy library.

---

### 4. Anonymous chat room (client + server relay)

**Why:** This is the main interaction surface. Text relay needs to work correctly before anything else is layered on.

**Server:** Messages are **not saved to MongoDB**. They are relayed socket-to-socket within the session room on the `/anon` namespace. The server only validates: does the sender's `anonId` cookie belong to this session? If yes, emit `MATCH_MESSAGE` to the other socket in the room. That's it.

**Why not save messages:** 
- Product: if you skip, that person is gone. Saving their words in a DB is a privacy violation of the product's own promise.
- Legal: storing anonymous chat transcripts is PII under GDPR/PDPA even if there's no user account. Not storing them eliminates an entire legal risk vector.
- Cost: every message saved is a Mongo write. At even moderate traffic, this adds up on a free M0 cluster with a 5M document ceiling.

**Optional (decide before build):** Last-N messages in a Redis list (TTL-matched to the session) so a page refresh doesn't blank the screen. This adds ~3 Redis ops per message. Recommended: yes, up to last 50 messages, 24h TTL — this dramatically improves mobile UX where background tabs get killed.

---

### 5. Like mechanic + mutual like detection (server + client)

**Why:** The like button is the conversion funnel. It turns an anonymous chat into a real relationship. Without it, the only outcome of a match is: chat for a while, then close the tab. The like button is why the app is called Whisper **Wave** — reaching out.

**Why mutual (not one-sided):**
- One-sided like that immediately connects would feel invasive — "you liked me, so here's their real account."
- Mutual like means both people opted in. This is consent-by-design, which matters for an app where users do not know each other.
- "Someone is vibing" (the ambient one-sided indicator) creates tension without revealing identity. This is the product's most psychologically interesting UX moment.

**Server:**
- `ANON_LIKE` → `SADD match:likes:{sessionId} {anonId}`
- `SCARD match:likes:{sessionId}` == 1 → optionally emit `SOMEONE_VIBING` to room (vague — not "who")
- `SCARD` == 2 → emit `MUTUAL_LIKE` to both with a `connectToken` (JWT, 10 min TTL, contains `sessionId` + both `anonId`s + vibe names + tags)

**Client:**
- Persistent heart/spark icon in the chat room header (always visible, not intrusive)
- Single-tap. If already liked, button is filled/disabled. No unlike.
- On `SOMEONE_VIBING`: subtle ambient glow around the like button — not a banner
- On `MUTUAL_LIKE`: full-screen "It's a Vibe" moment — animation, connect CTA, countdown timer (connect within 10 min before token expires)

---

### 6. Skip / disconnect flow

**Why:** Skip is the product's "no pressure" safety valve. Users need to know they can leave at any time without consequence. Without a clear skip, the UX becomes sticky in an uncomfortable way.

**Server:**
- On `ANON_NEXT` or socket `disconnect`: mark session ended, tell partner `MATCH_DISCONNECTED`, delete session from Redis, remove both from the room
- Skipper is **not** auto-requeued (they should consciously choose to find someone new)
- Partner is **not** auto-requeued either (cleaner, avoids surprise)

---

### 7. PendingConnection → Connection flow (server + new Mongo models)

**Why:** When two anonymous users both hit "Connect," there's a timing problem — they need to create accounts independently, and one may sign up before the other has even seen the mutual like screen. The `PendingConnection` model bridges this gap.

This is architecturally the most important piece of Phase 2 because it is the only part that creates **permanent data**. The anon layer is ephemeral by design, but the moment both people connect, a real relationship exists that needs to be in MongoDB.

**New Mongo models:**
```
PendingConnection {
  sessionId: string          // the Redis room ID (already gone from Redis, kept here for reference)
  sides: [
    { anonId, userId | null, displayName, vibeTags },
    { anonId, userId | null, displayName, vibeTags }
  ]
  expiresAt: Date            // 7 days — if partner never signs up, pending is cleaned up
  createdAt: Date
}

Connection {
  users: [ObjectId, ObjectId]
  chat: ObjectId             // the auto-created DM chat ref
  originAnonSession: string  // sessionId — for "how we met" story
  originNames: [string, string]
  originVibeTags: [string[], string[]]
  connectedAt: Date
}
```

**Flow:**
1. User A signs up with `connectToken` → create User, create PendingConnection with side A populated
2. User B signs up (or logs in) with `connectToken` → find PendingConnection by `sessionId`, populate side B
3. Both sides populated → create Chat (DM), create Connection, delete PendingConnection, emit `CONNECTION_READY { chatId }` to both authenticated sockets

**Why `connectToken` as the bridge (not sessionId directly):**
- `connectToken` is a JWT signed by the server — it proves the client was legitimately in that session at the time of mutual like, not just someone who guessed a sessionId
- It has a 10-minute TTL, so old tokens can't be replayed days later
- It contains all the origin data (vibe names, tags) so the Connection document can be created without Redis still being alive

---

### 8. "It's a Vibe" screen + connect → signup funnel (client)

**Why:** This is the highest-stakes UX moment in the entire product. Users have just had a genuine connection with a stranger and now need to create an account in under 10 minutes or lose this person forever. Friction here kills conversion.

**What makes this hard:**
- Users arriving here may have never intended to create an account ("I just wanted to chat anonymously")
- The signup form is the same form they've been avoiding by staying anonymous
- There's a countdown timer creating artificial (but real) pressure

**Design principles:**
- The "It's a Vibe" reveal screen should be **delightful, not functional** — celebrate the moment before presenting the action
- The connect CTA takes users to the existing `RegisterForm` but with the `connectToken` pre-loaded in state/URL — no friction from having to "remember" why they're signing up
- The origin story (vibe names, shared tags) should be **shown on the signup screen** — "You matched as `midnight_fox` and `blue_static`. Sign up to keep them." This is the emotional hook that gets the account created.
- Support for "I already have an account" → login path with the same `connectToken`
- If the countdown expires before both sign up: graceful failure message ("The moment passed. Find someone new?") — not a generic 401

---

### 9. Report + block (server + client, minimal)

**Why it's non-negotiable in Phase 2:**
- The moment you open anonymous matching to the public, you will get bad actors. There is no alternative.
- Without report/block, a single screenshot of someone being harassed on your app can end the product before it has users.
- Building this now (when it's simple) is 10x cheaper than retrofitting it after a moderation incident.

**What to build (Phase 2 minimum, no paid AI):**
- **Report:** `POST /api/report` — saves `{ reporter, targetAnonId | targetUserId, sessionId | chatId, reason, timestamp }` to MongoDB. No action taken automatically — just a log for manual review. Reason dropdown: inappropriate content / spam / harassment / other.
- **Block (anon):** Redis Set `match:blocked:{anonId}` — when A blocks B, add B to A's blocked set. Matcher checks both sides before pairing. TTL 30 days (anonymous sessions shouldn't carry lifetime bans).
- **Block (connected):** Existing `User` model — add `blockedUsers: [ObjectId]` field. Blocked users can't send DMs or friend requests.
- **Safe exit:** already implied by the skip mechanic — `ANON_NEXT` from either side ends the session immediately, no confirmation, no message to partner.
- **In-app UI:** 3-dot menu in the anonymous chat → Report / Leave. After report is submitted: "Thanks, we'll review this." Continue chat (they can report and still finish the conversation) or end it.

---

### 10. UI — Find Someone flow (client, new screens)

The following new screens/routes need to be built:

| Screen | Route | Description |
|--------|-------|-------------|
| Anonymous entry | `/whisper` (or `/find`) | Vibe name + tag picker + gender opt-in + Find button. Guest-accessible (no auth required). |
| Waiting | same route, `waiting` state | Animated waiting state. Socket `QUEUE_JOINED` → show. `MATCH_FOUND` → transition. |
| Anon chat room | `/whisper/chat` | Text input, message relay, like button, skip button, report menu. No media, no read receipts. |
| It's a Vibe | `/whisper/vibe` | Mutual like celebration screen. Shows vibe names, connect CTA, timer countdown. |
| Connect → signup | Passes to existing `/auth?connectToken=...` | Same RegisterForm, but with origin story header and token in URL params |
| Connection complete | Redirect to `/` (chat home) | `CONNECTION_READY` socket event fires, opens the new DM automatically |

**Landing page integration:** The main CTA on the landing page ("Start a Wave" / "Find Someone") should link directly to `/whisper`. Currently it likely links to `/auth`. This is the change that makes the anonymous flow discoverable.

---

## Technical Plan

### Server changes

#### New files
```
server/src/
  config/
    redis.ts          # Upstash/ioredis client, singleton, connect on startup
  models/
    pendingConnection.ts
    connection.ts
    report.ts         # report log
  repositories/
    pendingConnection.ts
    connection.ts
    report.ts
  services/
    match/
      queue.ts        # join/leave queue, Redis LPUSH/RPOP
      session.ts      # create/get/end session, Redis Hash ops
      like.ts         # SADD likes, check mutual, issue connectToken
  controllers/
    match.ts          # HTTP: join, leave, like, next, connect
    connection.ts     # HTTP: complete, get
    report.ts         # HTTP: submit report
  socket/
    anon/
      index.ts        # createAnonNamespace(io) — returns Namespace
      auth.ts         # middleware: validate anonId cookie
      handlers.ts     # ANON_MESSAGE, ANON_LIKE, ANON_NEXT, ANON_TYPING_*
  routes/
    match.ts
    connection.ts
    report.ts
  validators/
    match.ts          # Zod: join body (displayName, vibeTags, gender)
```

#### Changes to existing files
```
server/src/socket/index.ts
  → import { createAnonNamespace } from './anon/index.js'
  → call createAnonNamespace(io) after existing io.use(applySocketAuth)

server/src/routes/index.ts
  → register match, connection, report routes

server/src/config/cors.ts
  → anonId cookie options (httpOnly, sameSite: 'lax' dev / 'none' prod, no path scope)
```

#### Redis key schema
```
match:queue:global         List   — FIFO queue of anonIds (free users)
match:queue:pref:male      List   — Phase 3 only (premium gender filter)
match:queue:pref:female    List   — Phase 3 only
match:waiting:{anonId}     Hash   — { displayName, vibeTags, gender, joinedAt }   TTL 15min
match:session:{sessionId}  Hash   — { anon1, anon2, name1, name2, tags1, tags2, status, createdAt }  TTL 24h
match:likes:{sessionId}    Set    — Set<anonId>   TTL same as session
match:messages:{sessionId} List   — last 50 messages JSON   TTL 24h  (optional, improves mobile UX)
match:blocked:{anonId}     Set    — blocked partner anonIds   TTL 30d
```

#### New environment variables
```
REDIS_URL=          # Upstash REST URL or ioredis connection string
REDIS_TOKEN=        # Upstash REST token (if using @upstash/redis HTTP client)
ANON_JWT_SECRET=    # separate secret for connectToken signing (not the same as ACCESS_TOKEN_SECRET)
ANON_TOKEN_TTL_MIN= # default 10 (minutes)
```

**Redis client choice:** Use `@upstash/redis` (HTTP-based, works on any host, no persistent TCP connection needed). Simpler to deploy on free hosts that may not allow persistent Redis connections. Fall back to `ioredis` if self-hosting Redis later.

---

### Client changes

#### New files
```
client/src/
  features/
    whisper/             # new feature domain
      api/
        match.ts         # POST /api/match/join, like, next, connect
        connection.ts    # POST /api/connection/complete
      components/
        VibeNamePicker.tsx
        VibeTags.tsx
        WaitingRoom.tsx
        AnonChatRoom.tsx
        AnonMessageBubble.tsx
        AnonLikeButton.tsx
        MutualVibeScreen.tsx
        ReportMenu.tsx
      hooks/
        useAnonSocket.ts  # connects to /anon namespace, handles MATCH_FOUND etc.
        useMatchQueue.ts  # manages queue state, calls match API
        useAnonChat.ts    # local message state (not persisted), relay messages
      stores/
        anonStore.ts      # Zustand: sessionId, anonId, partnerName, likeSent, mutualLike
      types.ts
      index.ts
  pages/
    Whisper.tsx           # route entry, composes whisper feature screens
```

#### Changes to existing files
```
client/src/app/router.tsx
  → add route /whisper (guest-accessible, no auth guard)
  → landing CTA link: /auth → /whisper

client/src/features/auth/components/RegisterForm.tsx (or step 1)
  → read connectToken from URL search params
  → if present: show "You matched as {name} and {partnerName}" header above form
  → pass token in signup body

client/src/features/auth/components/LoginForm.tsx
  → same connectToken read: "Sign in to connect with them"

client/src/shared/lib/socket.ts (or wherever socket client is initialized)
  → export function createAnonSocket(): Socket — connects to /anon namespace, no auth header
```

#### Socket client: `/anon` namespace
The anon socket is **separate** from the main authenticated socket. It connects without a JWT. The server's `/anon` namespace middleware validates the `anonId` cookie instead.

```ts
// useAnonSocket.ts sketch
const socket = io('/anon', {
  withCredentials: true,  // sends anonId cookie
  autoConnect: false,     // connect only when user joins the queue
  transports: ['websocket'],
});
```

---

## Cost Analysis

### Current Phase 1 costs: $0/month

| Service | Tier | Limit relevant to us |
|---------|------|---------------------|
| MongoDB Atlas M0 | Free forever | 512MB storage, 100 simultaneous connections |
| Cloudflare R2 | Free tier | 10GB storage, 1M Class A ops/month (PUT/POST), 10M Class B ops/month (GET) |
| ImageKit | Free tier | 20GB bandwidth/month, unlimited transformations |
| Hosting | Local / dev | — |

### Phase 2 new service: Redis

| Option | Cost | Limit |
|--------|------|-------|
| Upstash Redis (free) | $0 | 10,000 commands/day, 256MB, 1 database |
| Upstash Redis (Pay-as-you-go) | $0.2 per 100K commands | Unlimited |
| Redis Cloud free | $0 | 30MB storage, no daily command limit |

**Recommendation:** Start with Upstash free tier. 10k commands/day = ~650 full anon sessions/day (15 Redis ops each). When you hit this: Upstash pay-as-you-go costs $0.002 per session — at 1000 sessions/day that's $0.06/day = **$1.80/month**.

### Hosting reality check

Free hosts (Render, Railway, Fly free) have a critical problem for this app: **they put processes to sleep after 15 minutes of inactivity**. A chat app with Socket.IO connections **cannot sleep**. A socket disconnects mid-conversation when the host sleeps. This means:

- **Local dev:** fine
- **Friend testing (small group):** Render free works if someone pings it every 14 min (use Uptime Robot, free)
- **Public launch:** you need an always-on server

**Best always-on free option:** Oracle Cloud Free Tier  
- 2 AMD VMs (1 OCPU, 1GB RAM each) — always free, no expiry, no credit card required beyond signup
- **Or** 4 ARM VMs (sharing 3000 OCPU-hours/month, up to 18GB RAM total)  
- Outbound data: 10TB/month free  
- This is more than enough for Phase 2 with early users

**Second option:** Fly.io free tier (3 shared VMs, 160GB outbound/month). Simpler to deploy, but has a 3-machine limit and the free tier has been reduced over time — less reliable for the long term.

---

## When Free Tiers Break: User Growth Projections

These are the inflection points where you'll need to spend money or upgrade:

### MongoDB Atlas M0 → paid

**Limit:** 512MB storage, 100 simultaneous connections, 5M documents  
**Pressure point:** 100 connections is the hard limit. Each active Socket.IO user = 1 Mongo connection (via Mongoose pool, shared across requests). With the pool default of 5, that's effectively 20 concurrent requests before the pool is fully saturated.

Realistically, 100 connections = ~200–500 concurrent users (most don't hold connections 100% of the time).

**Projection:**
- 0–500 DAU: M0 fine
- 500–2000 DAU: M0 connection pool starts to saturate during peak hours. Watch `mongotop` and connection count.
- **~2000 DAU: upgrade to M10 = $57/month**

**Storage:** 1 message ≈ 200 bytes. 2000 users × 20 messages/day × 30 days = 240MB/month. You'll hit 512MB in ~2 months at 2000 DAU. Media (avatar + attachments) is on Cloudinary, not Atlas, so storage cost is primarily messages + user docs.

**Decision point: ~1500 DAU or ~2 months of activity, whichever comes first.**

### R2 + ImageKit free → paid

**R2 free limits:** 10GB storage, 1M PUT ops/month, 10M GET ops/month.

- 1 avatar upload = 1 PUT. 10,000 new signups = 10,000 PUTs → well within 1M/month.
- 1 image attachment send = 1 PUT. 1000 DAU × 5 attachments/day = 150K PUTs/month → still free.
- Storage: 1 image ≈ 200KB (compressed). 10,000 images = 2GB. 50,000 images = 10GB (free limit hit).

**R2 paid:** $0.015/GB storage, $4.50/million Class A ops. At 50,000 media files uploaded ≈ ~$0.75/month storage + ~$0.23/month ops = **under $1/month** at 50K files. Very cheap.

**ImageKit free limits:** 20GB bandwidth/month.

- 1 image view (thumbnail) ≈ 10–50KB. 1000 DAU × 20 image views/day = 200K–1M views/month = 2–50GB bandwidth.
- **Decision point: ~400–1000 DAU will saturate 20GB/month depending on media heaviness.**

**ImageKit paid:** $49/month (100GB bandwidth). Until then, can reduce usage by: caching aggressively in the client, using lower `q` values, serving WebP only.

**Decision point: ~500–1000 DAU for ImageKit bandwidth. R2 storage stays free until ~50,000 cumulative media uploads.**

### Upstash Redis free → pay-as-you-go

**Limit:** 10,000 commands/day  
**At 650 sessions/day:** you've hit the limit.

**650 sessions/day is actually a good problem to have** — that means ~1300 unique users/day (2 per session). At this point, Upstash pay-as-you-go kicks in automatically at $0.2/100K commands.

**Projection:**
- 0–650 sessions/day: $0
- 650–10,000 sessions/day: ~$0.2–$2/day = **$6–60/month**
- 10,000+ sessions/day: need to optimize Redis ops per session (batch, pipeline)

**Decision point: free until 650 sessions/day. No action needed until then.**

### Socket.IO / server hosting

A single Node.js process on a 1 OCPU / 1GB Oracle free VM handles:
- ~500–800 concurrent Socket.IO connections (empirical range for a chat app with moderate fan-out)
- ~300–500 concurrent message-relaying sessions without significant CPU pressure

**Pressure point:**
- 1000+ concurrent users: need a second server instance, which means Redis-based socket.io-redis adapter for cross-server room messaging. This is a Phase 4 concern.
- **Decision point: ~800 concurrent users (DAU × peak concurrency factor, typically 10–20% of DAU are online simultaneously). For 800 CCU, you need roughly 4,000–8,000 DAU.**

### Summary: when you first need to spend money

| DAU threshold | What breaks | Monthly cost |
|---------------|-------------|-------------|
| ~500–1000 DAU | ImageKit 20GB bandwidth | $49 (ImageKit Growth) |
| ~500–1500 DAU | Atlas M0 connections | $57 (Atlas M10) |
| ~50,000 media uploads | R2 10GB storage | ~$1/month (R2 PAYG, very cheap) |
| ~650 sessions/day | Upstash free | $2–$10 (PAYG) |
| ~4,000–8,000 DAU | Server capacity | $6/month (Oracle ARM upgrade) or $20 (Hetzner CX22) |

**Bottom line: you can realistically reach ~500 DAU on a fully $0 infrastructure stack.** The first dollar you'll spend is likely ImageKit bandwidth at ~500–1000 DAU ($49/month), or Atlas M10 at ~1500 DAU ($57/month). R2 storage stays nearly free well past 10,000 users.

---

## Revenue Model: When Spark Pass Covers Costs

Spark Pass pricing (from `PRODUCT.md`):
- Monthly: ₹199 (~$2.40) / $4.99
- Annual: ₹1499 (~$18) / $29.99

**Break-even analysis (India-first market, ₹199/month):**

| Infrastructure cost | Monthly | Spark Pass users needed to cover |
|--------------------|---------|----------------------------------|
| Atlas M10 ($57) | ~₹4,750 | 24 paid users |
| ImageKit Growth ($49) | ~₹4,080 | 21 paid users |
| R2 storage (~$1) | ~₹85 | 1 paid user |
| Upstash PAYG (~$10) | ~₹830 | 5 paid users |
| Hetzner VPS (€4.15 = ~$4.60) | ~₹380 | 2 paid users |
| **Full stack (all above)** | **~₹10,125** | **51 paid users** |

**Conversion rate benchmark:** Premium conversion on social/chat apps is typically 2–5% of MAU. At 1% (conservative), you need **6,800 MAU** to sustain infrastructure costs. At 3%, you need **2,300 MAU**.

**Phase 2 target:** Get to 500+ MAU on the connected layer before worrying about paid infrastructure. Once anonymous matching is live, MAU should grow faster (lower friction entry). At 500 MAU, even at 1% conversion = 5 paid users = ~₹1,000/month. Not enough to cover costs, but the trajectory is visible.

**The Spark Pass UI is already built** (the pricing page is live). What's missing is Stripe integration, which is Phase 3. Stripe is free to integrate — you only pay 2% + ₹10 when actual transactions happen.

---

## Phase 2 Feature Scope (what to build vs defer)

### In Phase 2

| Feature | Priority | Why now |
|---------|----------|---------|
| Anonymous matchmaking (queue + session + relay) | P0 | Core product — nothing works without this |
| Vibe name + tag picker (client) | P0 | Identity layer for anon sessions |
| Waiting room animation (client) | P0 | UX — blank screen is a dead end |
| Anon chat room (text only) | P0 | Core interaction surface |
| Like + mutual like + `connectToken` | P0 | Conversion funnel |
| "It's a Vibe" screen (client) | P0 | Emotional payoff — most important UX moment |
| Connect → signup with origin story | P0 | Drives account creation |
| PendingConnection + Connection models | P0 | Without this, the connect → DM link doesn't exist |
| Skip / disconnect | P0 | Safety + UX |
| Report + block (minimal) | P0 | Non-negotiable for public launch |
| `/whisper` route + landing CTA update | P0 | Discovery — connects marketing to product |

### Defer to Phase 3

| Feature | Why defer |
|---------|-----------|
| Stripe / Spark Pass payments | No revenue need yet; integrate when premium matching exists |
| Gender/vibe preference queue | Requires premium auth check; build after Stripe |
| Anonymous voice notes | Premium feature; needs Cloudinary audio pipeline |
| Re-find mechanic | Requires archived session data; Redis TTL expires it now |
| Location-based matching | City-level = geolocation permission + IP lookup service = added cost |
| Automatic text moderation | Paid (Perspective API); add after revenue |
| Image attachments in anon chat | Cloudinary costs + moderation risk; text-only first |

### In Phase 2 but after core anon loop (P1)

| Feature | Notes |
|---------|-------|
| Logged-in user goes anonymous (Journey C) | Requires checking auth + anon socket simultaneously — slightly more complex auth middleware |
| "Someone is vibing" ambient indicator | Optional; can ship without it, add in polish pass |
| Message persistence in Redis (last-N) | Optional; improve mobile UX but adds Redis ops |
| Profile "connection origin story" display | Shows vibe names on the DM header — small but delightful |

---

## Build Order

Build Phase 2 in this exact order to maximize testability at each step:

**Step 1: Redis infrastructure (server)**  
`config/redis.ts` → verify connection locally → write unit tests for queue/session service with a real local Redis instance.

**Step 2: Match queue + session (server-only)**  
`services/match/queue.ts` + `services/match/session.ts` → `controllers/match.ts` → `routes/match.ts`. Test with curl/Postman: can you join, get a `sessionId`, and see both sides?

**Step 3: `/anon` Socket.IO namespace (server)**  
`socket/anon/index.ts` + auth middleware + message relay. Test with two `socket.io-client` scripts in terminal — can two anonId cookies chat?

**Step 4: Like + connectToken (server)**  
`services/match/like.ts`. Test: two clients each send `ANON_LIKE`, verify `MUTUAL_LIKE` fires with a valid JWT.

**Step 5: PendingConnection → Connection (server)**  
`models/pendingConnection.ts`, `models/connection.ts`, `services/connection.ts`. Test the full A8→A9 flow with two Postman requests.

**Step 6: Client — vibe name picker + waiting room**  
`features/whisper/components/VibeNamePicker.tsx`, `WaitingRoom.tsx`, `useMatchQueue.ts`, `useAnonSocket.ts`. Test locally — can you reach the waiting state?

**Step 7: Client — anon chat room + like button**  
`AnonChatRoom.tsx`, `AnonLikeButton.tsx`. Test two browser windows — messages relay, like fires.

**Step 8: Client — mutual like screen + connect → signup**  
`MutualVibeScreen.tsx` + RegisterForm with `connectToken`. Test the full end-to-end: two windows, mutual like, one signup, the other signup, verify DM is created.

**Step 9: Report + block (server + client)**  
`report.ts` + `ReportMenu.tsx`. Simple implementation, must be live before any public share.

**Step 10: Landing CTA update + `/whisper` route**  
Wire the marketing CTA to `/whisper`. This makes the full user journey discoverable from the landing page.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Upstash free tier commands exhausted early | Medium | Blocking (queue stops working) | Monitor command count; switch to PAYG at first alert ($0.20/100K, negligible) |
| Redis session loss on restart (Upstash persistence) | Low | Moderate (active sessions dropped) | Upstash persists data across restarts by default. For in-memory Redis (local dev), document that dev restarts drop sessions — expected behavior |
| `connectToken` replay attack | Low | High (user can re-use token to create duplicate connections) | Token is single-use: on `connection/complete`, mark PendingConnection as `processing` before writing Connection. Check `status !== 'pending'` and reject if already processed |
| Both users sign up but Connection creation fails (partial write) | Low | High (orphaned PendingConnection, no DM) | Wrap in a Mongoose session/transaction. If Mongo M0 doesn't support transactions (M0 is a shared cluster — it does support multi-document transactions on Atlas since 4.2), use a compensating write: try to create Chat + Connection atomically, on failure clean up and tell both users |
| Socket disconnects during "It's a Vibe" countdown | Medium | Moderate (user can't complete connection) | `connectToken` is valid for 10 min. Even if the socket drops, the user still has the token in client memory and can complete via the HTTP `/connection/complete` endpoint without a live socket |
| Abuse/harassment in anonymous chat | High (certainty) | High (reputational) | Report + block built in Phase 2. Manual review of reports. Rate limit `ANON_MESSAGE` per anonId (e.g. 60 messages/minute). Block known-bad patterns server-side |
| Cloudinary free tier exceeded from avatar uploads | Medium | Moderate (new users can't upload avatar) | Fall back to a placeholder/random avatar if Cloudinary fails. Track usage and plan S3 migration before launch |
| Two users in "It's a Vibe" screen, one already signed up with same email via different session | Low | Moderate | Standard duplicate-email 409 error from signup flow; display "already have an account? Log in" with the connectToken pre-filled |

---

## Open Decisions — RESOLVED

See "What Actually Shipped" at the top of this document for the full rationale.

- [x] **One-sided like signal** → `SOMEONE_VIBING` (ambient pulse) **plus** a durable `MATCH_PARTNER_VIBED` flag. The pulse alone was lossy: the client gated it on the *recipient's* own unlock state, so a like arriving during the 90 s warm-up was lost permanently. The flag persists, so the nudge surfaces as soon as the recipient is eligible.
- [x] **Message persistence** → last-50 in Redis, kept. It is what makes the 45 s reconnect grace period survivable; without it, a refresh would still blank the thread.
- [x] **After skip** → skipper is auto re-queued (matches the product's energy); the partner is notified and returned to the picker with a clear reason, **not** silently re-queued.
- [x] **After disconnect** → 45 s grace period, then teardown and a partner notification. This replaced immediate teardown, which caused permanent dead-ends.
- [x] **PendingConnection TTL** → 7 days, unchanged. Still open: if the partner never connects, the first user gets no notification.
- [x] **Anon messages in the origin story** → **No.** Copying anonymous messages into a permanent record contradicts the product's own privacy promise. Only vibe names and tags carry over.
- [x] **Logged-in user going anonymous** → allowed. `completeConnection` binds the caller's `userId` to their own anonId side only, and rejects the case where one account would occupy both sides of a session (self-DM).
- [x] **Age gate** → required 18+ checkbox, enforced server-side in `joinQueueSchema`. Zero friction but non-zero protection, and it satisfies store-review requirements. Real KYC remains Phase 3+.

---

## Success Metrics for Phase 2

Define these before building so you can measure whether Phase 2 is working:

| Metric | Target at 30 days post-launch |
|--------|-------------------------------|
| Anon sessions started / day | 50 (proof of concept), 500 (early traction) |
| Like rate (% of sessions where at least one person likes) | > 40% |
| Mutual like rate (% of sessions with mutual like) | > 15% |
| Connect rate (% of mutual likes that lead to account creation) | > 25% |
| Session duration (time from match to skip/disconnect) | Median > 3 min |
| Report rate | < 2% of sessions |
| Connected users who start another anon session (retention loop) | > 20% |

These metrics tell you: is the core loop working, is it safe, and is it creating the retention flywheel?

### How each metric is measured

Events are defined in `client/src/shared/lib/analytics.ts` and emitted via
`track(ANALYTICS.X, props)`. They are a **no-op unless `VITE_ANALYTICS_ENDPOINT`
is set**, so nothing leaves a dev machine or a fork. No PII is ever attached —
only counts, booleans and short labels. Never an alias, a message body, or an
`anonId`.

| Metric | Derived from |
|---|---|
| Sessions started / day | `whisper_join` per distinct visitor |
| Like rate | `whisper_like_sent` ÷ `whisper_matched` |
| Mutual like rate | `whisper_mutual` ÷ `whisper_matched` |
| Connect rate | `whisper_dm_opened` ÷ `whisper_mutual` |
| Median session duration | `whisper_session_end.durationMs` |
| Report rate | `whisper_report` ÷ `whisper_matched` |
| Retention loop | `whisper_join` from a user with a prior `whisper_dm_opened` |

`whisper_session_end` carries `durationMs` and `messageCount`, which also gives
you the vibe-gate unlock rate for free (sessions with ≥ 5 messages and ≥ 90 s
duration are the ones that could ever produce a mutual like).

---

## What Phase 3 Unlocks (preview)

Phase 3 is gated on Phase 2 being live and metrics being positive. It adds:

1. **Stripe + Spark Pass payments** — the monetization layer. Integrate after Phase 2 anonymous matching proves the product has users.
2. **Gender/vibe preference queue** — premium-only feature, gated by `Subscription` model check.
3. **Anonymous voice notes** — premium UX differentiator. Requires audio Cloudinary pipeline.
4. **Content moderation APIs** — Google Perspective API for text toxicity, AWS Rekognition for images. Only makes economic sense after Spark Pass revenue.
5. **Re-find mechanic** — Redis TTL-archived session stubs for paid reconnect credits.

Phase 3 is where the app becomes a business. Phase 2 is where it becomes a product.
