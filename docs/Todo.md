# Whisper Wave — TODO

## Status

**Free tier only until real users or revenue.** Paid/Spark Pass work is audited
below and must not be started — see [Deferred — Spark Pass](#deferred--spark-pass-paid-audit-only).

Scope decisions settled Sep 2026:

- Anonymous **threads** are never persisted and never appear in "All Chats" /
  "Personal". Anonymous *connections* are persisted and listed with their origin
  story (`Connection.originAnonSession` + `ConnectionOriginStrip`).
- **No concurrent anonymous chats.** One active session per anon identity.
  Sequential, with a short-lived Redis archive for the thread you just left.
- Guests are never capped. Any quota applies to **signed-in** users only.

---

## Anonymous chat — free-tier roadmap (agreed)

Ordered so each phase is independently shippable.

### A — Foundation (no new product surface)

| # | Task | Where | Why |
|---|------|-------|-----|
| A1 | `LRANGE 0 -1` → `LRANGE 0 199` in the join scan | `server/src/services/match/queue.ts` | `tryMatchFromQueue` is **O(n) per join** — full queue scan, n card GETs, n unpipelined block checks. At 10k queued that's ~20k Redis ops *per join attempt*. This is the real scaling ceiling, not session storage |
| A2 | Pipeline `isBlockedEitherWay` instead of `Promise.all` | same file | n commands → 1 round-trip |
| A3 | Move `userSocketIds` to Redis | `server/src/services/presence/index.ts` | In-memory `Map`. Breaks under a 2nd Node process. Affects the **logged-in** app too |
| A4 | Move presence sweep timers to Redis | `server/src/services/match/presence.ts` | Same single-process ceiling |
| A5 | Unify whisper bubble + composer CSS onto `bubble-in`/`bubble-out` and chat's composer shell classes | `features/whisper/components/anonChatRoom*.css` | Two design systems for "a chat" is why the screens look different. ~200 lines deleted vs. a risky refactor |
| A6 | Extract shared `useAutoGrowTextarea` | `features/whisper/hooks/` + `features/chat/components/conversation/composer/ChatInput.tsx` | Literal duplicate of the 44→128px autosize |
| A7 | Extract typing dots + `groupMessages()` tail logic | → `shared/` | Two independent implementations of each |
| A8 | Fix the boot-splash dead-end | `client/src/features/chat/hooks/useProfileQuery.ts` + `App.tsx` | `clear()` fires only on a **401**. Any other failure (backend down, DNS, CORS) leaves `bootstrapped: false` forever — permanent loader, no error, no retry |

### B — Partner-left state

Do **not** eject to the picker. Add status `'partner_left'`.

- Socket stays warm (`shouldConnect = status !== 'idle'`) so re-matching is fast.
- Messages stay readable; header keeps the alias, greyed.
- Composer is **replaced**, not `disabled` — a greyed input reads as broken.
  Prompt row: "They're gone." + [Find someone new] [Stay here].
- Auto-requeue after ~4s, cancellable, countdown visible. Never silently requeue.
- **Keep report available** on the finished thread — today report-after-leaving
  is impossible, so being matched and dropped makes someone unreportable.

✅ **Shipped.** No server change was needed: `ANON_NEXT` already tolerates a
session the server has torn down, and reports still resolve against the session
retained for an hour after it ends.

#### ⚠️ Follow-up found while testing: no disconnect reconciliation

Observed live: the server had ended the session while the client still showed
`matched`. The client kept rendering a working chat whose every message failed
forever, with nothing telling the user the thread was over.

This was **not** specific to the partner-left state; it affects any path where a
`MATCH_DISCONNECTED` is missed (flaky emit, reconnect race, dropped room join).

✅ **Fixed — client now self-heals from three independent signals.** None of them
polling, so none of them cost a request on a healthy connection:

1. **Server-authoritative `code` on rejection.** `ANON_MESSAGE`'s ack and
   `MATCH_ERROR` now carry `code: 'session_ended'` alongside the prose `reason`.
   Previously the only way to recognise a dead session was to pattern-match
   `reason`, which couples the client to server wording.
2. **Ack path** — a rejected send settles the bubble as failed (so the typed text
   is visibly unsent) and then transitions to `partner_left`.
3. **`MATCH_ERROR` path** — covers likes and typing, where there is no ack.
4. **Reconnect** — already present: the client re-emits `ANON_REQUEUE` on every
   socket `connect`, and the server answers with either a `MATCH_FOUND` replay or
   a fresh queue entry.

Verified live by forcing the exact desync (flipping the session to `ending` in
Redis with **no** disconnect emitted, via `server/scripts/dev-desync.mjs`): the
client showed a live chat, the next send flipped it to the partner-left prompt,
and the 4 s auto-requeue returned it to the queue. **The user is never stranded.**

#### The missed disconnect: narrowed, and half of it closed

The reconciliation makes a missed event *survivable*, but the question underneath
was whether the **normal** partner-left path was also broken with only the
fallback carrying it. That part is now answered.

✅ **`notifyMatchEnded` is not silently failing.** Verified live: a partner joined,
matched and skipped; the browser transited to partner-left in 4 s and E4's summary
card rendered. That run sent **no** messages, so no `session_ended` ack could have
rescued it — `MATCH_DISCONNECTED` was the only thing that could have moved it. The
normal path works.

✅ **The leading candidate cause is fixed.** The join race documented below was
real: `emitMatchFound` emitted `MATCH_FOUND` and *then* attached
`socket.sessionId`, so a skip arriving in that window read `undefined`, skipped the
teardown entirely, and left the partner in a chat that no longer existed. The ids
are now attached before the emit, `ANON_NEXT` additionally falls back to the durable
Redis pointer, and a regression test asserts the interleaving (verified failing
against the old ordering).

⚠️ **Not proven: that this race caused the original observation.** There is no
surviving failing reproduction, so the fix is confirmed correct and the symptom is
confirmed gone, but causation is inferred from the symptom matching. If the miss is
ever seen again, instrument `notifyMatchEnded` — log the target room and how many
sockets `fetchSockets()` finds in it — before assuming this again.

### C — Signed-in users can whisper

**The blocking gap: there is no `userId` anywhere in the anon runtime.**
`socket/anon/auth.ts` never reads `accessToken`; `WaitingCard` and `AnonSession`
have no user field. A signed-in user on `/whisper` holds two sockets with zero
server-side link.

✅ **Shipped.**

| # | Change | Where |
|---|--------|-------|
| 1 | `/anon` auth also reads `accessToken`, attaches optional `socket.userId`. Anonymous stays anonymous — no cookie, a bad cookie, or an unknown user all still yield a working anon session | `socket/anon/auth.ts` |
| 2 | Optional `userId` on `WaitingCard` and `AnonSession` (`userId1`/`userId2`) | `types/match.ts` |
| 3 | `match:user:{userId}` index → active sessionIds, cleaned on session end | `keys.ts`, `session.ts` |
| 4 | **Dual-key blocking** — see below | `block.ts` |
| 5 | A signed-in account can no longer be matched against its own other device | `queue.ts` |

⚠️ **The original plan's step 5 was wrong and was deliberately not done.** It said
"skip the picker for signed-in users — derive the anon identity card from their
account". That is a privacy regression: an anonymous chat must never default the
alias to someone's real account name, because **the other party would then see
it**. The client still picks an alias. `userId` is carried only for blocking,
quota and cross-tab state, and never reaches `WaitingCard.displayName` or
`MATCH_FOUND.partner`.

#### The block fix — and its honest limit

Blocking was `anonId`-scoped, so a report/block **did not survive the user signing
up**: match someone, get reported, block them, sign in, be matched again.

`blockAnonId`'s signature is unchanged — deliberately, because three call sites
(`report.ts`, `admin/report.ts`, `moderation/autoReport.ts`) only ever know
anonIds. Instead it now resolves both accounts from `match:alias:{anonId}` and
writes the block to **every** identity each side has, so all three existing paths
get dual-key blocks for free with no diff. `findBlockedCandidates` reads it back
as the full cross-product — at most 4 `SISMEMBER`s per candidate, still one
pipeline, still one round-trip, so the bounded cost of `tryMatchFromQueue` is
unchanged.

**Limit, stated plainly:** if *neither* side was signed in when the block was
raised, no account id existed and there is nothing to attach it to. That is
inherent to never persisting anon data. What the fix closes is the case above.

⚠️ **`match:alias:{anonId}` is write-only and must never be deleted.** Nothing
reads it back; it exists so `blockAnonId` can find an account. If those keys are
`DEL`'d, blocks silently stop following accounts.

### D — Guest profile panel + visual convergence

Right-hand panel mirroring `ProfilePanel` (`lg:` column / sheet below), so the
app has one spatial grammar: conversation centre, context right.

Alias · vibe tags (same `TagPicker`) · gender (same `GenderPicker`) · live
thread summary · "remember this alias" · persistent **"Create an account to
keep your connections"** CTA.

That CTA is the conversion fix: a guest with a good match currently has no
reason to sign up until the mutual like, which is the highest drop-off moment.

✅ **Shipped.**

| Piece | Where |
|-------|-------|
| Panel (presentational) | `components/AnonProfilePanel.tsx` |
| Data + column/sheet split | `components/AnonProfileHost.tsx` — mirrors `pages/Chat.tsx`'s `useMediaQuery('(min-width: 1024px)')` pattern |
| Identity read/write + persistence | `hooks/useAnonIdentity.ts` |
| Live stats (owns the clock) | `hooks/useThreadStats.ts` |
| Pure stat derivation | `utils/threadStats.ts` |
| `localStorage` access | `utils/anonIdentityStorage.ts` |
| Shell / column / mobile FAB | `.acr-shell`, `.acr-profile`, `.acr-profile-fab` in `anonChatRoom.css` |

Three decisions worth knowing:

- **Edits apply to the *next* match, not this one.** A partner already received
  the alias you matched under; renaming mid-thread would make the header, the
  "you" orb and their view disagree. `sessionAlias` freezes the thread's name at
  `setMatch`, and the panel says so.
- **No server call on edit.** `POST /api/match/join` overwrites the Redis
  identity card wholesale on the next join, so updating the store is sufficient.
- **The CTA sits above the thread summary, not below it.** In a narrow rail it
  lands under the fold and is simply never seen — the panel's whole job is that
  pitch.

**Layout contract.** `--acr-gutter` and `--acr-column` are declared once on
`.acr-shell` and consumed by three separate stylesheets, so the header, the
thread and the composer share one inset and one width and cannot drift apart.

**How `--acr-column` got to 48rem.** Three passes, all measured at 1306px:

| Value | Pane | Slack each side | Verdict |
|---|---|---|---|
| none (fills pane) | 890px | 0 | Too wide — 22rem bubbles sit so far apart it stops reading as one exchange |
| 44rem | 922px | 109px | Read as a misaligned layout. In the main chat that gutter is the chat list; here there is nothing to put there |
| **48rem** | 890px | **61px** | Slack is small enough to read as breathing room, and 768px is close to the logged-in conversation pane's ~700px |

Verified at `lg`: header, thread and composer all resolve to left 61 / right 829.

The header wrapper is `pointer-events: none` with the card re-enabling it, so
the full-width hit area can't swallow clicks meant for the chat.

Panel width is `26rem`. That number is measured, not guessed: the three gender
pills need 329px, and 24rem only left 319px inside the card, so "Other" wrapped
onto a second row. 26rem puts all three on one line.

Verified at `lg` (column) and by forcing the breakpoint to exercise the `< lg`
bottom-sheet path: sheet renders with the `isSheet` treatment (no
`bg-background-alt` card of its own), the mobile FAB sits at 800–840px against a
composer starting at 877px, so it covers neither. The column cap is inert on
mobile — the pane there is ~390px.

✅ **Fixed as part of E2:** `MATCH_FOUND` now carries `createdAt` (the session's
real start) on **both** the new-match and resume paths, and `setMatch` uses it
instead of `Date.now()`. A resumed thread keeps the clock it already had — this
was what blocked both E2's countdown and E4's duration. Verified live: a fresh
match reads "vanishes in 23h 58m" and "1 min together".

### E — Differentiators (free, in value order)

| # | Feature | Cost | Note |
|---|---------|------|------|
| E1 | Vibe reactions on individual messages | 1 Redis set/message | ✅ Shipped. `ANON_REACT` / `MATCH_REACTION`, 6 curated keys, server-side whitelist |
| E2 | 24h thread expiry with visible countdown | TTL exists, invisible now | ✅ Shipped. Needs `createdAt`, now on both `MATCH_FOUND` paths |
| E3 | Icebreaker cards | Cheap | ✅ Shipped. 14 prompts, hidden at 4+ messages so they stop competing |
| E4 | "How it went" end-of-thread card | Nearly free | ✅ Shipped. Replaces the partner-left prompt once there is something to say |
| E5 | Client-side whisper history (localStorage) | **Zero server cost, zero privacy surface** | ✅ Shipped. Capped at 20, device-local, aliases + tags only — never message content |
| E6 | Signed-in daily whisper counter | 1 INCR + 1 EXPIRE | ✅ Shipped server-side (limit 30). Abuse lever now, paywall later |

**E1 reaction rules** — one reaction per person per message; sending the same one
again removes it; sending a different one replaces it. The store deliberately has
**two** setters: `applyReaction` toggles (a local tap can't know the current
state) and `setReaction` writes (the server's `added`/`removed` is authoritative).
Using the toggle for both made the optimistic tap and its own broadcast cancel each
other out — caught in the browser, not by inspection.

**E6 quota** — enforced at the `/anon` handshake, not `POST /api/match/join`,
because that route is guest-safe with no auth middleware and cannot see a
`userId`. One Lua `INCR` with the `EXPIRE` inside the script on first increment
only — a pipeline is not a transaction, and a lost race would leave a counter with
no TTL, i.e. a permanently locked-out account. Rolling window, not midnight: a
synchronised reset dumps every user into the same instant, straight onto the join
scan. Refused attempts count, so "retry until under" can't escape. Guests are
never capped.

⚠️ **Follow-ups found while building E**
- ✅ **Fixed.** `validateSocket.ts`'s built-in failure acks were hardcoded to the
  *message* vocabulary and carried no `code`. `SocketEventOptions` now takes
  optional per-event `rejections` — `rateLimited` / `invalidPayload` /
  `handlerFailed`, each `{ reason, code? }` — defaulting to the old copy so no
  existing caller changed. `ANON_REACT` opts in and now answers with
  `rate_limited` / `invalid_reaction` / `unknown_message` instead of "Too many
  messages" when the caller tapped an emoji. `rate_limited` added to
  `AnonFailureCode` on both sides.
- ✅ **Fixed, and the original note was wrong.** See the limiter section below —
  "N instances = N× the cap" was not true, and building to it would have been
  building the wrong thing.
- **Only `queue.integration.test.ts` may touch `match:queue:global`.** Test files
  share one Redis and run concurrently; the suite already broke once on this.
- `getUserActiveSessions` is an N+1 loop, fine at 1–2 sessions, pipeline it if the
  per-account concurrency cap ever rises.
- `hasMessage` on the reaction path `LRANGE`s and JSON-parses the whole buffer.
  Bounded at 50, not on the hot path, but O(buffer).

#### The socket rate limiter — the old warning was incorrect

`socket/rateLimiter.ts` carried this comment:

> `// NOTE: in-process only — does not coordinate across multiple Node processes`
> `// Replace with a Redis-backed limiter before horizontal scaling.`

**That was not true.** A socket is held by exactly one Node process for its whole
life — Socket.IO only delivers a given socket's packets to its owning instance —
so an in-process `Map` keyed by `socket.id` already enforced the real cap on
every connection it accepted, on any number of instances. Verified rather than
assumed: `engine.io`'s `Server.generateId` is unconditionally
`base64id.generateId()`, and a client-supplied `sid` only *selects* an existing
session, never creates one with an attacker-chosen id. Ids cannot be made to
collide across instances.

What the Redis limiter actually buys is **TTL-based memory reclamation**, which is
the real bug: an in-process entry is freed only when `disconnect` fires, so a
`SIGKILL`, an OOM kill, or a dropped `disconnect` strands one `Map` entry per
socket for the life of the process. `/anon` is the high-churn, trivially
reconnectable namespace, so that is exactly where it leaked.

✅ Shipped: `makeRedisSocketRateLimiter(namespace, maxEvents, windowMs)`, a
sorted-set sliding window in **one Lua script** (three round trips would let two
concurrent events both read a below-cap count and both be admitted). Wired to
`msgLimiter`, `likeLimiter`, `requeueLimiter` and `reactionLimiter`. `typingLimiter`
deliberately stays in-process — its handler already spends a `requireActiveParticipant`
Redis read per event, so a second round trip would spend the scarce resource to
rate-limit the cheapest traffic in the product, and a per-connection `Map` absorbs
the runaway loop completely.

⚠️ **The namespaced argument is load-bearing, not decoration.** One socket carries
four limiters; a shared key means the 20-message allowance launders the 5-like
allowance. There is deliberately no default bucket.

⚠️ **Costs, stated plainly.** One extra `EVAL` round trip per anon message, like,
requeue and reaction — roughly +25% on the Redis round trips of an anon send
locally, and one more TLS round trip on visible latency against Upstash. And it
**fails open**: if Redis is unreachable, `allow()` resolves `true` and logs. That
matches `consumeWhisperQuota`'s existing call for the same reason — a limiter that
fails closed lets anyone who can make Redis unhappy stop messaging entirely. The
trade is that during a Redis outage the anon limiters are no-ops.

⚠️ **Still open, and it is the one that actually matters.** Both limiters reset on
reconnect, so a client that opens a fresh socket per event is unmetered — wide
open today and still wide open after this change. The Redis key already supports
fixing it (key on `anonId` rather than `socketId`); it is a one-line change to
the same factory. It is deliberately not done because it changes what the cap
*means*: a real user reconnecting mid-conversation would burn their budget.

Incidental fix: a synchronous throw inside `before()` used to escape the
`socket.on` callback as an uncaught exception. The body is async now, so it is
caught and acked.

**Note:** vibe-aligned matching is **already live and free** —
`vibePairScore` (`services/match/queue.ts`) scores candidates by shared tags and
`tryMatchFromQueue` sorts best-overlap-first, tie-broken by longest wait. Do not
rebuild it. The paid upsell is *preference* on top of it.

### Rejected outright

- ❌ **Concurrent anonymous chats.** `socket.sessionId` is a single scalar pushed
  to every socket in `anon:{anonId}`; N sessions changes every handler signature.
  `anonStore`'s flat `partnerName/messages/matchedAt` becomes an array.
  `VIBE_UNLOCK` fragments across threads. Users would idle in the easiest one.
- ❌ **Anonymous threads in "All Chats" / "Personal".** `AnonMessage.from` is
  relative (`'me' | 'them'`) and cannot be replayed for both parties. The only
  ways to force it are fabricating placeholder `User` docs (breaks the
  "not stored in MongoDB" privacy promise) or threading `chat.kind: 'anon'`
  through `MessageBubble` (307 lines) and every read/reaction/forward/delete path.
- ❌ **Voice notes in anon.** Moderation is text-only today
  (`services/match/moderation.ts`, 3 categories, no audio). Charging for the
  least-protected surface is the wrong order.
- ❌ **Location matching.** Needs a permission prompt and a location data
  category in a product whose whole pitch is anonymity.

---

## Deferred — Spark Pass (paid). Audit only.

**Do not build any of this until there is revenue.** Adding Stripe requires a
`docs/TECH.md` approval note per `product-and-cost.mdc`.

**There is currently zero billing infrastructure.** `pages/SparkPass.tsx` is 15
lines wrapping a 183-line marketing component with a hardcoded `₹199` whose only
CTA is `<Link to="/auth">`. No `Subscription` model, no `stripe` dependency, no
webhook, no entitlement resolver, no feature flags.

### Sequencing: build the gate, not the payment

Everything in "Gate foundation" below can be built **at $0** with an
admin-grant path for testing. Stripe plugs in later and costs only % of real
payments. Do not build a paywall without a gate behind it.

| Prereq | Task | Notes |
|--------|------|-------|
| Gate foundation | `Subscription` model | PRODUCT.md already sketches the shape: `user, plan, interval, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd` |
| Gate foundation | `useEntitlements()` resolver + server-side `requireEntitlement()` middleware | **Server-side only.** Never gate on the client — the client is not a security boundary |
| Gate foundation | Admin manual grant (set `plan: 'premium'` directly) | Lets us test every paid feature with zero billing |
| Billing | `POST /api/subscription/create` + Stripe Checkout | |
| Billing | `POST /api/subscription/webhook` | The only trustworthy source of entitlement truth |
| Billing | `DELETE /api/subscription/cancel` | |
| Billing | `docs/TECH.md` approval note | Required by `product-and-cost.mdc` before any paid service |

### Feature backlog (each gated on the entitlement resolver existing)

| Feature | Effort | Notes |
|---------|--------|-------|
| Gender preference filter | Medium — needs `match:queue:pref:{gender}` buckets | Promised in PRODUCT.md. Current `tryMatchFromQueue` already reads every card's `gender` but ignores it |
| Vibe preference routing | Medium | Preference *on top of* existing shared-tag scoring — not a rebuild |
| Priority queue | Low | Reorder LPUSH position. Almost free once buckets exist |
| Read receipts in anon chat | Medium | High value, low abuse surface, invisible to free users until they want it. Good first paid feature |
| Daily whisper quota → paywall | **Zero — counter already ships in E6** | Just lift the cap for `plan: 'premium'`. The best first monetisation because the instrumentation is already live |
| "See who liked you" | Low | `match:likes:{sessionId}` already exists; just don't fire `MUTUAL_LIKE` to free users |
| Re-find (server-side) | High | **See below — needs the mutual-opt-in work first** |
| Verified vibes badge | Low | Cosmetic; needs a verification signal that doesn't cost money |
| Extended / no chat timer | Low | Extend the Redis TTL on premium sessions |
| Vibe Boosts (consumable IAP) | Medium | One-time queue priority. Needs an IAP balance model |

### Re-find — do NOT build as originally sketched

The first proposal was "archive ended sessions in Redis, let a paid user spend a
credit to re-queue preferring that person." Two problems:

1. **It contradicts the brand.** PRODUCT.md sells serendipity — *"Serendipitous
   connection that isn't driven by an algorithm."* A "people you talked to
   before" list turns this into a dating app with a worse matcher. Keep it a
   quiet affordance, never a headline tab.
2. **"Good match" is not inferable from behaviour.** Message count and duration
   are volume, not quality — and volume biases against quiet people and
   non-native English speakers. Who pressed skip is asymmetric: one person
   leaving doesn't mean the other had a bad time. **Asking is both cheaper and
   more accurate than any heuristic, and it is the only version that isn't
   surveillance-adjacent.**

If it's ever built, it must be:

- **Redis only, hard 24h TTL, never Mongo.**
- **Mutual and explicit** — only for threads *both* people marked good. Never
  unilateral. This is the anti-stalking rule and it is non-negotiable.
- **Visible and deletable** — show the archive, let the user clear it. An
  invisible archive of who you talked to is a trust violation waiting to happen.

**E5 (client-side local history) is the better free-tier answer** and covers most
of the emotional need at zero server cost and zero privacy surface.

---

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

## Image & video loading fallbacks ✅ (partially done)

**`Image.tsx` avatar shimmer:** done — `animate-pulse bg-border/25` skeleton during load, clean fade-in on `onLoad`, `AVATAR_FALLBACK` on error.

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

## Marketing landing page & legal pages ✅ DONE

Landing page, SparkPass pricing page, and all legal pages shipped in Phase 1. Route `/` shows landing for guests, redirects to chat for authed users. MarketingLayout + LandingFooter with footer links wired. OG meta tags in place.

See `features/landing/` and `pages/legal/` for the full implementation.

---

<!--  ORIGINAL NOTES PRESERVED FOR REFERENCE:
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
-->

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

---
<!-- 
## UI polish — small-screen gaps (found in Sep 2026 audit)

These were identified in a full mobile UI/UX audit against iPhone SE (375×667px) and need to be fixed before Phase 2 launch.

### P0 — Ship these immediately

| Fix | File | Change |
|-----|------|--------|
| `text-[11px]` → `text-[12px]` throughout | `ChatListItem.tsx`, `MessageBubble.tsx`, `SearchResultItem.tsx`, `MessageSearch.tsx` | All 11px text is below Apple's 12px min legible size — replace every instance |

### P1 — Before public launch

| Fix | File | Why |
|-----|------|-----|
| Home empty state redesign | `pages/Home.tsx` | Flat background + `mix-blend-overlay` logo — no glow, no depth, logo may render invisible on dark background. Add radial green glow + change logo blend |
| Profile panel top glow | `features/profile/components/ProfilePanel.tsx` | Interior is flat `bg-background-alt` with no accent — inconsistent with BottomSheet + MessageSearch which both have the `radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)` glow |
| Auth panel mobile inner glow | `index.css` → `.auth-panel` mobile rules | Orbit ring and sheen are desktop-only; add a subtle `box-shadow: inset 0 0 40px rgba(1,195,109,0.06)` on mobile to partially compensate |
| OTP input layout on SE | Auth OTP component | 6 cells × minimum width may overflow 375px — verify and use `max-w-[calc(6*(2.5rem+0.375rem))]` or gap-1.5 |

### P2 — Polish pass

| Fix | Why |
|-----|-----|
| Auth stage mobile redesign | Current state: 200px wide, chips/rings/wave all hidden, reads as "disabled feature". Replace with a simpler badge lockup (wordmark + single slow pulse ring) optimised for 120–160px |
| Context menu overflow on small screens | Long menus can clip off bottom of viewport — add `max-h-[80vh] overflow-y-auto` |
| Attachment menu (+ button) | Desktop-style popover at narrow widths — convert to BottomSheet on mobile |
| ChatListItem `gap-1` → `gap-2` on mobile | 4px horizontal gap between avatar and text is too tight on touch |
| Touch targets audit | Back button 36px, some header icons 32px — bump to 44px minimum per WCAG 2.5.5 |

### P3 — Nice-to-have

- Tablet (768–1024px): 2-column chat list + conversation side-by-side is already wired (`md:` breakpoints) — verify it looks right and doesn't have the "two narrow columns" problem
- Admin routes: no mobile layout — add `AdminWrapper` mobile-aware padding
- Landing page `TranscriptHero` CTA: `absolute bottom-[3%]` has no `env(safe-area-inset-bottom)` compensation — add `pb-[env(safe-area-inset-bottom)]` wrapper -->
