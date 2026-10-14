# Whisper Wave — On-Call Runbook

> Owner: solo on-call (D10). This page is the procedure, not the policy —
> policy lives in `docs/HUB_PLAN.md` §9.

## Clocks (memorize these)

| Clock | Starts | Deadline |
|---|---|---|
| Sexual/nudity/impersonation complaint | Grievance inbox timestamp | **Remove in 2 h** |
| Any other complaint | Grievance inbox timestamp | Acknowledge 24 h, resolve 7 d |
| Court/government order | Receipt | **Remove in 3 h** |
| CSAM actual knowledge | The moment you see it | Report to NCMEC CyberTipline + preserve 1 year |

## Triage (in order)

1. **Is someone in immediate danger, or is this CSAM?** Emergency services /
   NCMEC first, tooling second.
2. **Is it spreading?** A public room or a viral thread outranks a DM.
3. **Can you see it?** Admin → Rooms → the instance; Admin → Reports for the
   evidence snapshot (message ± neighbours, hidden flags, offender `gid`/user id,
   report age against its clock — no transcript trawling).

## Actions (fastest first)

| Situation | Action | Where |
|---|---|---|
| Active harm in one room | Close the instance | Admin → Rooms → Close |
| Whole surface is on fire | Panic card: disable Rooms, Private rooms or Memes (Games has no switch — it isn't built) | Admin → Rooms → Panic card. Takes effect immediately, is **enforced on the server** (APIs 404, live rooms close) and **persists across restarts** (`FeatureOverride`) |
| Abuse in **private** rooms | Same tools: reports from private rooms arrive in the normal queue with the evidence snapshot; Close the instance, ban the offender, or switch **Private rooms** off on the panic card (ends live private rooms only; public rooms keep running). Admin → Rooms → filter `private` lists them; admins cannot convert them to public | Admin → Rooms |
| Repeat offender | Ban (`gid` and/or `userId`, room or global, with a duration) | Admin → Rooms → Bans, or **Ban** on a report (room/global scope + 1 h / 24 h / 7 d / 30 d) |
| Single message | **Hide message** (evidence survives in the report) | Report queue, or the in-room ⋯ menu |
| Disruptive, not abusive | Mute 10–60 min, or kick (15-min auto-ban) | In-room ⋯ menu |
| A joke that should not be served | Block its id | Admin → Memes (shows reports count; Unblock to undo) |
| Sexual content complaint | Hide + Ban + **Mark reviewed** | Report queue, inside the 2 h clock |
| Wrong mods / rules / hours on a room | Edit the room (mods, hours, rules, description, visibility) | Admin → Rooms → Edit |
| A new user's room is waiting for listing | Approve (one tap) | Admin → Rooms |

**Mark reviewed needs a note** (≤ 500 chars; what you did and why) — the
server rejects the request without one. Ban needs a report that carries a
`targetGid` or `targetUserId` (a 409 means it doesn't — use Admin → Rooms →
Bans by hand); Hide/Ban only work on room-message reports. Reviewing starts the
retention clock: reports are deleted 90 days after review (1 year for
child-safety). Every action writes to the audit log. If the tool is down, act
from the database directly and note it — the clock does not pause for deploys.

## Venting (listening room) — who is the mod on duty

Venting has `requiresModPresence`: it only accepts posts while a moderator
(mod/host/admin account) is seated. **The owner is the mod on duty, always**
(be in the room's `mods` list; join the room to staff it). Nobody there for 3
minutes after the last mod leaves = **the room pauses**: members can still read,
composers disable, posts are refused. It resumes the instant a mod joins. The
first member into an unstaffed room pushes the room's mods ("Venting needs a
moderator", at most once per 10 min each, even if they are online elsewhere).
If you cannot staff it, leave it paused or set room hours / switch Rooms off.

## After

- Mark the report reviewed with a note of what was done.
- If it was close (near-miss on a clock), add one line to `docs/Todo.md`
  with what almost broke.
- If a surface caused it, consider leaving it dark until the cause is fixed —
  the flags exist for exactly this.

## First boot checklist

- Seed the official rooms: `npx tsx --env-file=.env scripts/seed-rooms.ts` from
  `server/`. A hosted `mongodb+srv` cluster is refused unless you add
  `FORCE=true` (so a typo can't seed production by accident).
- Flags: `FEATURE_ROOMS` / `FEATURE_MEMES` in `server/.env` are only the boot
  default; whatever the panic card last set wins and persists.
- After your own first sign-in, add your `userId` to each official room's
  `mods` (Admin → Rooms → edit, or `PUT /api/admin/rooms`) — until then no
  account can moderate the official rooms.
