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
3. **Can you see it?** Admin → Rooms → the instance; admin → Reports for the
   evidence snapshot (message ± neighbours, no transcript trawling).

## Actions (fastest first)

| Situation | Action | Where |
|---|---|---|
| Active harm in one room | Close the instance | Admin → Rooms → Close |
| Whole surface is on fire | Panic card: disable Rooms/Games/Memes | Admin → Rooms → Panic card (instant, restart resets) |
| Repeat offender | Ban (`gid` and/or `userId`, room or global) | Admin → Rooms → Bans |
| Single message | Delete (evidence survives in the report) | In-room ⋯ menu or report queue |
| Disruptive, not abusive | Mute 10–60 min, or kick (15-min auto-ban) | In-room ⋯ menu |
| Sexual content complaint | Remove + ban + mark report reviewed | Report queue, inside the 2 h clock |

Every action writes to the log (bans list, report `reviewed`). If the tool
is down, act from the database directly and note it — the clock does not
pause for deploys.

## After

- Mark the report reviewed with what was done.
- If it was close (near-miss on a clock), add one line to `docs/Todo.md`
  with what almost broke.
- If a surface caused it, consider leaving it dark until the cause is fixed —
  the flags exist for exactly this.

## First boot checklist

- Seed the official rooms: `npx tsx --env-file=.env scripts/seed-rooms.ts`.
- After your own first sign-in, add your `userId` to each official room's
  `mods` (Admin → Rooms → edit, or `PUT /api/admin/rooms`) — until then no
  account can moderate the official rooms.
