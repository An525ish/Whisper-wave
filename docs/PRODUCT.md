# Whisper Wave — Product Document

> Living document. Update this whenever product direction changes.
> Last updated: Aug 2026
>
> Tech + cost: [`TECH.md`](./TECH.md) — what we build with, why, and how we stay at $0.
> Backend user journey: [`USER_JOURNEY.md`](./USER_JOURNEY.md) — what the user does and what the server does at every step.

---

## Vision

Whisper Wave is an anonymous chat app for Gen Z built around serendipity — you connect with a random stranger, no profile, no algorithm. If you vibe, you connect for real. If you don't, they're gone forever. That tension is the product.

The name works on two levels: "Whisper" = anonymous, ephemeral, secret. "Wave" = reaching out, connection, social energy.

---

## The Core Problem We Solve

Social media today is over-curated and performance-driven. Gen Z is tired of crafting personas. There's a real demand for:
- **Genuine, unfiltered conversation** with no social stakes
- **Serendipitous connection** that isn't driven by an algorithm
- **Low-commitment interaction** with high-reward upside (real connection)

Omegle proved the demand. It failed on safety, UX, and monetization. We build the version that gets all three right.

---

## Target Audience

- **Primary**: 18–25, Gen Z
- **Secondary**: 25–30, elder millennials with same appetite
- What they want: authenticity, spontaneity, privacy, speed, aesthetic
- What they hate: fake profiles, cringe algorithms, commitment before chemistry

---

## User States

| State | Description |
|---|---|
| **Ghost** | On the app, no queue, no login |
| **Wanderer** | In the anonymous matchmaking queue |
| **Whisperer** | Actively chatting anonymously |
| **Spark** | Mutual like detected, deciding to connect or not |
| **Connected** | Account created, persistent relationship with a person |
| **Premium** | Paid tier, unlocked filters and re-find |

---

## Core Anonymous Flow

### 1. Entry (No Login Required)
- Enter a "vibe name" (free text, e.g. "midnight_fox") OR get an auto-generated Gen Z aesthetic name
- Pick 2–3 optional vibe tags: `cozy`, `deep talks`, `gaming`, `chaotic`, `music`, `overthinker`, etc.
- Declare gender (optional — only relevant for receiving premium-user preferences)
- Hit "Find Someone" → join the queue

### 2. Matching
- Real-time queue with animated waiting state
- Server matches two users from the same queue tier (global / interest-aligned / gender-filtered)
- Brief reveal: display names and vibe tags visible, no other info

### 3. Anonymous Chat
- Text chat (voice notes are premium)
- Emoji/vibe reactions (curated Gen Z aesthetic set, not standard emoji keyboard)
- "Like" button visible at all times (heart/spark icon — unobtrusive)
- No read receipts in free tier
- Optional conversation timer: "this chat persists for 24h unless you connect" — creates urgency

### 4. The Decision Moment
- **One person likes**: subtle ambient indicator "someone in this chat is vibing"
- **Mutual like**: `MUTUAL_LIKE` event → "IT'S A VIBE" screen → connect CTA
- **Connect**: triggers account creation (email or social OAuth) → permanent connection
- **Next**: skip to new match → current chat and partner are lost
- **Disconnect**: partner leaves → "They left. Maybe next time 👋"

---

## Post-Connection Features (Account Required)

These are the features the current Whisper Wave codebase already implements, now positioned as the reward for connecting.

- Persistent DM with all your connections
- Connection origin story ("you matched as `midnight_fox` and `blue_static`, 14 days ago")
- Friend requests and group chats (existing feature)
- Group roles: **creator**, **admin**, **member** (see below)
- File and media sharing (existing feature)
- Notification system (existing feature)
- Connection suggestions based on mutual connections

### Group roles

| Action | Creator | Admin | Member |
|---|---|---|---|
| Send / reply / forward | yes | yes | yes |
| Edit own message | yes | yes | yes |
| Delete own message | yes | yes | yes |
| Delete anyone’s message | yes | yes | no |
| Add members | yes | yes | no |
| Remove members | yes (not self) | yes (members only; not creator/admins) | no |
| Promote / demote admin | yes | no | no |
| Edit group name / bio / avatar | yes | yes | no |
| Clear all chat history | yes | no | no |
| Leave group | yes | yes | yes |
| Delete group | yes | no | no |

DMs stay sender-only for edit/delete. Clear-all in DMs remains available to either participant.

---

## Premium — "Spark Pass"

| Feature | Free | Spark Pass |
|---|---|---|
| Random matching | Yes | Yes |
| Gender preference filter | No | Yes |
| Vibe/interest-aligned matching | No | Yes |
| Priority queue (less wait) | No | Yes |
| Anonymous voice notes | No | Yes |
| Read receipts in anon chat | No | Yes |
| "Re-find" past sessions | No | Yes (credits) |
| See who liked you | No | Yes |
| Location-based matching | No | Yes (city level) |
| Extended/no chat timer | No | Yes |
| Verified vibes badge | No | Yes |

### Pricing (proposed)
- Monthly: ₹199 / $4.99
- Annual: ₹1499 / $29.99 (save ~50%)
- Vibe Boosts: one-time queue priority boosts (consumable IAP)
- Re-find Credits: buy credits to attempt reconnect with past anon sessions

---

## Safety (Non-Negotiable)

**$0 now (we build ourselves):**
- Report + block from within any chat
- "Safe exit" button — leaves conversation instantly with no message to partner
- Rate limiting on queue join (prevent abuse/spam bots)
- Anonymous sessions do NOT log IP or PII, and are not stored in MongoDB
- Simple age gate when premium ships (DOB / checkbox — not a paid KYC vendor)

**Paid later (only after Spark Pass brings money in):**
- Automatic text/image moderation (Perspective API / Rekognition)
- No-screenshots advisory at OS level where possible

---

## Technical Architecture

Full stack, cost, and “why this tool” live in [`TECH.md`](./TECH.md).
**Constraint: $0 until we have users.** Mongo stays. Redis is Phase 2 + free tier only. No paid APIs in Phase 1.

### Two Layers

```
Layer 1: Anonymous Layer (new — Phase 2 build)
  - No account required
  - Redis-backed matching queues
  - Ephemeral Socket.IO rooms (/anon namespace)
  - AnonSession, Connection models

Layer 2: Connected Layer (existing Whisper Wave — Phase 1 refactor)
  - Account required
  - Persistent MongoDB storage
  - Authenticated Socket.IO (/ namespace)
  - User, Chat, Message, Request models
```

### Data Flow — Anonymous to Connected

```
[Ghost]
   │
   ├── POST /api/match/join (no auth, gets anonId cookie)
   │
[Wanderer — in Redis queue]
   │
   ├── MATCH_FOUND socket event ─────────────────────────────┐
   │                                                         │
[Whisperer — in anon Socket.IO room]              [Partner Whisperer]
   │
   ├── ANON_LIKE → stored in Redis Set
   │
   ├── If mutual: MUTUAL_LIKE event
   │
[Spark — connect CTA shown]
   │
   ├── ANON_CONNECT → server issues connectToken (JWT, 10 min TTL)
   │
   ├── POST /api/auth/signup (with connectToken in body)
   │
[Connected — account created]
   │
   ├── Connection doc created in MongoDB
   ├── Chat doc auto-created (the DM for this connection)
   └── Regular auth JWT issued, full app access unlocked
```

### New Models (Phase 2)

```ts
// AnonSession — Redis only (no MongoDB, by design)
// Key: match:session:{roomId}
// Value: { user1: anonId, user2: anonId, likes: Set<anonId>, status, createdAt }
// TTL: 24h after last activity

// Connection (MongoDB)
{
  users: [ObjectId, ObjectId],
  chat: ObjectId,                   // auto-created DM chat
  originAnonSession: string,        // roomId from Redis (for "origin story")
  originNames: [string, string],    // the vibe names they used
  originVibeTags: [string[]],
  connectedAt: Date
}

// Subscription (MongoDB)
{
  user: ObjectId,
  plan: 'free' | 'premium',
  interval: 'month' | 'year',
  status: 'active' | 'cancelled' | 'past_due',
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodEnd: Date
}
```

### Redis Key Structure (Phase 2)

```
match:queue:global          → Redis List (FIFO queue, no preference)
match:queue:pref:male       → Redis List (wants male partner — premium only)
match:queue:pref:female     → Redis List (wants female partner — premium only)
match:session:{roomId}      → Redis Hash (session data)
match:likes:{roomId}        → Redis Set (anonIds of who liked)
presence:{userId}           → Redis Hash (socketId, lastSeen)
```

### New API Endpoints (Phase 2)

```
POST   /api/match/join          join queue (anonymous)
DELETE /api/match/leave         leave queue
POST   /api/match/like          like current match
POST   /api/match/next          skip to next match
POST   /api/match/connect       initiate connection (get connectToken)

POST   /api/connection/complete complete connection after signup
GET    /api/connection/:id      get connection details

GET    /api/subscription/plans  available plans
POST   /api/subscription/create create Stripe subscription
POST   /api/subscription/webhook Stripe webhook handler
DELETE /api/subscription/cancel cancel subscription
```

### New Socket Events (Phase 2)

```
// Client → Server (/anon namespace)
ANON_JOIN_QUEUE      { displayName, vibeTags?, genderPref? }
ANON_MESSAGE         { content, sessionId }
ANON_TYPING_START    { sessionId }
ANON_TYPING_STOP     { sessionId }
ANON_LIKE            { sessionId }
ANON_NEXT            { sessionId }

// Server → Client
MATCH_FOUND          { sessionId, partnerName, partnerVibeTags }
MATCH_MESSAGE        { content, sentAt }
MATCH_TYPING_START   {}
MATCH_TYPING_STOP    {}
MATCH_LIKED          {}  (only sent when MUTUAL — not when one-sided)
MUTUAL_LIKE          { sessionId, connectToken }
MATCH_DISCONNECTED   {}
QUEUE_JOINED         {}
```

---

## Build Phases

### Phase 1 — Foundation (Backend Refactor) — NOW — $0
Refactor existing Whisper Wave server to production-grade TypeScript.
This is the connected-layer foundation. All existing features cleaned up.
See: `backend_prod_refactor_bcb4b8d9.plan.md` and [`TECH.md`](./TECH.md).

**Redis is not added.** Presence stays an in-memory `Map` (swappable later). Run locally. Atlas M0 + Cloudinary free only.

### Phase 2 — Anonymous Layer — still $0 if possible
- Redis on **Upstash / Redis Cloud free tier** (queues + ephemeral rooms)
- `/anon` Socket.IO namespace
- AnonSession service (Redis only — not Mongo)
- New models: Connection (Mongo), Subscription schema ready but unused until pay
- New controllers: match, connection
- **No live Stripe yet** unless we ship Spark Pass in the same phase

### Phase 3 — Premium + Safety — first time we may spend
- Stripe (free to integrate; we only pay % of real Spark Pass payments)
- Content moderation APIs (paid — only after revenue)
- Re-find mechanic (Redis TTL'd session archive)
- Gender/vibe preference queue routing

### Phase 4 — Scale + Polish — pay only if load requires it
- BullMQ workers (FFmpeg, Cloudinary off main thread)
- Caching layer (Redis for chat lists, user profiles)
- Analytics (PostHog has a free tier — prefer that over paid)
- Push notifications (FCM — free)
- Admin dashboard for moderation
- Paid hosting only if free hosts can’t hold Socket.IO

---

## Open Questions / Decisions Needed

- [ ] Social login providers (Google only? Apple? Phone number?)
- [ ] Should anonymous messages be saved at all (even ephemerally) for reconnect UX?
- [ ] Timer on anon chats — yes/no? How long?
- [ ] "Re-find" mechanic: how does it work if the other person hasn't opted in?
- [ ] Age verification method for premium
- [ ] Content moderation: automated first or human-reviewed?
- [ ] Mobile app: React Native post-MVP or web-first only?

---

## Non-Goals (for now)
- Video/audio calls in anonymous phase (Phase 3+ only)
- Public group rooms / Whisper Stories
- AI companion
- Desktop app
