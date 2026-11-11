import type { RequestHandler } from 'express';
import * as payments from '../services/payments/index.js';
import { activateBoost } from '../services/boost.js';
import { getEntitlements } from '../services/user/entitlements.js';
import type { CheckoutProof, ProductId } from '../types/subscription.js';
import { catchAsync } from '../utils/catchAsync.js';

/** GET /api/payments/plans: public. Prices, plus whether buying is switched on. */
export const getPlansController: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true, data: payments.listPlans() });
};

/** GET /api/payments/me: what this account's pass looks like right now. */
export const getEntitlementsController: RequestHandler = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await getEntitlements(req.userId!) });
});

/** POST /api/payments/order: start a checkout for one plan. */
export const createOrderController: RequestHandler = catchAsync(async (req, res) => {
  const { planId } = req.body as { planId: ProductId };
  res.status(201).json({ success: true, data: await payments.createOrder(req.userId!, planId) });
});

/** POST /api/payments/confirm: the browser's proof of payment, verified server-side. */
export const confirmPaymentController: RequestHandler = catchAsync(async (req, res) => {
  const data = await payments.confirmCheckout(req.userId!, req.body as CheckoutProof);
  res.status(200).json({ success: true, data });
});

/** POST /api/payments/boost/activate: spend one boost credit now. */
export const activateBoostController: RequestHandler = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await activateBoost(req.userId!) });
});

/**
 * POST /api/payments/webhook: Razorpay -> us. No cookie auth: the signature over the
 * RAW body is the credential. A 4xx stops the provider retrying (bad signature); a
 * 5xx makes it retry (our grant failed), which is exactly what we want.
 */
export const webhookController: RequestHandler = catchAsync(async (req, res) => {
  await payments.handleWebhook(
    (req as typeof req & { rawBody?: Buffer }).rawBody,
    req.header('x-razorpay-signature')
  );
  res.status(200).json({ success: true });
});
