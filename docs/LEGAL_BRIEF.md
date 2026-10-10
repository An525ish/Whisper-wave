# Whisper Wave — Lawyer Review Brief

> Purpose: hand this to a tech/internet lawyer (India) for a fixed-fee review
> **before public rooms launch**. Testing with friends does not need it; a
> public launch does. Nothing here is legal advice — it is the question list
> and the facts counsel will ask for.

## Product in one paragraph

Anonymous 1:1 chat (Whisper) plus live topic rooms (text-only, ephemeral),
a joke shuffle feed (third-party text rendered as images), and persistent
DMs/groups after mutual opt-in. No algorithmic feed, no real names in
anonymous surfaces, 18+ gate (checkbox attestation). Solo founder, sole
on-call for reports. Hosted on Render (US), MongoDB Atlas, Cloudflare R2.

## Data inventory (from the code — verify, don't trust)

| Data | Where | Lives how long |
|---|---|---|
| Account (name, username, email, avatar, bio) | Mongo `User` | Until account deletion |
| DMs/groups/messages | Mongo `Chat`, `Message`, `ChatRead` | Until deleted/cleared |
| Connections + pending | Mongo `Connection` (unique `pairKey`), `PendingConnection` (7 d TTL) | Permanent / 7 d |
| Refresh tokens (SHA-256) | Mongo `RefreshToken` (7 d TTL) | 7 d |
| Reports + evidence snapshots (alias/text/ts only, no IPs) | Mongo `Report` | 90 d resolved; 1 y child-safety |
| Room templates + bans | Mongo `Room`, `RoomBan` (TTL on `until`) | Templates permanent; bans expire |
| Mod actions | Mongo `ModAudit` | Indefinite (ask counsel) |
| Anon sessions/messages/queue/likes/claims/blocks | Redis only | 24 h (claims 7 d, blocks 30 d) |
| Room threads/presence | Process memory | Until empty/restart |
| `anonId` cookie (24 h), `gid` cookie (30 d, safety-only), auth JWTs | httpOnly cookies | As stated |
| Meme reactions/saves/hides | Device localStorage | User-controlled |

What we never store: IPs/PII on anon sessions, message transcripts after
a session or room ends (except report evidence above).

## Safety machinery (what counsel should assume exists)

18+ attestation (server-enforced) · word-list filter (fails open) with
auto-report on severe hits · user + anon + room reports with context
snapshots · Redis blocks (dual-key) · room automod (slow mode, link block,
flood/duplicate suppression, auto-hide at 3 reporters) · mute/kick/
shadow-mute/lock/ban/close · kill-switch flags · Гриевance contact on
`/report` (grievance@whisperwave.app) · on-call runbook (`docs/RUNBOOK.md`).

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

## Documents to hand over

`client/src/pages/legal/{Terms,Privacy,ReportAbuse}.tsx` ·
`docs/{PRODUCT,TECH,USER_JOURNEY,HUB_PLAN,RUNBOOK}.md` ·
`docs/Todo.md` (scope decisions) · this brief.
