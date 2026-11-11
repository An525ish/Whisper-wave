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

## Payments (Spark Pass, Razorpay)

Setup, once: create a Razorpay account, finish KYC, then use TEST keys first.
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in
`server/.env` (all three, or buying stays off). In the dashboard add the webhook
`https://<domain>/api/payments/webhook` with events `payment.captured` and
`order.paid`, using the same secret. Smoke test: buy a day pass with a test UPI
id, check `/pricing` shows "Spark Pass is on", then replay the webhook from
the dashboard and confirm the time does not grow.

Switch off: unset any one of the three keys and restart. Passes already bought
keep working; only buying stops.

A user says "I paid and have no pass":
1. Find the order: Mongo `paymentorders` by their user id or Razorpay order id.
2. `status: paid` and a pass exists: they need to refresh. Done.
3. `status: created`: Razorpay never told us. Open the payment in the Razorpay
   dashboard. If it is captured, Webhooks > replay the event. Retries are safe.
4. Cannot fix quickly: grant by hand (`POST /api/admin/users/:id/pass`
   `{ "planId": "month" }`) and refund or reconcile later.
Refund: refund in the Razorpay dashboard, then `DELETE /api/admin/users/:id/pass`.


### Boosts

Credits live in the `boostwallets` collection (`credits`, `activeUntil`); each purchase is a normal `PaymentOrder` with `planId` `boost1` or `boost5`. A running boost is a Redis key `match:boost:<userId>` that expires on its own.
- "I paid for a boost and have none": find the order by Razorpay order id, then check `boostwallets`. If the order is `paid` but credits are missing, add them by hand (`$inc credits`).
- A Redis flush ends running boosts early while the wallet still shows them active. Credits are never lost; the person can add another.
- Support grant: `db.boostwallets.updateOne({user: ObjectId('...')}, {$inc: {credits: 1}}, {upsert: true})`.

## Ads (Google AdSense)

Off until configured. Slots: waiting screen and thread-ended screen only. Pass holders and people who tap "No thanks" see none.

1. Apply for AdSense with the production domain. Anonymous chat sites can be refused: if so, ads stay off, nothing else breaks.
2. Create two ad units (display, responsive). Copy the publisher id and each numeric slot id.
3. Set `ADSENSE_CLIENT_ID=ca-pub-...`, `ADSENSE_SLOT_WAITING`, `ADSENSE_SLOT_BETWEEN` on the server and redeploy. The server then serves `/ads.txt` and opens the CSP to Google ad origins.
4. Check: `curl https://<domain>/ads.txt`, then open the waiting screen signed out, tap "Show ads". A blank slot for the first day is normal while AdSense reviews.
5. EEA/UK traffic needs a Google-certified consent tool before AdSense will serve there. Not built: launch India-first.
6. Switch off: unset the three vars and redeploy. The slots, the script and the CSP entries all disappear.
