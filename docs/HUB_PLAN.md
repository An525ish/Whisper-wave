# Whisper Wave — Hub Plan

> **Status: IN BUILD — Phases 0–1 (hub shell, whisper-in-hub), Phase 2 (laughs),
> and Phase 3a (rooms) are shipped dark behind flags; Games (Phase 4) is
> skipped by decision. Decisions D4/D6/D10/D11 are locked; the rest follow
> recommendations until overridden. Last updated: Oct 2026**
>
> Companions: [`PRODUCT.md`](./PRODUCT.md) · [`TECH.md`](./TECH.md) ·
> [`USER_JOURNEY.md`](./USER_JOURNEY.md) · [`PHASE2.md`](./PHASE2.md) · [`Todo.md`](./Todo.md)
>
> If approved, this document supersedes the "Non-Goals" line *"Public group rooms"* in
> `PRODUCT.md`, and adds Journeys E–H to `USER_JOURNEY.md` (see [§15](#15-docs-to-update-on-approval)).

---

## Contents

1. [TL;DR](#1-tldr)
2. [Product thesis](#2-product-thesis)
3. [Where we are today (audit)](#3-where-we-are-today-audit)
4. [Principles and hard constraints](#4-principles-and-hard-constraints)
5. [Information architecture](#5-information-architecture)
6. [Identity and access: guests and members](#6-identity-and-access-guests-and-members)
7. [Surfaces in detail](#7-surfaces-in-detail)
   - 7.1 Home · 7.2 Whisper · 7.3 Rooms · 7.4 Games · 7.5 Memes · 7.6 Chats · 7.7 Cross-cutting
8. [Technical architecture](#8-technical-architecture)
9. [Safety, moderation and legal](#9-safety-moderation-and-legal)
10. [Cost and capacity](#10-cost-and-capacity)
11. [Analytics and success metrics](#11-analytics-and-success-metrics)
12. [Roadmap](#12-roadmap)
13. [Risks](#13-risks)
14. [Decisions needed](#14-decisions-needed)
15. [Docs to update on approval](#15-docs-to-update-on-approval)
16. [Appendices](#16-appendices)

---

## 1. TL;DR

**What we're building.** Today the app *is* the persistent chat app, with Whisper bolted on at
`/whisper`. We flip it: the app becomes a **hub** — a home page with several ways to meet people —
and the chat app becomes one destination inside it.

```
                    ┌────────────── HUB (everyone: guests + members) ──────────────┐
  places to meet →  │  Whisper     Rooms        Games        Memes                 │
                    │  (one         (many,       (play        (browse,             │
                    │   stranger)    live)        together)    react, share)        │
                    └───────────────────────┬──────────────────────────────────────┘
                                            │  "keep this person" (Connect)
                                            ▼
  people you kept → │  Chats  (members only, persistent, private)                  │
```

**The four decisions that shape everything**

| # | Decision | Recommendation |
|---|---|---|
| 1 | Who can use the hub | **Guests and members both.** Guests get a persona (alias) and can use every *meeting* surface. Chats (persistence) is the account's reward, exactly as today. |
| 2 | Identity everywhere | **Alias-first.** One persona (alias + vibes + color) per person across Whisper, Rooms, Games. Real profile is revealed only on Connect. |
| 3 | Order of build | **Shell → Whisper-in-hub → Memes (cheap, solo) → Rooms → Games → UGC.** Solo content builds the audience; social surfaces need people. |
| 4 | Where state lives (cost) | **Rooms and games are in-process memory on one node** (no Redis per message). Redis stays for matching. Self-host Redis on the VM when we leave the laptop. |

**Biggest risks (detail in [§13](#13-risks))**

1. **Liquidity** — empty rooms and empty queues feel dead and kill the product.
2. **Moderation** — public rooms with guests are the highest-abuse surface we'd ever ship, on a $0 safety budget.
3. **Legal clocks** — India's IT Rules now require removal of sexual/nudity content within **2 hours** of a complaint. Needs a real admin kill-switch and an on-call owner.
4. **Free-tier cliffs** — Upstash free is **500K commands/month** (≈110 whisper sessions/day), not the 10K/day our docs say.
5. **Scope dilution** — five products for a tiny team. Mitigated by phases with exit criteria and kill criteria.

---

## 2. Product thesis

### 2.1 One sentence

> **Whisper Wave is where you meet people — one at a time, in a crowd, over a game, or through a
> meme — and keep the ones you vibe with.**

Everything in the hub is a different *door to a person*. Chats is where the relationship lives
after the door.

| Surface | Door | Intimacy | Commitment | Needs other people live? |
|---|---|---|---|---|
| **Whisper** | One stranger, anonymous | High | Low → high on Connect | Yes (queue) |
| **Rooms** | Many strangers, a topic | Low | Zero | Yes (crowd) |
| **Games** | Play with someone | Medium | Low (a few minutes) | Sometimes (can be solo) |
| **Memes** | Taste, humour | Low | Zero | **No** |
| **Chats** | People you kept | Highest | Account | No |

### 2.2 Why the hub makes the product stronger (not just bigger)

- **Entry without pressure.** Whisper is a high-pressure first action (a stranger types to *you*).
  Memes, a game, or lurking in a room are low-pressure ways to be on the product. More people
  arrive → more people try Whisper.
- **Liquidity.** Every social surface has the same weakness: it only works when enough people are
  there at once. Solo surfaces (memes, daily game) give people a reason to open the app when the
  queue is quiet, which is what *creates* the concurrency. This is the main reason Memes is built
  before Rooms.
- **Conversion.** Connect (guest → account) is today the only funnel. The hub adds natural,
  earlier reasons to make an account: save memes, keep a persona, join rooms as a member, keep a
  game rival.
- **Retention.** Chats are sticky only once you have connections. A hub gives daily habits (a daily
  puzzle, a room at your usual hour, new memes) *before* you have any.

### 2.3 What we must not lose

The original pitch: **serendipity, no algorithm, anonymity, "if you don't vibe they're gone
forever."** The hub inherits these as design rules:

- **No algorithmic feed.** Memes is **Shuffle**, not "For You". Rooms are a short, hand-picked list.
- **Anonymity by default.** Alias everywhere; profile revealed only on Connect.
- **Ephemeral by default.** Rooms and games don't leave transcripts (except what we must keep for
  safety — see §9).
- **Quality over volume.** A handful of good rooms beats fifty empty ones.

### 2.4 What this overturns in existing docs

| Existing doc statement | Status under this plan |
|---|---|
| `PRODUCT.md` Non-Goals: *"Public group rooms / Whisper Stories"* | **Overturned for Rooms** (official, moderated, time-boxed first). *Stories* stays a non-goal. |
| `Todo.md` Rejected: *"Anonymous threads in All Chats"* | **Stays rejected.** Chats remains members-only persistent DMs/groups. |
| `Todo.md` Rejected: *"Concurrent anonymous chats"* | **Stays rejected.** One live whisper at a time. |
| `Todo.md` Rejected: *"Voice notes in anon"*, *"Location matching"* | **Stay rejected.** |
| `PHASE2.md`/`TECH.md`: *Upstash free = 10,000 commands/day* | **Stale.** Vendor page now says 500K commands/month (see §10). |

---

## 3. Where we are today (audit)

Findings from a read-only audit of the client and server (Oct 2026). Details are cited so the
build can start from facts, not memory.

### 3.1 Client

| Area | Fact | Consequence for the hub |
|---|---|---|
| Routes | `/` = landing for guests, chat home for members (`RootIndex`, `app/router.tsx`). `/chat/:chatId` is under `AuthedLayout`. `/whisper` is a standalone full-page route, guest-accessible. | Need a third home that serves **both**; chat moves off `/`. |
| Layout | `layout/AppWrapper.tsx` *is* the chat app shell: list + conversation + profile rail + authed socket events + presence + notifications + whisper resume. It is mounted by pages, not by the router. | Cannot be the parent of other destinations as-is. Split into a neutral hub shell and a Chats layout. |
| Navigation | **No global navigation.** No sidebar, no bottom tab bar. Only landing nav, one "Whisper" item in the chat-list 3-dot menu, and a back arrow. | Build `NavRail` + `BottomTabBar`. |
| Sockets | Members: `SocketProvider` (`/`), mounted separately by `RootIndex` and `AuthedLayout`. Whisper: its own `/anon` socket, no provider. | Define one socket strategy for the hub (§8.3). |
| Session bootstrap | `useProfileQuery` lives in the **chat** feature though it calls the **auth** API. | Move to `auth` (or `app/`). |
| Cross-feature coupling | `AppWrapper` → auth, chat, profile, notifications, whisper; `auth` ↔ `chat`; `chat/header` → `whisper`. | Untangle before adding three more features. |
| Hardcoded paths | ≈25 UI files with `Link`/`navigate` to `/`, `/chat/:id`, `/whisper`, `/auth`; ~30–35 touchpoints. | Introduce a routes module; migrate once. |
| Design system | App tokens in `index.css` `@theme` (green accent, void violet secondary, DM Sans/DM Serif). Landing has its own `lw-*` tokens in `styles/landing.css`. 91 shared UI files (BottomSheet, TabView, DotsMenu, Searchbar, Image, skeletons, EmptyState). | Enough building blocks; no new design language needed. |
| Mobile | `viewport-fit=cover`, safe-area insets used widely, `100dvh`. **No PWA** (no manifest/service worker). | Hub can be a PWA later (installability, push). |
| Analytics | `track()` no-ops without `VITE_ANALYTICS_ENDPOINT`; only `whisper_*` events defined. | Add `HUB_EVENTS`/`ROOM_EVENTS`/etc. per feature. |
| Reusable media | TanStack Virtual (`useChatScroll`, `useThreadVirtualizer`), `InfiniteScrollSentinel`, `ImageViewer`, `RetryableMedia*`, `useGifHooks` (infinite query pattern). | Memes feed and room message list can reuse these. |

### 3.2 Server

| Area | Fact | Consequence |
|---|---|---|
| Namespaces | `/` (JWT required, one DB read on connect) and `/anon` (httpOnly `anonId` cookie required, JWT optional). Default **in-memory adapter** (no Redis adapter). | A `/rooms` namespace is *moderate* effort: the `/anon` dual-identity middleware is reusable. Single node only. |
| Presence | Members: in-process `Map<userId, Set<socketId>>`. Anon: Redis + sweeper timer in one process. | Single-process assumptions everywhere (documented). Fine now; a scale trigger later. |
| Identity | `anonId` cookie: UUID, 24 h, httpOnly. `match:alias:{anonId}` links to a `userId` for block mirroring. Guest "profile" = alias + vibes + gender only; **no persona model, no avatar**. | Need a stable guest identifier longer than 24 h for abuse control (§6.3). |
| Moderation | Word-list text filter (`services/match/moderation.ts`), fails open; auto-report on severe hits; user + anon-session reports; Redis blocks. Admin can delete users/groups/messages, impersonate. **No** ban flag, mute/kick, slow mode, link filter, or room roles. **No image moderation.** | Public rooms and UGC memes need new moderation machinery (§9). |
| Rate limits | HTTP per-IP in-memory; sockets: Redis sliding window per **anonId** (msg 20/10 s, like 5/30 s) and in-process per **socket id** for typing/signed-in. | Reuse the Redis limiter factory for room messages. |
| Models | `User, Chat, Message, ChatRead, Request, Connection, PendingConnection, Report, RefreshToken, PendingSignup, ImpersonationLog`. **No** `Room`, `Game`, `MemePost`, `Notification`. | New models listed in §8.4. |
| Groups | `Chat` groups are **members-only (ObjectId)**, max **100**, no public/discoverable flag. | Cannot be reused for public rooms (no guests, wrong cap, no discovery). New `Room` concept. |
| Media | Presigned R2 PUT, ImageKit delivery, Jimp (avatars only), **no FFmpeg**, **no image moderation**. | UGC memes need a moderation step before they can ship. |
| Memes today | `/api/gif` proxies **KLIPY** `gif` and `meme` (static memes), **auth-only**. | The meme *source* already exists for members; making it guest-readable is a small change (subject to KLIPY terms — §7.5). |
| Redis cost | Anon message ≈ 3 commands; join/match up to ~hundreds in one pipeline (bounded by a 200-candidate window). Docs estimate ~150 commands per 10-message session. | Redis is the scarcest free resource (§10). |
| Whisper ↔ account | `POST /api/connection/complete` (auth), `PendingConnection` (7-day TTL), `Connection` (unique `pairKey`), `WHISPER_CONNECTION_READY`/`CONNECTION_READY` events, `GET /api/connection/:chatId` for the origin strip. **No endpoint to list pending connections.** | Gaps closed in §7.2. |

### 3.3 Gaps between docs and code (carry-overs worth fixing)

- Connected-DM reports do **not** block whisper rematching (only anon-session reports do).
- Already-connected pairs **can** rematch anonymously (the DM is reused on Connect).
- The `connectToken` `jti` is minted but never consumed (replay safety comes from seat-binding).
- A guest who likes mutually and closes the tab **loses the connection** (token is in `sessionStorage`, ~10 min).
- A pending connection has **no UI** outside the whisper room (button label, toast, `MutualBar`).
- Quota (30/day) is enforced but the client never learns the remaining count.

---

## 4. Principles and hard constraints

From `.cursor/rules/product-and-cost.mdc` and the architecture rules, restated as design rules:

1. **$0 until real users or Spark Pass revenue.** No Stripe/Sentry/paid moderation. Redis free tier
   only (or self-hosted); analytics only via our own collector. Any new paid thing needs an entry
   in `product-and-cost.mdc` first.
2. **Stack baseline:** Node 22+, Express 5, Mongoose 9, Socket.IO 4.8+, Zod 4, TS 7 /
   React 19, Vite 8, RR 7, Tailwind 4, TanStack Query 5, Zustand 5. No parallel older stack.
3. **Client:** `pages → features → shared`, shared never imports features, features talk through
   `index.ts`, all HTTP through `shared/lib/api/client`, query keys in `hooks/queryKeys.ts`, ≤350
   lines/file, no dead code, a11y and reduced-motion honoured.
4. **Server:** routes → controllers → services → repositories → models; types in `types/`;
   routes registered only in `routes/index.ts`; sockets call services, not models.
5. **Auth cookies:** access JWT httpOnly cookie; admin uses separate `adminToken`; no token in
   `localStorage`.
6. **Anonymity:** anonymous sessions don't log IP/PII and aren't stored in Mongo.
7. **New in this plan — "Ship dark":** every new surface sits behind a server-driven feature flag
   (`FEATURE_ROOMS`, …) so it can merge to `main` unreleased and be switched off in an incident.

---

## 5. Information architecture

### 5.1 Sitemap

```
/                    Landing (guests) — redirects members to /home
/home                HUB HOME  (guests + members)
  ├─ tab: Now        what's live: Whisper, rooms, games, recent chats
  └─ tab: Memes      shuffle feed (the "scroll" destination)
/whisper             Whisper (anonymous 1:1)            guests + members
/rooms               Rooms lobby                         guests + members
/rooms/:slug         A live room                         guests (alias) + members
/play                Games lobby                         guests + members
/play/:gameId        A game (solo / invite / quick match)
/memes               Full-screen meme feed
/chats               Messages app                        members only
/chats/:chatId       A conversation
/me                  Persona, account, settings          guests (persona) + members (account)
/auth, /spark-pass, /terms, /privacy, /report, /admin/*   unchanged
```

Why `/` stays a landing: it is the marketing/SEO page and the guest's first impression; the
hub is one click away ("Enter") and members skip straight to `/home`.

### 5.2 Navigation

**Desktop (≥1024 px) — left rail (≈72 px, icon + label):**

```
┌────┬──────────────────────────────────────────────────────────────┐
│ ◈  │  (content area — the route's page)                           │
│Home│                                                              │
│ ◌  │                                                              │
│Whis│                                                              │
│ ▦  │                                                              │
│Room│                                                              │
│ ◍  │                                                              │
│Play│                                                              │
│ ☺  │                                                              │
│Meme│                                                              │
│ ✉  │   ← unread badge                                             │
│Chat│                                                              │
│    │                                                              │
│ ● ←│ persona chip (alias) / account                               │
└────┴──────────────────────────────────────────────────────────────┘
```

**Mobile (<1024 px) — bottom tab bar, 5 tabs:**

```
 Home · Rooms · [ Whisper ] · Play · Chats
                  ▲ larger, centre
```

- **Memes** is Home's second tab (and a rail item on desktop). Rationale: five tabs is the
  ergonomic maximum, and Memes is the "lean-back" content that belongs on the home surface.
- The tab bar **hides inside a conversation / a room / a game** (full-screen contexts) and
  returns on back.
- A **live-whisper pill** floats above the tab bar whenever a whisper is in progress and the user
  is elsewhere (§7.2).

### 5.3 Route constants and migration

One module, `shared/constants/routes.ts` (domain-agnostic, so `shared` stays pure):

```ts
export const ROUTES = {
  landing: '/',
  home: '/home',
  whisper: '/whisper',
  rooms: '/rooms',
  room: (slug: string) => `/rooms/${slug}`,
  play: '/play',
  game: (id: string) => `/play/${id}`,
  memes: '/memes',
  chats: '/chats',
  chat: (id: string) => `/chats/${id}`,
  me: '/me',
  auth: '/auth',
} as const;
```

| Old | New | Handling |
|---|---|---|
| `/` (members) | `/home` | Redirect in `RootIndex` |
| `/chat/:id` | `/chats/:id` | Client redirect route (keeps bookmarks, notification deep links) |
| `/whisper` | `/whisper` | Unchanged URL; now rendered inside the hub shell for everyone who has JS |
| Back arrow `navigate('/')` in 5 places | `ROUTES.chats` | Replace with the constants module |
| Server password-reset email (`/auth/reset-password`) | unchanged | 1 server touchpoint, unaffected |

Sizing: ≈30–35 client touchpoints + router table; no server route changes.

---

## 6. Identity and access: guests and members

### 6.1 Three kinds of visitor

| | Visitor | Guest | Member |
|---|---|---|---|
| Has | Nothing | `anonId` cookie, persona (alias + vibes), 18+ attestation | Account (JWT), persona |
| Sees | Landing page only | The whole hub | The whole hub + Chats |
| Stored where | — | Cookie + `localStorage` (persona), Redis (live sessions) | Mongo (account), `localStorage`/server (persona) |
| Becomes next | Guest on "Enter" | Member via Connect or sign-up | — |

A guest is **not** a second-class citizen. A guest can whisper, hang in rooms, play and scroll
memes. What they cannot have is *persistence* (chats, saved things, leaderboard history) and
*powers* (creating rooms, uploading memes, posting links).

### 6.2 Capability matrix

`✓` allowed · `◐` allowed with limits · `✗` not allowed · `—` n/a

| Capability | Guest | Member (new) | Member (trusted) |
|---|---|---|---|
| Open the hub, browse everything | ✓ | ✓ | ✓ |
| **Whisper** (queue, chat, like, skip) | ✓ uncapped* | ◐ 30 / 24 h | ◐ 30 / 24 h |
| Connect from Whisper | ◐ via sign-up | ✓ | ✓ |
| **Rooms**: read a room | ✓ | ✓ | ✓ |
| Rooms: post text | ◐ alias, slow mode, no links | ◐ slow mode, no links | ✓ |
| Rooms: reactions | ✓ | ✓ | ✓ |
| Rooms: create a room | ✗ | ✗ | ✓ (Phase 3b) |
| Rooms: images/files | ✗ | ✗ | ✗ (v1) |
| **Games**: solo / daily | ✓ | ✓ | ✓ |
| Games: play with a whisper partner | ✓ | ✓ | ✓ |
| Games: quick match with a stranger | ✓ | ✓ | ✓ |
| Games: leaderboard history | ◐ local only | ✓ | ✓ |
| **Memes**: browse / shuffle / react | ✓ (local state) | ✓ (synced) | ✓ |
| Memes: save | ◐ local | ✓ | ✓ |
| Memes: share to a Chat | ✗ | ✓ | ✓ |
| Memes: upload (UGC) | ✗ | ✗ | ✓ (Phase 5) |
| **Chats** | ✗ | ✓ | ✓ |
| Report / block | ✓ | ✓ | ✓ |

\* Guests are uncapped today by design ("guests are never capped"); the abuse lever is the
`gid` ban (§6.3), not a quota.

**Trust levels (members only).** `new` → `standard` → `trusted`.
`standard` = account > 24 h and email verified. `trusted` = account > 7 days, no strikes in 30 days,
N positive interactions. Gates: posting links, creating rooms, uploading memes. Stored as
`User.trust` + `User.strikes[]`.

### 6.3 Guest identity: two cookies, two jobs

| Cookie | Lifetime | Purpose | Notes |
|---|---|---|---|
| `anonId` (existing) | 24 h | Identifies one anonymous *session* (queue, match, blocks) | Unchanged. Rotating on purpose. |
| **`gid` (new)** | 30 days | Stable guest id for **abuse control**: room bans, rate-limit continuity, persona restore, trust | httpOnly, random UUID, `sameSite` like `anonId`. A **tracking-class identifier** → must be disclosed in the Cookie policy and used only for safety/continuity. |

Why a second cookie: bans must outlive 24 h or they are meaningless, but we must not make the
*matching* identity persistent (that would weaken "they're gone forever").

Server resolves every request/socket to one shape (new `socket/identity.ts`, extracted from
`socket/anon/auth.ts`):

```ts
type Identity =
  | { kind: 'guest'; gid: string; anonId?: string }
  | { kind: 'member'; userId: string; gid?: string; anonId?: string };
```

### 6.4 Persona

A **persona** = `{ alias, vibeTags[], color }` (avatar is the existing gradient + initial).

- **One persona per person, used on every surface** (Whisper, Rooms, Games). Editing it in `/me`
  or from the Whisper rail edits the same thing.
- Today the alias is stored in `localStorage` (`whisper:identity[:accountId]`). Phase 0 keeps that;
  an optional server copy for members (`User.persona`) can follow so it survives devices.
- **Never derived from the account name or username** (existing rule, kept).
- A room may require a *room-local* nickname to avoid two "NightOwl"s: server appends a short
  disambiguator (`NightOwl·4f`) when a live collision occurs.
- Members may later opt into "Show my profile" in a room (explicit, per room); default off.

### 6.5 Upgrading a guest to a member

Triggers (soft, never blocking an in-progress action):
Connect after a mutual vibe · "save this meme" · "keep this rival" · "I want to create a room" ·
"sync my persona".

What carries over on sign-up:

| Carries over | How |
|---|---|
| Persona (alias/vibes) | Re-saved against the new account on first load |
| A pending connection | Redis **claim** keyed by `anonId` (§7.2.4) |
| Local meme saves/reactions | One-time import on first sign-in (opt-in toast) |
| Game progress | Local history offered as import |
| Bans | `gid` bans stay in force (we remember `gid` against the new `userId`) |

What does **not** carry over: anything from an ended whisper (by design).

---

## 7. Surfaces in detail

### 7.1 Home (`/home`)

Home answers one question: **"What do I want to do right now?"** It is a launcher plus a
"what's live" strip — not a feed.

```
┌─ Desktop /home ───────────────────────────────────────────────────────────┐
│  Good evening, NightOwl  ·  [change persona]                              │
│                                                                           │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  WHISPER                     │  │  LIVE ROOMS             see all  │   │
│  │  Meet one stranger.          │  │  ● Late Night      42 here  [Join]│   │
│  │  [ Find someone ]            │  │  ● Gaming          18 here  [Join]│   │
│  │  27 left today · 1 in queue  │  │  ● Venting         9 here   [Join]│   │
│  └──────────────────────────────┘  └──────────────────────────────────┘   │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  PLAY                        │  │  MEMES                    shuffle│   │
│  │  Daily puzzle · 2 min        │  │  [ meme ][ meme ][ meme ]        │   │
│  │  Would You Rather  [Play]    │  │                                  │   │
│  └──────────────────────────────┘  └──────────────────────────────────┘   │
│  YOUR PEOPLE  (members)   ◉ Aria  ◉ Dev  ◉ Group "Weekend"   → Open Chats │
└───────────────────────────────────────────────────────────────────────────┘
```

**Rules**

- Each card is **owned by its feature** and exported through that feature's `index.ts`
  (`WhisperHubCard`, `RoomsHubCard`, `PlayHubCard`, `MemesHubCard`, `RecentChatsHubCard`). Home
  only composes them. This keeps the one-way dependency rule and lets each surface evolve alone.
- **Honest counts only.** A number is shown only when real and above a threshold (e.g. rooms with
  ≥ 3 people); otherwise the card says "Quiet right now" and offers a solo alternative (a game,
  memes). We do **not** fake activity.
- **Member vs guest variants:** guests see a persona chip and one soft prompt ("Make an account
  to keep what you find"); members see "Your people". No gated-wall interstitials.
- **Memes tab:** Home's second tab is the meme feed (`/memes` is the same view full-screen).
- Home data: a single `GET /api/hub/summary` (optional auth), cached in memory for ~5–10 s so a
  busy home page cannot hammer Redis/Mongo.

`GET /api/hub/summary` shape (all fields optional per flag):

```ts
{
  whisper: { queueSize: number | null; remainingToday: number | null },
  rooms:   Array<{ slug: string; title: string; online: number; open: boolean }>,
  play:    { dailyId: string; dailyDone: boolean }, // dailyDone from client for guests
  memes:   { enabled: boolean },
  chats:   { unread: number },                       // members only
}
```

### 7.2 Whisper in the hub

Whisper is built and has its own detailed docs. This section covers only the **integration**.

#### 7.2.1 Where it lives

- `/whisper` renders **inside the hub shell** for everyone (nav rail / tab bar visible, entry
  screens contained in the content area). The entry screens (picker, radar, mutual-vibe moment)
  keep their dramatic style; the chat room and rails use the chat app's visual language
  (already done in the "align" restyle).
- Inside the shell the room is the middle pane and the **You / Them rail** (already built) is the
  right pane at ≥ lg, a bottom sheet below. No second profile pane exists in the hub shell, so
  the rail is free to be Whisper's.

#### 7.2.2 A whisper survives navigation

Today leaving `/whisper` resets the session (`useWhisperFlow` cleanup). With a nav bar one tap
away that is a trap. Change:

- Lift the socket + store binding into **`WhisperSessionProvider`** (in the whisper feature,
  mounted by the hub shell). The `/anon` socket connects only while status ≠ `idle`.
- Remove the reset-on-unmount; keep explicit **Leave** and **Skip** (with confirm).
- A **live-whisper pill** shows anywhere in the hub: `● Quiet Fox · "haha nice" · 2 new`; tapping
  returns to `/whisper`. States: *searching* (radar dot + elapsed), *live*, *partner left*.
- The 45 s reconnect grace on the server already protects a brief navigation/refresh.

#### 7.2.3 Connect: both sides, every combination

Neither side learns whether the other has an account (`MATCH_FOUND` carries alias + vibes only —
**must stay true**).

| Me | Them | Flow | UI |
|---|---|---|---|
| Member | Member | Each taps **Connect** → `POST /connection/complete`. First call → `waiting_for_partner`; second → DM created. | Modal one-tap, with a "this reveals your profile (name, photo)" line. Pending row until both done. |
| Member | Guest | I complete (pending). They go through `/auth` and complete. | I see a **pending row** (neutral wording: "waiting for them"). DM opens live or on next load. |
| Guest | Member | I sign up/in and complete. They already have a pending row. | `WhisperConnectNotice` on `/auth` (exists). |
| Guest | Guest | Both go through `/auth`; second to finish completes it. | As above. |

Neutral copy: never "they haven't signed up" — always "waiting for them to connect".

#### 7.2.4 The guest who closes the tab (biggest conversion leak)

Today the `connectToken` lives ~10 minutes in `sessionStorage`; if the tab closes, a mutual vibe
is lost. Fix, at $0:

- On `MUTUAL_LIKE`, the server stores a **claim** in Redis: `match:claim:{anonId}` →
  `{ sessionId, seat, originNames, originTags }`, **TTL 7 days** (matches `PendingConnection`).
- After sign-in on the same browser, `GET /api/connection/pending` returns claims for the
  caller's `anonId` cookie **plus** Mongo `PendingConnection` rows where the caller is bound and
  the partner is not.
- `POST /api/connection/complete` accepts `{ claimId }` as an alternative to `{ connectToken }`;
  the server mints the seat-bound token itself. The `anonId` cookie is as strong a proof of seat
  as the token (same browser that was in the session).
- Claim is deleted on completion or expiry. Cost: one SET per mutual like.

#### 7.2.5 Pending connections surface

- `GET /api/connection/pending` → `[{ id, origin: { partnerAlias, tags }, expiresAt, state }]`.
- **Chats list** shows a muted "ghost" row per pending item: `Quiet Fox · waiting · 6d left`,
  tap → a small sheet: what's happening, expiry, **Cancel**. When the partner completes, the
  existing `REFETCH_CHATS` turns it into a real chat.
- **Home** shows a one-line "1 connection waiting" under *Your people*.
- Server: `DELETE /api/connection/pending/:id` to cancel (frees the seat; partner's pending is
  just left to expire — they get no signal).

#### 7.2.6 Chats that started on Whisper

- `GET /api/chat/get-my-chats` adds `origin: 'whisper' | null` (a batched `Connection` lookup by
  `chat` id) → a small glyph on the row and a **New** tag until first open. The existing
  `ConnectionOriginStrip` keeps telling "how we met".
- If the member was offline at completion: no push at $0; the chat appears with **New** on next
  load. (FCM push is a Phase 6 item.)

#### 7.2.7 Quota

`GET /api/match/quota` (member) → `{ limit: 30, remaining }` so the Whisper card can say
"27 left today" instead of the current static "30/day" copy.

#### 7.2.8 Hardening (found in the audit)

| Item | Change |
|---|---|
| Connected-DM report doesn't block whisper rematch | On a `user` report, also write the Redis block for both identities (`blockAnonId`/by `userId`). |
| Already-connected pairs rematch | At pairing, when both sides have a `userId`, skip the candidate if a `Connection` exists (single indexed `pairKey` lookup; cache the partner-id set per user for the queue scan window). |
| `jti` never consumed | Deliberately not consumed: seat-binding already rejects cross-account replays (403), same-user replays are idempotent-success, and single-use tokens would turn double-submits and crash-retries into 409s. First-use theft is unaffected by `jti` either way — that protection is the short TTL plus `sessionStorage`. |

### 7.3 Rooms

#### 7.3.1 Product

A **room** is a live, public, topic-based group chat where strangers talk. It is *not* a Chat
group (those are private and members-only).

**Principles**

1. **Few, good rooms** — start with ~6–8 *official* rooms we curate and moderate.
2. **Small crowds.** A room of 300 is a stream, not a conversation. Each room template is served as
   **instances** capped at **60 (soft) / 100 (hard)**; when full, new joiners are placed in
   `#2`, `#3`, …
3. **Concentrate people in time.** Optional **room hours** (e.g. *Late Night* open 10 pm–2 am IST).
   A closed room shows "opens at 10 pm" and a reminder — this turns the empty-room problem into
   an event.
4. **Ephemeral.** No transcript is kept after the room empties. Evidence is kept only when someone
   reports (§9).
5. **Alias-first**, 18+ attested.

**Starter set (placeholder names, final list is a product call)**

| Room | Vibe | Hours |
|---|---|---|
| Late Night | Insomniacs, deep talks | 10 pm–3 am |
| Venting | Listening room (strict rules) | always |
| Gaming | LFG + banter | always |
| Music | What are you listening to | always |
| Anime & Movies | Fandom | always |
| Hinglish Chill | Casual Hindi/English | always |
| Game Night | Hosted trivia/party games (§7.4) | scheduled |

#### 7.3.2 Screens

**Lobby (`/rooms`)**

```
Live rooms
┌──────────────────────────────────────────────┐
│ ● Late Night            42 here   ▸ [Join]    │
│   insomniacs, deep talks                      │
├──────────────────────────────────────────────┤
│ ● Gaming                18 here   ▸ [Join]    │
├──────────────────────────────────────────────┤
│ ◌ Game Night   opens 9 pm · [Remind me]       │
└──────────────────────────────────────────────┘
```

**Room (`/rooms/:slug`)**

```
┌─ Late Night · #1 ──── 42 here ── ⓘ rules ── ⋯ ─┐
│  (pinned) Be kind. No links. 18+.               │
│  Aria:  anyone else awake?                      │
│  NightOwl:  always 😅                           │
│  ·· Wave bot: Prompt — what's keeping you up?   │
│  …                                              │
├─────────────────────────────────────────────────┤
│  [😀]  Say something…                  [ Send ] │  ← slow mode 3s
└─────────────────────────────────────────────────┘
```

- Message row: color-coded alias, text, 3–4 curated reactions, long-press/⋯ → Reply, React,
  **Report**, (mods) Delete/Mute.
- **Wave bot**: a clearly labelled system user that posts a prompt every N minutes in quiet rooms,
  announces joins in small rooms ("3 people here"), and runs scheduled games. It is honest about
  being a bot and never pretends to be a person.
- Mobile: full-screen, tab bar hidden, header shows room + count; swipe-back returns to lobby.

#### 7.3.3 Roles and moderation

| Role | Who | Powers |
|---|---|---|
| Member of room | Anyone joined | Send, react, report |
| **Mod** | Wave Team (official rooms); trusted volunteers (later) | Delete message, mute N min, kick, slow-mode, lock room |
| **Host** | Creator of a user room (later) | Mod + ban list + room rules |
| **Admin** | Us | Everything, plus global `gid`/`userId` ban, close room |

**Automod (all rooms, $0, in-process):**
- Reuse `inspectMessage` word list (sexual, solicitation, violence) — `severe` hits block + auto-report.
- **Links blocked** for guests and `new` members; allow-list later.
- Duplicate-message suppression, flood/caps/emoji-spam detection, mention-spam cap.
- **Slow mode**: default 3 s (guest) / 2 s (member); per-room override.
- **Auto-hide**: a message with ≥ 3 distinct reporters is hidden for everyone but mods pending
  review (never auto-deleted).
- **Ban evasion**: bans key on `gid` *and* `userId`.

#### 7.3.4 Technical design

**Socket namespace `/rooms`** — identity via the shared middleware (§6.3); `gid` required, JWT
optional. Namespaces multiplex over one connection per tab.

| Direction | Event | Payload (Zod-validated) | Notes |
|---|---|---|---|
| C→S | `ROOM_JOIN` | `{ slug }` | Server picks the instance; replies `ROOM_STATE`. |
| C→S | `ROOM_LEAVE` | `{}` | |
| C→S | `ROOM_MESSAGE` | `{ id, text, replyTo? }` | **Acked.** Rate limit + automod + slow mode. |
| C→S | `ROOM_REACT` | `{ messageId, reaction }` | Curated set. |
| C→S | `ROOM_MOD` | `{ action, target, minutes? }` | Mods only. |
| S→C | `ROOM_STATE` | `{ roomId, instance, recent[], online, rules, you }` | On join. |
| S→C | `ROOM_MESSAGE` | `{ id, from: { alias, color, role }, text, ts, replyTo? }` | Fan-out. |
| S→C | `ROOM_REACTION` | `{ messageId, reaction, count }` | |
| S→C | `ROOM_PRESENCE` | `{ online }` | Throttled (≤ 1 per 5 s). |
| S→C | `ROOM_MOD_ACTION` | `{ action, target? }` | Mute/kick/delete/lock notices. |
| S→C | `ROOM_CLOSED` | `{ reason }` | Hours ended / admin close. |
| S→C | `ROOM_ERROR` | `{ code }` | `rate_limited`, `muted`, `banned`, `blocked_link`, `slow_mode`, … |

**State is in-process, not Redis.**

- A `RoomRegistry` holds instances: `{ id, templateSlug, members: Map<identityKey, Member>,
  ring: Message[] (last 100), settings, bans }`.
- **Redis cost per room message = 0.** The only Redis use is the existing Lua socket rate limiter
  (1 command per message) — and even that can be an in-process limiter for rooms, since a room
  message is rate-limited per socket and we already treat `gid` bans as authoritative. Decision:
  start with **in-process per-`gid` limiter** to protect the 500K Redis budget (§10).
- Cost trade-off, stated plainly: a server restart **drops every room's recent history** and
  disconnects everyone (clients auto-rejoin; ring buffers start empty). Acceptable for ephemeral
  rooms; announced in the room after a restart ("we restarted, history reset").
- **Single-node assumption** is explicit. When a second node is needed, add the Redis Socket.IO
  adapter and move the registry's shared parts (instance directory, bans) to Redis. Documented as
  a scale trigger (§10), not built now.

**Mongo (small, durable):** `Room` (templates/settings), `RoomBan` (`gid|userId`, `roomSlug|null`,
`until`, `reason`, `by`), and `Report` extended with `targetType: 'roomMessage'` + a **context
snapshot** (reported message + the 30 messages around it, alias + ts only).

**HTTP:**

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/rooms` | optional | Lobby list (templates + live instance counts + open/closed). |
| `GET /api/rooms/:slug` | optional | Room info + rules (for the pre-join sheet). |
| `POST /api/rooms/:slug/report` | optional | Report a message (also available as a socket ack). |
| Admin: `GET/POST /api/admin/rooms…` | admin | Create/edit templates, close instance, list bans, ban/unban. |

**Client — new feature slice `features/rooms/`:** `api/`, `components/` (Lobby, RoomView,
MessageRow, Composer, RulesSheet, ModMenu), `hooks/` (`useRoomsSocket`, `useRoomMessages`,
`useRoomsQueries`, `queryKeys.ts`), `stores/roomStore.ts`, `types.ts`, `index.ts`
(exports `RoomsHubCard`, route elements). Virtualized message list reuses the
`useThreadVirtualizer` pattern.

#### 7.3.5 What we're deliberately not doing in v1

Images/files/voice in rooms · user-created rooms (Phase 3b) · DMs from a room (use Whisper's
Connect-style flow later) · threads · message edit · persistent history · @-mention notifications.

### 7.4 Games

#### 7.4.1 Product

Games are a **lower-pressure way to meet people** and a daily habit. Three modes, in build order:

| Mode | What | Where it appears | Moderation risk |
|---|---|---|---|
| **A. In-Whisper** | A 🎮 button in the whisper composer opens a mini-game with your partner. | Whisper room | Very low (structured moves, no free text) |
| **B. Solo / Daily** | One daily puzzle + a few single-player games. | Home, `/play` | None |
| **C. Quick match** | "Play with a stranger" — a queue per game, no chat, only quick reactions. After the game: "Chat with them?" → mutual → whisper-style Connect. | `/play` | Low (no text) |
| **D. Room game night** | Wave bot hosts trivia/party games in a room on a schedule. | Rooms | Medium (room chat) |

**Starter catalog** (author content ourselves; no UGC prompts in v1)

| Game | Players | Mode | Notes |
|---|---|---|---|
| Would You Rather | 2 | A, C | Both answer, then reveal + overlap score — the best icebreaker |
| Two Truths & a Lie | 2 | A | Turn-based, partner guesses |
| Tic-Tac-Toe | 2 | A, C | Smallest possible engine test |
| Connect 4 | 2 | A, C | Same engine, bigger board |
| Word Chain | 2 | A | Server validates against a word list |
| Trivia Blitz | 3–60 | D | Wave bot host, timed |
| Daily Puzzle | 1 | B | Client-side, date-seeded; optional leaderboard |

**In-Whisper flow**

```
you:  tap 🎮 → pick "Would You Rather"
them: sees an invite card in the thread:  [ Accept ]  [ Not now ]
both: a panel slides over the thread (overlay on mobile, rail card on desktop)
end:  result card in the thread ("You both said B — 4/5 in common"); typed messages continue
```

- Game cards and results are **system messages** — they do **not** count toward the vibe-gate
  (`VIBE_UNLOCK`). Only typed text counts, so games can't be used to rush the like button.
- Declining is silent for the inviter beyond "Not now" (no pressure).

#### 7.4.2 Engine (in-house, server-authoritative)

Chosen over `boardgame.io` (last release Nov 2022, inactive) and Colyseus (a second server
framework we don't need). A game is a **pure reducer** — trivially unit-testable.

```ts
interface GameModule<S, A, V> {
  id: string;
  seats: { min: number; max: number };
  init(ctx: { seed: number; players: PlayerRef[]; config?: unknown }): S;
  reduce(state: S, action: A, ctx: { seat: number; now: number }): S | Rejected;
  view(state: S, seat: number): V;        // what THIS player may see (hides the other's secret)
  isOver(state: S): { over: boolean; winners?: number[] };
  schema: { action: ZodType<A> };         // validated at the socket boundary
}
```

- **Authoritative:** clients send *actions*, never state. `view()` prevents leaking hidden
  information (e.g. the other player's pending answer).
- **State in process memory** keyed by `gameId`, with a **TTL sweep** (idle 15 min). Redis is
  used **only** for the quick-match queue (reusing the whisper queue pattern). Rationale: games
  are short and low-value to persist; Redis commands are our scarcest resource (§10).
- **Reconnect:** the server re-sends `GAME_STATE` (the `view`) on reattach; if the process
  restarted, the game ends with "server restarted — rematch?".
- **Events** (new, on `/anon` for Mode A and a `/play` namespace for B–D):
  `GAME_INVITE`, `GAME_ACCEPT`, `GAME_DECLINE`, `GAME_ACTION` (acked), `GAME_STATE`,
  `GAME_OVER`, `GAME_REACT` (quick reaction set), `GAME_ERROR`.
- **Rate limits:** per-action limiter; max 1 open invite per pair.
- **Durable data (Mongo, small):** `GameResult { game, players[{ userId|null }], winnerSeat, at }`
  written **only when at least one player is a member**, TTL 90 days; weekly counters for
  leaderboards. Guests' history stays local.

**Client — `features/games/`:** `games/<id>/` view components each exporting `{ id, title, View }`,
a registry, `GameHost` (modal/panel shell), `useGameSocket`, `gameStore`. Whisper imports only
`GameLauncher` and `GamePanel` from the games feature's `index.ts`.

#### 7.4.3 Not in v1

Real-time/action games · drawing games (heavy, text-adjacent moderation) · wagering of any kind ·
UGC question packs · voice.

### 7.5 Memes

#### 7.5.1 Product

A **shuffle** feed — lean-back, solo, zero-concurrency value. It exists to give people a reason to
open the app when no one else is online, and to feed people into Whisper/Rooms/Games from the same
screen ("Bored? → Find someone" card every N items).

- **Shuffle, not "For You".** No personalised ranking. Controls: **Shuffle** (new random batch),
  **Category chips** mapped to vibe tags (music, gaming, anime, relatable, …), **Trending** (the
  provider's own trending, labelled as such).
- Card: media, title, actions — **react** (🔥 💀 😭 …), **save**, **share** (members → a Chat;
  everyone → copy link), **report**.
- Vertical scroll, virtualized, lazy media, one video/GIF playing at a time, `prefers-reduced-motion`
  respected, data-saver-aware (smaller renditions).

```
┌─ Memes ── [Shuffle] [music] [gaming] [relatable] ─┐
│  ┌───────────────────────────────────────────┐    │
│  │             (meme image)                  │    │
│  │                                           │    │
│  └───────────────────────────────────────────┘    │
│  title                       🔥 💀 😭   ♡ save  ⋯ │
│  ── every ~12 cards ──                           │
│  ┌─ Feel like talking?  [ Find someone → ] ──┐    │
└───────────────────────────────────────────────────┘
```

#### 7.5.2 Source strategy (the legally and financially safe order)

| Option | Cost | Risk | Verdict |
|---|---|---|---|
| **A. KLIPY memes** (already proxied in `controllers/gif.ts`: `static-memes`) | $0; **provider-hosted media → no ImageKit bandwidth** | Needs a **production key** (test key is 100 calls/h) and attribution; terms must be read for a *feed* (not just chat picking) | **Phase 2 (v1).** Gate G-M1 below. |
| **B. Curated by us** (admin-uploaded originals/licensed) | Low volume; R2 + ImageKit | We must hold rights | **Phase 5a** — "Wave originals" for brand and a safe baseline |
| **C. User-uploaded (UGC)** | Moderation + storage + bandwidth | Highest: CSAM/NSFW/copyright, India 2-hour takedowns | **Phase 5b**, trusted members only, pre-moderated |
| **D. Reddit-derived** | — | Free API is **non-commercial**; monetised apps need a contract; scraping proxies are fragile | **Rejected** |
| **E. Tenor** | — | API **shut down June 30, 2026** | **Rejected** |
| **F. GIPHY** | Free beta 100 calls/h; production needs application + pricing | Attribution required | Possible fallback, not primary |
| **G. Imgflip templates** | Free `get_memes` (~100 templates) | Terms/redistribution rights unclear | Only as *template ideas*, not hotlinked content |

**Gate G-M1: CLEARED Oct 2026.** Source locked to JokeAPI v2 — no key to apply
for, terms read (no token/registration/payment; 120 req/min; MIT-licensed
project; no stated attribution requirement), guests servable, cacheable.
Consequences accepted: text jokes (not image memes), finite pool (~1.4k —
repeats expected, mitigated by ID-range rotation), `safe-mode` is best-effort
so report/hide stays. Server proxies with `safe-mode` + full blacklist
(`nsfw,religious,political,racist,sexist,explicit`), Misc/Programming/Pun
only, explicit `User-Agent` (Cloudflare 403s headerless clients).

#### 7.5.3 Technical design (v1 = no storage)

- **Server:** `GET /api/memes?cat=&cursor=` → thin proxy over the existing KLIPY code, now
  `optionalAuth` + IP rate limit + a short in-memory cache (30–60 s per `cat`/`cursor`) so many
  guests don't each burn KLIPY quota. Returns `{ items: [{ id, title, url, previewUrl, w, h }],
  nextCursor }`. Refactor `controllers/gif.ts` → `services/memes/klipy.ts` so GIFs-in-chat and the
  feed share one adapter. **Provider key stays server-side.**
- **State:** v1 stores nothing server-side. Reactions/saves: guests in `localStorage`; members
  `MemeSave { user, source: 'klipy', externalId, savedAt }` (tiny) so saves sync.
- **Client — `features/memes/`:** `MemeFeed` (virtualized), `MemeCard`, `useMemesInfinite`
  (TanStack `useInfiniteQuery`, pattern copied from `useGifHooks`), `memeStore` (local
  reactions/saves), `MemesHubCard`. Media renders through `RetryableMedia`.
- **Safety even for third-party content:** hide a meme locally on report; server keeps a
  `memeBlocklist` (external ids) that the proxy filters out; Admin can add ids.
- **Bandwidth:** third-party media doesn't touch our 20 GB ImageKit allowance.

#### 7.5.4 UGC pipeline (Phase 5b — design now so v1 doesn't paint us into a corner)

```
upload (presigned R2, trusted member)
  → server: size/mime/dimension checks
  → Jimp: strip EXIF, resize ≤1080px, WebP + 480px thumb  → R2 (prefix ww/memes/)
  → classifier (nsfwjs small model, in-process, off the request path via a tiny in-memory job queue)
  → status: pending → (auto-pass at low risk score) approved | held for human review | rejected
  → feed shows only `approved`
  → report ≥ 2 → auto-hold; admin kill-switch removes in one click
```

- **Delivery:** serve approved memes from R2 through a **custom domain** (R2 egress is free; the
  `r2.dev` URL is not for production and is rate-limited) rather than ImageKit, to keep
  bandwidth off the 20 GB cap. This needs a domain on a Cloudflare zone (a real-world $ cost;
  see D11).
- **Honest limits:** open NSFW classifiers are ~90–93 % accurate and miss hard cases; they reduce
  load, they do not replace report + review. First N posts per member are always human-reviewed.
- **Copyright:** ToS grants us a licence; DMCA-style takedown path; repeat-infringer strikes.

### 7.6 Chats (the existing app, relocated)

- Moves to `/chats` and `/chats/:chatId` under a **ChatsLayout** (the current `AppWrapper` minus the
  hub concerns): list · conversation · profile rail.
- On mobile the bottom tab bar is hidden **inside a conversation** only.
- Guests see an **empty state** at `/chats`: "People you keep live here. Find someone →
  [Whisper]" — never a hard redirect to `/auth`.
- Adds: pending-connection ghost rows, whisper-origin marker, "New" tag (§7.2).
- The 3-dot "Whisper" menu item is removed (replaced by nav).
- `AppWrapper` is split: **HubShell** keeps app-wide, section-independent concerns (auth bootstrap,
  authed socket, presence, notifications, whisper provider, nav); **ChatsLayout** keeps
  list/conversation/rail composition. Socket handlers move into a hook (`useAppSocketEvents`).

### 7.7 Cross-cutting

**Notifications.** Today: a friend-request/message store + `Title` unread count; no collection.
Plan: one **in-app notification center** fed by existing socket events, extended with
`whisper_connected`, `whisper_pending_expiring`, `room_invite` (later), `game_invite` (in-session
only). A durable `Notification` collection is only needed if we want offline delivery; defer until
FCM push (Phase 6).

**Presence.** Members: existing in-process presence. Guests: not tracked beyond their current
socket. Room counts come from the room registry, whisper queue size from Redis `LLEN` cached ~10 s.

**Search.** Out of scope now. (Chats search exists; global search is a later problem.)

**Persona editor (`/me`).** Alias, vibes, color; for members also account (name, avatar, bio —
the existing profile panel). One place instead of three.

**Accessibility & motion.** All new surfaces: semantic roles (tablist for nav, log for room
messages), keyboard operable, visible focus, `prefers-reduced-motion`, `aria-live` politeness for
room messages (announce only mentions to avoid noise).

**Internationalisation.** English UI now; room templates support a `lang` tag (Hinglish room is
the first multilingual use). Strings stay in code until we have a second language.

---

## 8. Technical architecture

### 8.1 Client structure

```
src/
  app/            router (uses ROUTES), providers
  layout/
    HubShell.tsx          NEW  nav + outlet + global overlays (whisper pill, toasts)
    ChatsLayout.tsx       NEW  (from AppWrapper) list | conversation | rail
    AdminWrapper.tsx
  pages/          thin entries: Home, Whisper, Rooms, Room, Play, Game, Memes, Chats, Chat, Me, …
  features/
    hub/          NEW  hooks/useHubSummary, components/HubHome, index.ts (exports HubHome only)
    whisper/      + WhisperSessionProvider, WhisperHubCard, LiveWhisperPill, pending UI
    rooms/        NEW
    games/        NEW
    memes/        NEW
    chat/         (trimmed; imports from auth, not the other way round)
    auth/         + useProfileQuery (moved from chat), session bootstrap
    profile/ notifications/ landing/ admin/
  shared/
    components/nav/       NEW  NavRail, BottomTabBar (props-driven, domain-agnostic)
    constants/routes.ts   NEW
    …
```

- `HubShell` wires nav items from a small config in `layout/` (each feature exports its nav
  metadata through its `index.ts`).
- **Feature slots:** `features/hub` imports *only* the public `HubCard` of each feature.
- **Providers by need:** `SocketProvider` (members, `/`) mounts in `HubShell` for members only;
  `WhisperSessionProvider` mounts when status ≠ idle; `/rooms` and `/play` sockets connect lazily
  on entering those routes. By default `socket.io-client` reuses one cached Manager (one
  transport) per origin, so server *connection* count should grow by one per tab regardless of
  how many surfaces are open. **Verify during Phase 0:** the whisper socket today passes its own
  options (`transports: ['websocket']`, `autoConnect: false`, custom reconnection), and a cached
  Manager ignores per-namespace manager options — if that bites, create the namespaces from one
  shared `Manager` built in `shared/lib/socket`.
- **Data fetching:** TanStack Query for lists (`rooms`, `hub summary`, `memes`); Zustand for live
  state (`roomStore`, `gameStore`, `anonStore`).
- **Query keys:** each new feature gets `hooks/queryKeys.ts`; Home invalidates through owners'
  exports.
- **Lazy loading:** every new feature's route is `lazy()`; the games registry loads each game's
  view on demand; the meme feed code is its own chunk. The hub home stays light.

### 8.2 Server structure

```
server/src/
  socket/
    identity.ts           NEW  resolve {gid, anonId?, userId?} (extracted from anon/auth.ts)
    rooms/ (auth.ts, handlers.ts, index.ts)    NEW  '/rooms'
    play/  (handlers.ts)                        NEW  '/play'  (quick match + game night)
    anon/  + game events (Mode A)
  services/
    rooms/  (registry.ts, automod.ts, bans.ts, hours.ts, reports.ts)
    games/  (engine.ts, registry.ts, modules/<game>.ts, queue.ts, results.ts)
    memes/  (klipy.ts, blocklist.ts, feed.ts)           (+ ugc/ later)
    hub/    (summary.ts)
    connection.ts   + pending list/cancel/claim
  repositories/  room.ts, roomBan.ts, memeSave.ts, gameResult.ts, (notification.ts later)
  models/        room.ts, roomBan.ts, memeSave.ts, gameResult.ts
  routes/        rooms.ts, memes.ts, games.ts, hub.ts  (+ registerRoutes lines)
  validators/    rooms.ts, games.ts, memes.ts
  types/         room.ts, game.ts, meme.ts, identity.ts
  constants/     room-events.ts, game-events.ts
```

All follow the existing layering (controllers HTTP-only, services via repositories, sockets call
services, Zod at the edge, types in `types/`).

### 8.3 Realtime strategy (summary)

| Namespace | Auth | Used by | State |
|---|---|---|---|
| `/` | JWT required | Chats, presence, notifications, `WHISPER_CONNECTION_READY` | in-process presence |
| `/anon` | `anonId` + optional JWT | Whisper (+ Mode A games) | Redis (match), memory (games) |
| `/rooms` (new) | `gid` + optional JWT | Rooms | in-memory registry |
| `/play` (new) | `gid`/`anonId` + optional JWT | Quick match, game-night | Redis queue, memory (games) |

Only the `/anon` queue and match state use Redis. Everything new is in-process until the
single-node assumption breaks (§10 triggers).

### 8.4 Data model additions

| Model/key | Fields | Store | TTL / size |
|---|---|---|---|
| `Room` | `slug, title, description, rules, lang, official, hours{days,start,end,tz}, cap, createdBy?, visibility, createdAt` | Mongo | tiny |
| `RoomBan` | `roomSlug|null, gid?, userId?, until, reason, by, createdAt` | Mongo | TTL on `until` |
| `Report` (extended) | `targetType += 'roomMessage' \| 'meme'`, `evidence: { items[{ alias, text, ts }] }`, `identity: { gid?, userId? }` | Mongo | retained per policy (§9.4) |
| `User` (extended) | `trust`, `strikes[]`, `persona?` | Mongo | — |
| `MemeSave` | `user, source, externalId, savedAt` | Mongo | tiny; unique `{user, source, externalId}` |
| `GameResult` | `game, players[{userId|null}], winnerSeat, at` | Mongo | TTL 90 d; only if a member played |
| `match:claim:{anonId}` | `{sessionId, seat, originNames, originTags}` | Redis | 7 d |
| `play:queue:{game}` | list of `anonId` | Redis | purged on boot |
| (memory) room instances, game states | — | process | swept |

### 8.5 API surface (new/changed)

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/hub/summary` | optional | Home card data (cached 5–10 s) |
| `GET /api/rooms`, `GET /api/rooms/:slug` | optional | Lobby + room info |
| `POST /api/rooms/:slug/report` | optional | Report a room message |
| `GET /api/memes` | optional | Feed (proxy + cache) |
| `POST/DELETE /api/memes/save` | member | Save/unsave |
| `GET /api/connection/pending` | member | Pending + claims |
| `DELETE /api/connection/pending/:id` | member | Cancel |
| `POST /api/connection/complete` | member | + `{ claimId }` variant |
| `GET /api/match/quota` | member | Remaining whispers |
| `GET /api/games/daily` | optional | Today's daily seed/metadata (optional; can be client-only) |
| `GET /api/games/leaderboard/:game` | member | Weekly leaderboard (Phase 4b) |
| Admin: rooms, bans, memes blocklist, reports (extended), kill-switch | admin | See §9.5 |

### 8.6 Environment and flags

New server env (validated in `config/env.ts`): `FEATURE_ROOMS`, `FEATURE_GAMES`, `FEATURE_MEMES`
(booleans), `KLIPY_API_KEY` (exists), `GID_COOKIE_TTL_DAYS=30`, room tuning (`ROOM_CAP_SOFT/HARD`,
`ROOM_MSG_RING`, `ROOM_SLOW_MODE_GUEST_MS`). The flags are returned by `GET /api/hub/summary`
(`features` object) so the client hides nav items for disabled surfaces. No `VITE_*` additions.

### 8.7 Testing strategy

| Layer | What |
|---|---|
| Unit | Game reducers (pure), automod rules, room instance placement, hours logic, persona validators |
| Integration (existing harness, `REDIS_KEY_PREFIX`) | claim create/redeem/expiry; pending list/cancel; quota endpoint; `/rooms` namespace join/message/mod/ban with real sockets; `/play` queue pairing |
| Contract | Zod schemas for every new event/route; the event-name constants mirrored client↔server (existing pattern) |
| Load (scripted, local) | 300 sockets in one room, 5 msg/s; verifies fan-out cost and memory; 100 concurrent quick-match joins |
| Manual / E2E checklist | Guest and member through each surface; mobile viewports; reconnect after server restart; reduced-motion |

---

## 9. Safety, moderation and legal

Public rooms and UGC are where this product can hurt people (and us). Safety is a **phase gate**,
not a polish item: a surface does not leave "dark" until its section below is done.

### 9.1 Threat model by surface

| Threat | Whisper | Rooms | Games | Memes |
|---|---|---|---|---|
| Sexual solicitation / grooming | ✔ (text filter, report, block) | **High** | Low | Low |
| Minors present | ✔ 18+ attest | **High** (attest only) | Low | **Medium** |
| Harassment / hate | ✔ report/block | **High** | Low (no text) | Low |
| Spam / scams / links | ✔ | **High** | — | — |
| CSAM / NCII | Low (text-only) | Low (text-only v1) | — | **High if UGC** |
| Copyright | — | — | — | **UGC / third party** |
| Doxxing | ✔ text filter | **Medium** | — | — |
| Self-harm | ✔ | **Medium** (Venting room) | — | — |

### 9.2 Controls we already have (reuse)

18+ attestation · text word-list with auto-report on `severe` · report + block (Redis) · IP rate
limits · Redis sliding-window message limiter · anon sessions not stored in Mongo.

### 9.3 Controls to add (all $0)

| Control | Surface | Detail |
|---|---|---|
| `gid` identity + global ban | all | Ban by `gid`/`userId`; checked on every socket connect and join |
| Room automod | Rooms | §7.3.3 |
| Link policy | Rooms | Blocked for guests/new; allow-list later |
| Slow mode, mute, kick, lock | Rooms | Mod tools |
| Report with context snapshot | Rooms | Message + 30 around it |
| Auto-hide at ≥3 distinct reporters | Rooms, Memes | Hide pending review, never auto-delete |
| Shadow-mute (admin) | Rooms | Sender sees their message; nobody else does |
| **Kill-switch** | all | Admin one-click: close room, disable feature flag, hide meme, ban `gid` — **target < 60 s from alert to action** |
| Self-harm response | Rooms/Whisper | Detect high-risk phrases → show a **resources card** (helplines by region) to the sender; never auto-ban for it |
| Turnstile-style bot check | Rooms (guest first post) | A free Cloudflare/hCaptcha-class challenge on first post only. *Needs verification at build time* (not researched here). |
| Safe default for Venting room | Rooms | Stricter automod, mod presence required to be "open" |

### 9.4 Evidence and retention (the honest trade-off)

Our promise is "anonymous chats aren't stored". Public rooms and reports force a narrow
exception: **when someone reports, we keep a small snapshot** (alias, text, timestamp of the
reported message and 30 messages around it) in `Report.evidence`. No IPs. Retention: 90 days for
resolved, 1 year for anything involving child safety (US 18 U.S.C. §2258A preservation).
The privacy policy must say this in plain language.

### 9.5 Admin tooling needed (today: none of this exists)

- Report queue extended for `roomMessage` / `meme`, with context view and one-click actions
  (dismiss, warn, mute, ban `gid`/`userId`, hide/remove).
- Bans list (create, expire, lift) and a **global ban** list.
- Rooms: create/edit templates, set hours, close instance, view live counts.
- Memes: blocklist add/remove; UGC review queue (Phase 5b).
- A **"panic" card** on the dashboard: disable Rooms / Memes / Games flags immediately.
- Audit log for every moderation action (reuse the `ImpersonationLog` pattern).

### 9.6 Legal obligations that shape the design (informational — not legal advice)

| Regime | Obligation (summary) | Design consequence |
|---|---|---|
| **India IT Rules 2021 (as amended Feb 2026)** | Publish Grievance Officer contact; acknowledge complaints in 24 h, resolve in 7 days; remove nudity/sexual/impersonation content within **2 h** of a complaint, unlawful content within **3 h** of a court/government order | Kill-switch (above), an **on-call owner** for reports, a public Grievance Officer page (extend `/report`), SLA timers in the admin queue |
| **DPDP Rules 2025** | "Child" = under 18, verifiable parental consent (effective May 2027); 72 h breach reporting | Keep the 18+ gate; define what we do if a minor is identified; incident runbook |
| **US: 18 U.S.C. §2258A / REPORT Act** | Actual-knowledge CSAM → report to NCMEC CyberTipline; preserve report content 1 year | A CSAM report path + evidence retention; **no UGC images until this exists** |
| **US: Section 230 / COPPA** | 230 doesn't cover federal crimes; COPPA applies with actual knowledge of under-13s | Don't collect DOB; remove accounts on knowledge |
| **EU DSA** | Small platforms exempt from platform duties but not hosting duties: points of contact, EU legal representative (if outside EU), notice-and-action, statements of reasons | Notice-and-action = the report flow; send a removal reason to the poster where we know them |

Action item: have a lawyer review ToS/Privacy/Guidelines/Safety **before** Rooms leave dark. The
legal pages already exist (Terms, Privacy, Guidelines, Safety, Help, About, Cookies, Contact) and
need Rooms/Memes/`gid` sections.

### 9.7 Moderation staffing (the part money can't hide)

Rooms are only as safe as the people watching them. At $0 that is **us plus automod**. Hence:
launch Rooms **small** (≤ 3 official rooms), **time-boxed** (staffed hours), guest posting behind
a first-post challenge, and expand only when report-to-action time is inside the SLA. Volunteer
mods are a Phase 3b item with a trust threshold, not a launch dependency.

---

## 10. Cost and capacity

### 10.1 Verified limits (Oct 2026)

| Service | Free tier | Source note |
|---|---|---|
| **Upstash Redis** | 256 MB, **500K commands/month**, 10 GB bandwidth, 10K cmds/sec, 1 DB; PAYG $0.20/100K; free DBs archived after ≥30 days idle | Pricing page; **our docs say "10K/day" — stale.** |
| **MongoDB Atlas free** | 0.5 GB, **500 connections**, **100 ops/sec** (throttled), 10 GB in/out per 7 days, paused after 30 days idle | MongoDB docs |
| **Cloudflare R2** | 10 GB-month, 1M Class A, 10M Class B, **egress free**; `r2.dev` not for production | Cloudflare docs |
| **ImageKit free** | 20 GB bandwidth/month, 3 GB storage, no custom domain | ImageKit plans |
| **Oracle Always Free (ARM)** | **2 OCPU / 12 GB** total (older "4/24" blogs are stale); idle reclaim if CPU/net/mem p95 < 20 % over 7 days | Oracle docs |
| **Render free** | 512 MB, spins down after 15 min without HTTP/incoming WebSocket message | Render docs |
| Fly / Koyeb / Railway | No true free always-on tier for new users | third-party summary — spot-check before relying on it |
| **KLIPY** | 100 calls/hour test key; production key by application | KLIPY docs |
| **Perspective API** | Shutting down (Dec 31, 2026) — do not build on it | Perspective FAQ |
| **OpenAI omni-moderation** | Free; images supported (sexual/violence/self-harm; `sexual/minors` is text-only); 250 req/min, 5K/day | OpenAI docs — an option for *text* moderation upgrade; terms to be re-read before use |

### 10.2 Cost drivers per surface

| Surface | Redis | Mongo | Media bandwidth | CPU/RAM | Notes |
|---|---|---|---|---|---|
| Whisper | **Heavy** (~150 cmds / 10-msg session) | light | none | light | Today's main Redis consumer |
| Rooms | **~0** (in-process) | tiny | none | fan-out O(members) | 60-user room @ 1 msg/s ≈ 60 emits/s: trivial |
| Games | queue only | tiny (members) | none | trivial | State in memory |
| Memes v1 | 0 | tiny | **0** (provider-hosted) | cache | KLIPY quota is the limit |
| Memes UGC | 0 | small | **R2 free egress** via custom domain | classifier CPU/RAM | The expensive one |
| Chats | 0 | **messages (512 MB cap)** | ImageKit 20 GB | light | Existing cliffs |

### 10.3 The Redis budget (do the arithmetic now)

- 500K cmds/month ÷ ~154 cmds/session ≈ **3,200 whisper sessions/month ≈ 108/day**.
  (Measured Oct 2026 with `npm run measure:whisper` — a 10-message mutual-like
  guest+guest session through the production match services: join 6, pair 16,
  chat 91, likes 19 (incl. 2 async claim writes), end 22. Excludes
  per-connection costs like presence and socket rate limits, which belong to a
  different budget line.)
- Anything that adds Redis load per *message* or per *room join* competes with Whisper for the
  same 500K. That is why rooms/games are in-process.
- **Recommendation D5:** when we move off the laptop, run **Redis on the same VM** (Oracle ARM
  VM has 12 GB RAM; Redis needs tens of MB). `ioredis` code is unchanged; command limits vanish;
  latency drops from a TLS round trip to localhost. Keep Upstash for dev/staging. Cost: $0, plus
  we own backups/restarts (Redis holds only ephemeral data, so restart is acceptable).

### 10.4 Capacity targets and triggers

| Resource | Comfortable | Trigger to act | Action |
|---|---|---|---|
| Concurrent connections / node | ~500–800 (doc estimate, 1 OCPU) | sustained > 400 | Measure with the load script; consider 2 OCPU split or second node |
| Second node | — | > ~600 CCU or HA need | Redis Socket.IO adapter + move room instance directory/bans to Redis |
| Atlas ops/sec | < 100 | sustained throttling | M10 ($57/mo) |
| ImageKit bandwidth | < 20 GB/mo | ~80 % | Cap sizes, serve UGC memes from R2 custom domain |
| KLIPY | < test-key limits | any 429 | Production key + longer cache |
| Redis (Upstash) | < 500K/mo | > 70 % | Self-host Redis or PAYG (~$0.2/100K) |

### 10.5 Things that will cost real money (so we decide early)

1. **A production domain** — needed for R2 custom domain, clean cookies (`sameSite`), email links.
2. **An always-on host** — Oracle free (2 OCPU/12 GB, reclaim policy) is the only truly free option.
3. **Moderation time** — the real cost; unaffected by cloud pricing.
4. **Lawyer review** of ToS/Privacy for Rooms/UGC (one-off).

---

## 11. Analytics and success metrics

### 11.1 Events (via the existing `track()` collector; no PII)

| Domain | Events |
|---|---|
| Hub | `hub_view`, `hub_card_click{card}`, `nav_click{dest}`, `persona_edit`, `guest_to_member_prompt{shown,clicked}` |
| Whisper | existing `whisper_*` + `whisper_pill_click`, `connection_pending_view`, `connection_claim_redeemed` |
| Rooms | `room_lobby_view`, `room_join{slug}`, `room_message_sent`, `room_leave{dwellBucket}`, `room_report`, `room_mod_action` |
| Games | `game_launch{id,mode}`, `game_invite_sent/accepted/declined`, `game_over{id,result}`, `game_quickmatch_wait{bucket}` |
| Memes | `meme_feed_view`, `meme_card_view{depthBucket}`, `meme_react`, `meme_save`, `meme_share`, `meme_cta_click{find_someone}` |

### 11.2 Metrics

**North star:** **weekly connected pairs** (two people who kept each other) — it is the product's
promise, and every surface should feed it.

| Layer | Metric | Why |
|---|---|---|
| Acquisition | Landing → hub entry rate; hub → first action rate | Is the hub a better front door than `/whisper`? |
| Activation | % of hub visitors who do one *social* action in session 1 | Solo content must lead somewhere |
| Engagement | Sessions/user/week; surfaces used per user | Is it a platform or five silos? |
| Retention | D1 / D7 / D30 by first surface | Tells us which door retains |
| Liquidity | Median whisper queue wait; % rooms with ≥ 5 people at peak | The gating health metric |
| Conversion | Guest → member; Connect completion rate; pending→complete rate | The business funnel |
| Safety | Reports per 1,000 messages; **time-to-action**; repeat-offender rate | Must stay inside SLA |
| Quality | Rooms: median messages per person-minute; Games: completion rate; Memes: cards viewed per session | Is it good, not just busy? |

### 11.3 Kill / pivot criteria (written down before we build)

| Surface | We stop or rework if… |
|---|---|
| Rooms | After 6 weeks of official rooms, < 20 % of peak-hour room instances reach 5 people, **or** time-to-action on reports exceeds 6 h more than once a week |
| Games | In-Whisper game invites accepted < 15 %, **and** quick-match median wait > 60 s |
| Memes | Median session cards < 10 **and** hub→Whisper CTA click < 1 % |
| Hub overall | Hub-entry users show lower D7 than direct `/whisper` entry |

---

## 12. Roadmap

Sizing is **relative** (S ≈ days, M ≈ 1–2 wk, L ≈ 3–5 wk, XL ≈ 6+ wk of focused work) and should
be recalibrated after Phase 0.

```
Phase 0 ─ Foundations ───────────────────────────────  M
Phase 1 ─ Whisper in the hub ────────────────────────  L
Phase 2 ─ Memes v1 (KLIPY shuffle) ──────────────────  S–M   (gate G-M1)
Phase 3 ─ Rooms (official, time-boxed, small) ───────  XL    (safety gate)
Phase 4 ─ Games (In-Whisper → Solo → Quick match) ──  L
Phase 5 ─ Memes v2 (originals, UGC) + Premium hooks ─  L–XL  (legal gate)
Phase 6 ─ Scale + reach (adapter, push, PWA) ───────  trigger-driven
```

### Phase 0 — Foundations (M)

*Goal: the hub exists, empty but real; nothing user-visible breaks.*

- Lock decisions D1–D13; update docs ([§15](#15-docs-to-update-on-approval)).
- `shared/constants/routes.ts`; migrate ≈30–35 touchpoints; `/chat/:id → /chats/:id` redirect.
- `HubShell`, `NavRail`, `BottomTabBar`, Home skeleton (cards render "coming soon"/real for Whisper).
- Split `AppWrapper` → `HubShell` + `ChatsLayout`; move `useProfileQuery` to `auth`.
- Server: `socket/identity.ts`, `gid` cookie, feature flags + `GET /api/hub/summary` (flags only).
- Measure real Redis commands per whisper session; fix the stale numbers in docs.
- Test harness additions; analytics event constants for `hub_*`.
- **Exit:** all existing flows (landing, auth, chats, whisper) work through the new shell on
  desktop and mobile; typecheck + lint + existing tests green; hub behind a flag in prod.

### Phase 1 — Whisper in the hub (L)

- `WhisperSessionProvider` + live-whisper pill; remove reset-on-unmount.
- Whisper renders in the shell for guests and members; rails/sheets integrated.
- `GET /connection/pending`, `DELETE …/pending/:id`, **claim** redeem; Chats ghost rows; origin
  marker on chats; `GET /match/quota`; Whisper hub card with honest counts.
- Hardening: connected-report → rematch block; skip connected pairs.
- **Exit:** a guest who closes the tab after a mutual vibe can still complete after signing in;
  a member sees pending rows; a live whisper survives navigating to Chats and back.

### Phase 2 — Memes v1 (S–M, gated by G-M1)

- KLIPY production key + terms check; `services/memes/klipy.ts`; `GET /api/memes` with cache.
- `features/memes` shuffle feed (virtualized), categories, local reactions/saves, member saves,
  Home Memes tab + hub card, "Find someone" interstitial cards.
- **Exit:** guest can scroll memes with no account; KLIPY quota safe under cache; report/hide works.
- **Why now:** solo value → creates daily visits that give Whisper/Rooms their liquidity.

### Phase 3 — Rooms (XL, **safety gate**)

3a (official rooms, small): `/rooms` namespace, registry, automod, slow mode, mods, bans,
reports with snapshot, admin tooling, lobby + room UI, Wave bot (prompts only), room hours,
first-post challenge, legal page updates, kill-switch, on-call runbook.
3b (later): game night hosted by the bot, volunteer mods, user-created rooms (trusted), unlisted
invites.
- **Gate to leave dark:** every item in §9.3/§9.5 for Rooms is done; Grievance Officer page live;
  lawyer review done; staffed hours defined; load test passes (300 sockets, 5 msg/s).
- **Exit:** 3 rooms live, report-to-action median < 30 min in staffed hours, no P1 incidents in
  2 weeks.

### Phase 4 — Games (L)

4a: engine + Tic-Tac-Toe + Would You Rather **inside Whisper** (invite/accept, panel,
result card). 4b: Daily Puzzle + `/play` lobby + results/leaderboard (members). 4c: quick-match
queue + post-game "chat?" funnel. 4d: Trivia Blitz for room game nights (needs Phase 3).
- **Exit:** In-Whisper invite acceptance ≥ 15 %; engine has reducer tests for every game;
  zero server-side leaks of hidden information in `view()` tests.

### Phase 5 — Memes v2 + Premium hooks (L–XL, **legal gate**)

5a: "Wave originals" (admin-curated, rights-cleared). 5b: UGC for trusted members with the full
pipeline (§7.5.4) — **only** after the CSAM report path, human review queue, takedown SLA tooling
and R2 custom domain exist. 5c: Spark Pass hooks (create private rooms, host badge, extra saves,
cosmetic game skins, no whisper cap) — Stripe stays Phase-3-of-old-numbering and is out of scope
here.

### Phase 6 — Scale and reach (trigger-driven)

Redis Socket.IO adapter + shared room directory (second node) · Atlas upgrade · FCM push +
`Notification` collection · PWA manifest + service worker (installable hub) · read receipts etc.
only on demand.

### Explicitly **not** in this plan

Voice/video · concurrent whispers · anonymous threads inside Chats · UGC images in rooms ·
algorithmic feeds · Reddit-sourced content · wagering/real-money games · native apps · paid
moderation APIs (until revenue) · AI companions.

### Dependency map

```
P0 ─┬─► P1 ─┬─► P3a ─► P3b
    │       └─► P4a ─► P4b ─► P4c ─► P4d (needs P3a)
    └─► P2 (G-M1)  ─────────────────────► P5a ─► P5b (legal gate)
```

---

## 13. Risks

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | **Empty rooms/queues** feel dead | H | H | Few rooms; room hours; bots clearly labelled; solo content first; honest counts + fallbacks; consolidate rather than add |
| R2 | **Moderation failure** in public rooms | M | **Critical** | Safety gate before launch; staffed hours; automod; kill-switch; start with ≤3 rooms |
| R3 | **Legal clock miss** (2-hour takedown) | M | High | On-call owner; admin SLA timers; flags to disable surfaces instantly; lawyer review |
| R4 | **Redis budget** blown by growth | H | M | Measure now; rooms/games in-process; self-host Redis on the VM |
| R5 | **Single-node SPOF / restart wipes rooms** | M | M | Announce restarts; graceful shutdown notice; scale trigger to adapter |
| R6 | **Oracle free reclaim / host instability** | M | High | Keepalive/real traffic; backups of Mongo; documented fallback host |
| R7 | **KLIPY terms forbid a feed** or rate-limit us | M | M | Gate G-M1; cache; Wave originals fallback; GIPHY as alternate |
| R8 | **Scope dilution** — five surfaces, tiny team | H | H | Phased exits + kill criteria; ship dark; cut Games/Memes first if Rooms/Whisper need focus |
| R9 | **Guests as abuse vector** (ban evasion) | H | M | `gid` bans; first-post challenge; link block; slow mode; shadow-mute |
| R10 | **Brand confusion** ("Omegle clone" vs everything-app) | M | M | Thesis in §2; Whisper stays the hero card; copy audit on landing |
| R11 | **Privacy backlash** from `gid`/evidence snapshots | L | M | Plain-language disclosure; narrow retention; no IP; used only for safety |
| R12 | **Refactor regressions** (route move, AppWrapper split) | M | M | Phase 0 exit requires all current flows green; redirects; flags; staged rollout |
| R13 | **UGC memes** — CSAM/NCII/copyright | M | **Critical** | Don't ship until pipeline + legal path exist; trusted-only; pre-moderation |
| R14 | **Self-harm content** in Venting-style rooms | M | High | Resources card; mod presence; strict automod; clear "not a crisis service" |

---

## 14. Decisions needed

Each has a recommendation; the plan assumes them unless overridden.

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Do guests enter the hub without an account? | Yes / gate behind sign-up | **Yes** — alias persona; account for persistence only |
| **D2** | Mobile bottom tabs | Home·Rooms·Whisper·Play·Chats (Memes in Home) / add Memes as 6th | **5 tabs, Memes in Home** |
| **D3** | One persona across surfaces | One / per-surface | **One** |
| **D4** | Rooms launch scope | Official-only small set / also user rooms | **LOCKED Oct 2026: 4 official rooms + instant user creation (unlisted/private default, host-moderated, rules-accept screen logged at creation) + one-tap approval for lobby listing.** Unreviewed public listing stays in 3b (trust-gated + volunteer mods). A disclaimer transfers no liability — safe harbour rests on response capability (kill-switch, report-with-context, on-call SLA), which ships day one. |
| **D5** | Redis | Upstash free (500K/mo) / Upstash PAYG / **self-host on VM** / Redis Cloud free | **Self-host on the VM** when off the laptop; Upstash for dev |
| **D6** | Meme source v1 | KLIPY / curated / UGC | **LOCKED Oct 2026: JokeAPI v2 + Memegen.link render (Option 2).** Text stays ours (`safe-mode` + full blacklist, Misc/Programming/Pun); two-part jokes map to top/bottom meme text, server picks template by rotation, truncates lines, caches the mapping, falls back to text cards. Zero bandwidth, no key. |
| **D7** | Games v1 set | see §7.4.1 | **Would You Rather + Tic-Tac-Toe in Whisper first** |
| **D8** | Guest stable id | `gid` 30 d cookie / none | **`gid`** (disclosed, safety-only) |
| **D9** | Guest posting in rooms | Allowed with challenge / read-only | **Allowed after alias + first-post challenge, text-only, no links** |
| **D10** | Who is on call for reports (2 h SLA)? | Name an owner | **LOCKED Oct 2026: you, always.** Obligates: published Grievance Officer contact on `/report`, report-age/SLA display in the admin queue. |
| **D11** | Production domain | Buy now / later | **LOCKED Oct 2026: deferred.** `whisper-wave.onrender.com` + localhost cover testing through Phase 3 (same-origin client serving keeps cookies first-party). Real triggers to buy: UGC memes (R2 custom domain — `r2.dev` is rate-limited) or leaving Render (subdomain dies with the host). |
| **D12** | Moderation model | Staff + automod / volunteer mods | **Staff + automod at launch**, volunteers in 3b |
| **D13** | Memes naming/branding | "Shuffle" feed (no algorithm) / "For You" | **Shuffle** |
| **D14** | Whisper session persists across navigation | Persist (provider) / confirm-and-end | **Persist** (Phase 1); until then, confirm on leave |
| **D15** | Both-members mutual like | One-tap Connect / auto-connect | **One-tap with a reveal note** |
| **D16** | Hosting target | Oracle free (2 OCPU/12 GB) / small paid VPS | **Oracle free to start; budget ~$5/mo VPS as the fallback** |

---

## 15. Docs to update on approval

| Doc | Change |
|---|---|
| `PRODUCT.md` | New vision paragraph (thesis §2.1); add Guest/Member surfaces to *User States*; remove *Public group rooms* from Non-Goals (keep *Stories*); add Rooms/Games/Memes sections; fix phase list |
| `TECH.md` | Correct Upstash limits; Oracle 2/12; add `/rooms` and `/play` namespaces, `gid`, in-process room/game state, self-hosted Redis recommendation; decision-log entries for D1–D16 |
| `USER_JOURNEY.md` | New Journeys **E** (guest uses hub), **F** (rooms), **G** (games), **H** (memes); update C (logged-in whisper) with pending list/claim |
| `PHASE2.md` | Note the Redis-claim addition and the stale cost model |
| `Todo.md` | Move hub phases into the backlog; keep the *Rejected* list; add the audit gaps (§3.3) |
| `.cursor/rules/product-and-cost.mdc` | Add: Redis self-hosting approved at $0; KLIPY as the approved meme source; domain purchase as an approved one-off |
| `.cursor/rules/client-architecture.mdc` | Add `layout/HubShell` + new feature slices (`hub`, `rooms`, `games`, `memes`) and the "feature-owned hub card" convention |
| Legal pages | Terms/Privacy/Guidelines/Safety/Cookies: Rooms, Memes, `gid`, evidence snapshots; Grievance Officer on `/report` |

---

## 16. Appendices

### A. Route migration (client)

| File family | Change |
|---|---|
| `app/router.tsx` | New route table (hub routes, redirects); guards: `HubShell` for all, `MembersOnly` for `/chats*` |
| Landing (`LandingNav`, hero/CTA components, footer) | `ROUTES.*`; "Enter" → `/home` |
| Chat (`ChatListItem`, `ChatListHeader`, `CreateGroupPanel`, `useOpenMemberChat`, `useOpenWhisperDm`, `ConversationHeader`, `useConversationHeaderActions`) | `ROUTES.chat(id)`, back → `ROUTES.chats`; remove the 3-dot Whisper item |
| Notifications (`NotificationItem`) | `ROUTES.chat(id)` |
| Whisper (`useCompleteConnection`, `AnonSelfPanel`, auth pages) | `ROUTES.auth`, `ROUTES.whisper` |
| Misc (`PageNotFound`, `RouteError`, `Landing`) | `ROUTES.home`/`landing` |

### B. Event name catalogs (new)

```
rooms:  ROOM_JOIN ROOM_LEAVE ROOM_MESSAGE ROOM_REACT ROOM_MOD
        ROOM_STATE ROOM_MESSAGE ROOM_REACTION ROOM_PRESENCE ROOM_MOD_ACTION ROOM_CLOSED ROOM_ERROR
games:  GAME_INVITE GAME_ACCEPT GAME_DECLINE GAME_ACTION GAME_STATE GAME_OVER GAME_REACT GAME_ERROR
play:   PLAY_QUEUE_JOIN PLAY_QUEUE_LEAVE PLAY_MATCHED PLAY_ERROR
```

Names live in `server/src/constants/room-events.ts` / `game-events.ts` and are mirrored in
`client/src/shared/constants/socket.ts` (existing convention).

### C. Wave Team and bot policy

The **Wave bot** is always labelled, never mimics a person, never collects data, and its prompts
are authored content (a JSON list in the repo). It exists to keep rooms alive and host games, and
it is easy to switch off per room. It does **not** run an AI model (no cost, no unpredictable
output).

### D. Minimum viable "dead hub" experience

When almost nobody is online the hub must still feel intentional:

- Whisper card: "Find someone" (always honest: "usually a short wait").
- Rooms card: closed/quiet rooms show **hours** and **Remind me**.
- Play: daily puzzle + Would You Rather solo-style preview.
- Memes: full content regardless of concurrency.
- Never show "0 online"; show nothing or a calm alternative.

### E. Rollout plan

1. Merge everything behind flags (`FEATURE_*`), flags default **off** in prod.
2. Phase 0 ships with redirects live and the old routes kept as aliases for one release.
3. Enable per surface for internal accounts → invite-only → public, watching the §11 safety
   metrics at each step.
4. Every surface has a documented **disable procedure** (a flag flip) and a **data-impact note**
   (what is lost when disabled: rooms are ephemeral, so nothing).

### F. File impact summary

| Area | New | Changed | Removed/Moved |
|---|---|---|---|
| Client | `layout/HubShell`, `layout/ChatsLayout`, `shared/components/nav/*`, `shared/constants/routes.ts`, `features/{hub,rooms,games,memes}/*`, pending/pill components | `app/router.tsx`, ~25 files for path constants, `features/whisper/*` (provider), `features/chat/*` (list rows) | `AppWrapper` (split), `useProfileQuery` (moved to `auth`) |
| Server | `socket/identity.ts`, `socket/rooms/*`, `socket/play/*`, `services/{rooms,games,memes,hub}/*`, models/repos/validators/routes/types for those | `controllers/connection.ts` + `services/connection.ts` (pending/claim), `socket/anon/*` (identity reuse + game events), `services/report.ts`, admin controllers/routes, `config/env.ts`, `config/cors.ts` (gid cookie), `controllers/gif.ts` → adapter | — |
| Docs/rules | `docs/HUB_PLAN.md` (this) | PRODUCT/TECH/USER_JOURNEY/PHASE2/Todo, two rule files, legal pages | — |

---

*End of plan. Review §14 first — those sixteen decisions are the only thing standing between this
document and Phase 0.*
