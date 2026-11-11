# Whisper Wave: Monetization Plan

> Living document. Update when pricing, provider or phase status changes.
> Last updated: Oct 2026
> Related: [`PRODUCT.md`](./PRODUCT.md) (Spark Pass feature list), [`TECH.md`](./TECH.md) (D19 payments), [`Todo.md`](./Todo.md) (Spark Pass audit).

## 1. Goal and reality check

Make real money without breaking the $0 rule before revenue, and without turning an anonymous chat into a creepy product.

- Below about 10,000 monthly users this is pocket money. Real money starts near 50,000 monthly users.
- Infrastructure break-even is about 51 paid users (see `PHASE2.md`).
- Growth and day-7 retention come first. Do not tune pricing before retention is above roughly 10%.
- Everything below is sold on the web. No native apps, so no app-store cut.

## 2. What we charge for

Ranked by expected money, not by how nice the feature sounds.

| # | Feature | Free | Paid | Effort |
|---|---|---|---|---|
| 1 | Daily whisper cap | Capped per day (counter already ships, Todo E6) | No cap | Near zero |
| 2 | Gender preference | Random only | Prefer a gender (soft, see 4). Region or scene via vibe tags | Medium |
| 3 | Priority queue | Normal | Front of the line | Low once buckets exist |
| 4 | Ads | Waiting screen and between chats only | None | Low |
| 5 | Boosts | n/a | One-off queue priority | Medium |
| 6 | Private rooms | Not allowed | Allowed (replaces the trust check in `entitlements.ts`) | Low |
| 7 | Cosmetics | Default | Themes, name colors, reaction packs | Medium |
| 8 | Sponsored rooms | n/a | Brands and colleges rent a branded room | Low, later |

Dropped from the headline list: verified badge, extended chat timer, read receipts. Keep them as small bundle extras only if cheap.

Not building: re-find (stalking risk, hurts the brand), location matching (contradicts anonymity), games.

## 3. Pricing

Fixed-duration passes first. No auto-renew until 10 paid users ask for it.

| Pass | India | International |
|---|---|---|
| Day | ₹19 | $0.99 |
| Week | ₹49 | $1.99 |
| Month | ₹99 | $4.99 |
| Year | ₹699 | $29.99 |

Rules: show the real price once, no fake "was" prices, say plainly what free users still get. Test ₹99 vs ₹149 monthly before locking it.

## 4. Product rules for paid features

- The server decides. Never gate on the client. The webhook is the only thing that grants access.
- Gender filter is soft: "prefer", then fall back to anyone after about 20 seconds. Gender is self-declared and unverified, so a hard promise causes refunds.
- Ads never appear mid-chat. Any ad vendor needs a Privacy and Cookies update and a `TECH.md` note.
- 18+ gate before first purchase (checkbox plus date of birth, no paid KYC).
- Refund policy page before launch: day pass non-refundable, others 7 days if unused.
- Paid filters attract bad actors. Reporting and ban flow must be solid before Phase C ships.

## 5. Payment provider decision

### Options considered

| Provider | Fit | Cost (verify current rates on signup) | Verdict |
|---|---|---|---|
| **Razorpay** | UPI, cards, netbanking, wallets for India. Good docs, webhooks, test mode | No setup or monthly fee. About 2% per transaction plus GST, no fee on failed payments | **Use for India** |
| Cashfree | Similar to Razorpay, often cheaper on UPI | No setup fee, similar per-transaction cut | Fallback if Razorpay KYC or fees disappoint |
| Stripe | Strong globally | Hard to open for Indian businesses without an invite | Not now |
| Lemon Squeezy or Paddle | Merchant of record: handles international tax and VAT for you | About 5% plus 50 cents per sale | **Use later for international** |
| App stores | Native only | 15 to 30% | Never, stay on the web |

### Decision

1. **India: Razorpay Orders (one-time payments), not Subscriptions.** A pass is a fixed number of days. This avoids UPI AutoPay mandates, failed renewals, dunning and cancel flows. It is also the most reliable setup: one order, one webhook, one `expiresAt`.
2. **International: skip until Indian revenue exists**, then add Lemon Squeezy or Paddle so VAT and sales tax are not our problem. Until then, international users see the India price in INR on the Razorpay checkout (cards work) or a "not available yet" note.
3. **Cost stays $0 fixed.** We only pay a percentage of real sales. This fits `product-and-cost.mdc` once the approval note (TECH.md D19) is merged.
4. **Keep the provider behind one seam** (`services/payments/`) so swapping Razorpay for Cashfree touches one folder.

### Money flow

```
Client: pick pass -> POST /api/payments/order {planId}
Server: create Razorpay order (amount from OUR price table, never from the client)
        save PaymentOrder {user, planId, orderId, status: 'created'}
Client: Razorpay Checkout (UPI / card) -> pays
Razorpay -> POST /api/payments/webhook   (verify X-Razorpay-Signature with the raw body)
Server: on payment.captured, mark order paid, extend Subscription.expiresAt (idempotent on paymentId)
Client: refetches /api/me/entitlements -> UI unlocks
```

Never trust the checkout success callback from the browser. Only the signed webhook grants a pass. Also add a "verify payment" endpoint the client calls after checkout, which asks Razorpay for the order status, so a delayed webhook does not leave a paid user locked out.

## 6. Data model

```ts
// Subscription (Mongo): one doc per user
{ user, planId: 'day'|'week'|'month'|'year', expiresAt: Date, source: 'razorpay'|'admin', createdAt }

// PaymentOrder (Mongo): one doc per checkout attempt
{ user, planId, amountPaise, currency, razorpayOrderId, razorpayPaymentId?, status: 'created'|'paid'|'failed'|'refunded', createdAt }
// unique index on razorpayPaymentId so a retried webhook cannot extend twice
```

`hasPass(userId)` is `expiresAt > now`. Extending a pass adds days to `max(now, current expiresAt)` so early renewals do not lose time.

## 7. Phases

### Phase A: the gate. DONE
- [x] `Subscription` model, repository, `hasPass()` in `services/user/entitlements.ts`
- [x] Each paid action checks `hasPass()` on the server (match join, socket queue entry, private rooms)
- [x] `GET /api/payments/me` and `useEntitlementsQuery()` / `useHasPass()` on the client
- [x] Admin grant and revoke: `POST/DELETE /api/admin/users/:id/pass`
- [-] Daily whisper cap: dropped. The cap was removed from the product on Oct 30 (commit 953fc52), so there is nothing to lift. Do not bring it back just to sell it
- [x] Tests: `payments.test.ts`, `preference.test.ts`, `payments.integration.test.ts` (needs `MONGO_TEST_URI`)

### Phase B: first money. Code DONE, needs your Razorpay account
- [ ] Razorpay account and KYC (start early, approval can take days). Runbook: `RUNBOOK.md` > Payments
- [x] `services/payments/` (create order, verify checkout signature, verify webhook signature)
- [x] `PaymentOrder` model, `POST /api/payments/order`, `/confirm`, `/webhook` (raw body, signed)
- [x] Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Buying is OFF until all three are set
- [x] Helmet CSP allows `checkout.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com`
- [x] Pricing page with real prices, plan picker, status, every error state (`features/pass`)
- [x] Terms and Privacy updated. Refund wording is a first draft: get it checked before launch
- [x] Tests: signature checks, idempotent replay, wrong amount, someone else's order, retry after a failed grant

### Phase C: what people pay for
- [x] Gender preference with 20 second soft fallback (`services/match/preference.ts`)
- [-] Country preference: removed. Use vibe tags for region or scene instead
- [x] Priority: a pass holder wins ties between equally good matches. It is a tie-break, not a queue jump, because matching is instant when anyone waits
- [x] Ads: Google AdSense, waiting screen and thread-ended screen only, consent first, non-personalised, hidden for pass holders (`features/ads`, `services/ads.ts`, TECH.md D20). Off until `ADSENSE_*` env is set. Needs an approved AdSense account (see RUNBOOK "Ads")
- [x] Boosts: consumable credits (1 for ₹9, 5 for ₹29). One credit = 30 minutes at the front of the line (ahead of vibe score, never ahead of a gender someone asked for). Anyone signed in can buy, no pass needed. `BoostWallet` model, `services/boost.ts`, `POST /api/payments/boost/activate`, a Redis key per running boost that expires itself. Honest limit: with a small queue matching is already instant, so a boost mostly matters once several people wait
- [x] Private rooms behind a pass: creating one needs a live pass (`entitlements.ts`), trust no longer qualifies. Existing rooms keep running if the pass lapses

### Phase D: after ~10,000 monthly users
- [ ] Cosmetics, sponsored rooms
- [ ] International checkout (Lemon Squeezy or Paddle)
- [ ] Optional auto-renew via Razorpay Subscriptions
- [ ] Paid moderation tooling

## 8. Metrics to watch

Free to paid conversion (target 1 to 3%), day-7 retention, sessions per user per day, cap-hit rate (how many users hit the daily limit, and how many of them buy), refund rate, pass revenue per 1,000 sessions, ad revenue per 1,000 sessions. Use the existing self-hosted analytics endpoint. No paid analytics.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Not enough traffic | Do Phase A and B only; spend the rest of the time on growth and retention |
| Abuse around paid filters | Reports, bans and the trust ladder ship before Phase C |
| Webhook missed or delayed | Verify endpoint plus a nightly reconcile of `created` orders older than 1 hour |
| Duplicate webhook grants twice | Unique index on `razorpayPaymentId`, idempotent handler |
| Legal (DPDP Act, age, refunds) | Counsel pass in `LEGAL_BRIEF.md` before Phase B goes live |
| Razorpay account held or rejected | Cashfree as the fallback behind the same `services/payments/` seam |

## 10. Open decisions

- [ ] India only at launch, or English-speaking markets too
- [ ] Final price points after a two-week test
