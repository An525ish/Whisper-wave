# Whisper Wave — Lawyer Review Brief

> Purpose: hand this to a tech/internet lawyer (India) for a fixed-fee review
> **before public rooms launch**. Testing with friends does not need it; a
> public launch does. Nothing here is legal advice — it is the question list
> and the facts counsel will ask for.

## Product in one paragraph

Anonymous 1:1 chat (Whisper) plus live topic rooms (text plus member photos/GIFs/memes where enabled; ephemeral, except reported content and photos, which are kept until an admin deletes them),
a joke shuffle feed (third-party text rendered as images, with an opt-in
18+ unfiltered mode for members), and persistent
DMs/groups after mutual opt-in. No algorithmic feed, no real names in
anonymous surfaces, 18+ gate (checkbox attestation). Solo founder, sole
on-call for reports. Hosted on Render (US), MongoDB Atlas, Cloudflare R2.

## Data inventory (from the code — verify, don't trust)

| Data | Where | Lives how long |
|---|---|---|
| Account (name, username, email, avatar, bio) | Mongo `User` | Until account deletion |
| `User.unfiltered` — the member's opt-in to unfiltered 18+ jokes, stored with the 18+ self-declaration made when enabling it | Mongo `User` | Until account deletion (the member can switch it off any time) |
| Saved jokes (member saves: provider id only) | Mongo `MemeSave` | Until the member unsaves or deletes the account |
| Joke reports + block counters (reporter is a `gid`; counts per joke) and admin blocks | Mongo `MemeBlock` | Indefinite (small; ask counsel) |
| Runtime kill-switch state for Rooms/Memes/Games | Mongo `FeatureOverride` | Until changed |
| DMs/groups/messages | Mongo `Chat`, `Message`, `ChatRead` | Until deleted/cleared |
| Connections + pending | Mongo `Connection` (unique `pairKey`), `PendingConnection` (7 d TTL) | Permanent / 7 d |
| Refresh tokens (SHA-256) | Mongo `RefreshToken` (7 d TTL) | 7 d |
| Reports + evidence snapshots (alias/text/ts only, no IPs; target `gid`/`userId`, room instance, `reviewedAt`, `actionNote`) | Mongo `Report` | Deleted by a TTL index on `retainUntil`: 90 d after the report is reviewed; 1 y for child-safety (both now enforced in code) |
| Room templates + bans | Mongo `Room`, `RoomBan` (TTL on `until`) | Templates permanent; bans expire |
| Mod actions | Mongo `ModAudit` | Indefinite (ask counsel) |
| Anon sessions/messages/queue/likes/blocks | Redis only | 24 h (blocks 30 d) |
| Mutual-like claims (alias/tags only, keyed `match:claim:{anonId}:{sessionId}` + index `match:claims:{anonId}`) | Redis only | 7 d, or until redeemed |
| Pending connections (partner not yet connected) | Mongo `PendingConnection` | 7 d TTL |
| Room threads/presence | Process memory | Until empty/restart |
| `anonId` cookie (24 h), `gid` cookie (30 d, safety-only), auth JWTs | httpOnly cookies | As stated |
| Meme reactions, hides, guest saves | Device localStorage | User-controlled |

What we never store: IPs/PII on anon sessions, message transcripts after
a session or room ends (except report evidence above).

### Third-party contact (memes)

- **JokeAPI** supplies the joke text; only our server calls it (the user's IP
  is not sent to it).
- **Memegen.link (`api.memegen.link`)** renders each joke as an image. The
  server composes the image URL and **the user's browser loads it directly**,
  so Memegen sees the user's IP address and user agent, and the joke text is in
  the URL. We have no contract with the host (public instance). Disclosed on the
  Privacy page.
- KLIPY (GIF search in chat) is proxied through our server.

## Safety machinery (what counsel should assume exists)

18+ attestation (server-enforced) · word-list filter (fails open) with
auto-report on severe hits · user + anon + room reports with context
snapshots · Redis blocks (dual-key) · room automod (slow mode, link block,
flood/duplicate suppression, auto-hide at 3 reporters) · mute/kick/
shadow-mute/lock/ban/close · kill-switch flags · grievance contact on
`/report` (talkto.anish.singh@gmail.com) · on-call runbook (`docs/RUNBOOK.md`).

## Questions for counsel

1. **IT Rules (India), as amended**: does our grievance flow (published
   contact, 24 h ack, 7 d resolve, 2 h sexual/nudity/impersonation takedown,
   3 h court-order takedown) satisfy intermediary due-diligence? What
   designates us a "significant" intermediary, if anything?
2. **Safe harbour scope**: what breaks it for us (knowledge standards,
   response times, the rooms product specifically)?
3. **DPDP Rules**: is checkbox 18+ attestation adequate today; what must
   change before May 2027 (verifiable parental consent)?
4. **Evidence retention**: are 90 d / 1 y defensible? Anything to shorten,
   encrypt, or access-log?
5. **CSAM obligations**: exact reporting + preservation duties on actual
   knowledge, including for a text-only, no-storage architecture.
6. **Anonymity + blocks**: does dual-key (`gid`/`userId`) blocking with no
   IPs create any notice/consent duty? Is the `gid` cookie disclosure
   (Privacy page) sufficient?
7. **Room host liability**: does making creators "hosts" with mute/kick
   transfer any duty to them, or concentrate it on us?
8. **UGC memes (later)**: DMCA-style takedown path + repeat-infringer
   policy — what must exist before trusted-member uploads ship?
9. **ToS enforceability**: clickwrap sufficiency for alias/rooms rules,
   account termination, and the "unlisted until approved" listing model.
10. **Breach duties**: 72 h reporting — what must be logged today so we
    can report at all (access logs, retention)?

11. **Dark shelf + member-opt-in Unfiltered 18+ mode** (owner decision D6,
    amended): jokes without the blacklist, plus a Dark shelf, only for members
    who confirm they are 18+ (stored on the account), never in the guest or
    default feed. Is that acceptable under IT Rules / Indian obscenity law and
    for third-party content we do not author, and is a checkbox declaration
    enough? **Counsel sign-off is pending**; the flag can be switched off at any time.
12. **Instant listing for trusted accounts** (owner decision D4, amended): rooms
    created by accounts that are 7+ days old with no strikes appear in the public
    lobby without review; everyone else needs one-tap admin approval. Does
    instant listing weaken safe harbour or the "unlisted until approved" model?
13. **Challenge strength / disclosure**: implemented — the first-post guest
    check is Cloudflare Turnstile (arithmetic only as a dev/CI fallback). The
    script loads from Cloudflare only on a guest's first room post; Cloudflare
    receives IP and browser signals and may set cookies. Privacy and Cookies
    disclose this. Remaining question: is that disclosure sufficient, or is a
    consent step needed before the widget loads?
14. **Memegen / JokeAPI**: any notice, consent or licence concern in sending
    users' IP/UA to a public Memegen instance, or in re-rendering JokeAPI text
    (MIT-licensed project, no stated attribution requirement)?
15. **Private rooms** (D17): invite-only, members-only rooms (max 25 people,
    deleted after 30 idle days, no lobby, no search). They are ephemeral like
    every room, remain reportable with evidence snapshots, and fall under the
    same automod, bans and kill-switch; we can still close them and act on any
    account in them. Does offering private groups change our intermediary
    position (knowledge, expectation of privacy, notice-and-takedown scope)
    compared with public/unlisted rooms?

## Open items before public launch

- The **Grievance Officer** name, contact and a real email address on a domain
  we control must be published (the in-app page carries a role placeholder and
  the `whisperwave.app` mailboxes). The production domain is deferred (D11), so
  those addresses are not live until a domain is bought. **To be published before
  public launch.**

## Documents to hand over

`client/src/pages/legal/{Terms,Privacy,Guidelines,Safety,Cookies,ReportAbuse}.tsx` ·
`docs/{PRODUCT,TECH,USER_JOURNEY,HUB_PLAN,RUNBOOK}.md` ·
`docs/Todo.md` (scope decisions) · this brief.
