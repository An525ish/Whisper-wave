import { z } from 'zod';
import { env } from '../../config/env.js';
import { BOOST_MS, BOOST_PACKS, DAY_MS, PASS_PLANS, PLAN_CURRENCY, findBoostPack, findPlan } from '../../constants/plans.js';
import * as orderRepo from '../../repositories/paymentOrder.js';
import * as boostRepo from '../../repositories/boostWallet.js';
import * as subscriptionRepo from '../../repositories/subscription.js';
import * as userRepo from '../../repositories/user.js';
import type { CheckoutProof, CreatedOrder, Entitlements, PlanId, PlansResponse, ProductId } from '../../types/subscription.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { getEntitlements } from '../user/entitlements.js';
import {
  createProviderOrder,
  isRazorpayConfigured,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from './razorpay.js';

const OFF = new AppError(503, "Payments aren't available yet.");

export const listPlans = (): PlansResponse => {
  const enabled = isRazorpayConfigured();
  return {
    enabled,
    keyId: enabled ? env.RAZORPAY_KEY_ID : null,
    currency: PLAN_CURRENCY,
    plans: [...PASS_PLANS],
    boosts: [...BOOST_PACKS],
    boostMinutes: BOOST_MS / 60_000,
  };
};

/** Start a checkout. The amount comes from OUR table, never from the client. */
export const createOrder = async (userId: string, planId: ProductId): Promise<CreatedOrder> => {
  if (!isRazorpayConfigured()) throw OFF;
  const plan = findPlan(planId) ?? findBoostPack(planId);
  if (!plan) throw new AppError(400, 'Unknown plan');

  const order = await createProviderOrder({
    amountPaise: plan.amountPaise,
    currency: PLAN_CURRENCY,
    // Razorpay caps receipts at 40 chars.
    receipt: `ww_${Date.now().toString(36)}_${userId.slice(-8)}`,
    notes: { userId, planId },
  });
  await orderRepo.create({
    user: userId,
    planId,
    amountPaise: plan.amountPaise,
    currency: PLAN_CURRENCY,
    razorpayOrderId: order.id,
  });
  return {
    orderId: order.id,
    amountPaise: plan.amountPaise,
    currency: PLAN_CURRENCY,
    keyId: env.RAZORPAY_KEY_ID,
    planId,
  };
};

export type GrantOutcome = 'granted' | 'already_granted' | 'unknown_order' | 'amount_mismatch';

/**
 * Turn one paid provider order into pass days, exactly once.
 *
 * Both the signed webhook and the browser's verify call land here. `markPaid` is
 * an atomic created->paid transition, so only one of them wins; the loser gets
 * `already_granted`. If the grant itself fails we revert the order to `created`
 * and rethrow, so the provider's next webhook retry can try again instead of the
 * payment being stuck paid-but-ungranted.
 */
export const grantForOrder = async (
  orderId: string,
  paymentId: string,
  paid?: { amountPaise: number; currency: string }
): Promise<GrantOutcome> => {
  const order = await orderRepo.findByProviderOrderId(orderId);
  if (!order) {
    logger.warn({ orderId }, 'Payment for an order we did not create');
    return 'unknown_order';
  }
  if (paid && (paid.amountPaise !== order.amountPaise || paid.currency !== order.currency)) {
    logger.error({ orderId, paid, expected: order.amountPaise }, 'Paid amount does not match the order');
    return 'amount_mismatch';
  }
  const claimed = await orderRepo.markPaid(orderId, paymentId);
  if (!claimed) return 'already_granted';

  const plan = findPlan(claimed.planId);
  const pack = findBoostPack(claimed.planId);
  if (!plan && !pack) {
    await orderRepo.revertToCreated(orderId);
    throw new AppError(500, 'Order has an unknown plan');
  }
  try {
    if (plan) await subscriptionRepo.extend(String(claimed.user), plan.id, plan.days * DAY_MS, 'razorpay');
    else await boostRepo.addCredits(String(claimed.user), pack!.credits);
  } catch (err) {
    await orderRepo.revertToCreated(orderId).catch((e: unknown) =>
      logger.error({ e, orderId }, 'Could not revert a failed grant: reconcile by hand')
    );
    throw err;
  }
  logger.info({ orderId, product: claimed.planId }, 'Purchase granted');
  return 'granted';
};

/**
 * The browser says "I paid". Believe it only after the signature checks out AND
 * the order is this account's. This is what saves a user from a slow webhook.
 */
export const confirmCheckout = async (userId: string, proof: CheckoutProof): Promise<Entitlements> => {
  if (!isRazorpayConfigured()) throw OFF;
  if (!verifyCheckoutSignature(proof.razorpay_order_id, proof.razorpay_payment_id, proof.razorpay_signature)) {
    throw new AppError(400, "We couldn't verify that payment.");
  }
  const order = await orderRepo.findByProviderOrderId(proof.razorpay_order_id);
  if (!order || String(order.user) !== userId) throw new AppError(404, 'Order not found');
  await grantForOrder(proof.razorpay_order_id, proof.razorpay_payment_id);
  return getEntitlements(userId);
};

const webhookSchema = z.object({
  event: z.string(),
  payload: z
    .object({
      payment: z.object({ entity: z.object({ id: z.string(), order_id: z.string().nullish(), amount: z.number(), currency: z.string() }) }).optional(),
    })
    .optional(),
});

/**
 * Razorpay webhook. Returns normally for anything we deliberately ignore (so the
 * provider stops retrying) and throws only for things worth retrying.
 */
export const handleWebhook = async (raw: Buffer | undefined, signature: string | undefined): Promise<void> => {
  if (!isRazorpayConfigured()) throw OFF;
  if (!raw || !signature || !verifyWebhookSignature(raw, signature)) {
    throw new AppError(400, 'Invalid signature');
  }
  const parsed = webhookSchema.safeParse(JSON.parse(raw.toString('utf8')));
  if (!parsed.success) return;
  const { event, payload } = parsed.data;
  // `payment.captured` and `order.paid` both carry the payment entity.
  if (event !== 'payment.captured' && event !== 'order.paid') return;
  const payment = payload?.payment?.entity;
  if (!payment?.order_id) return;
  await grantForOrder(payment.order_id, payment.id, { amountPaise: payment.amount, currency: payment.currency });
};

/** Admin: give an account a pass without a payment (testing, support, giveaways). */
export const adminGrant = async (userId: string, planId: PlanId): Promise<Entitlements> => {
  const plan = findPlan(planId);
  if (!plan) throw new AppError(400, 'Unknown plan');
  if (!(await userRepo.findByIdLean(userId))) throw new AppError(404, 'User not found');
  await subscriptionRepo.extend(userId, plan.id, plan.days * DAY_MS, 'admin');
  return getEntitlements(userId);
};

export const adminRevoke = async (userId: string): Promise<Entitlements> => {
  if (!(await subscriptionRepo.expireNow(userId))) throw new AppError(404, 'That account has no pass');
  return getEntitlements(userId);
};
