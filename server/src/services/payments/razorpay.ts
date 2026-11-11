import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

/**
 * Razorpay, kept behind this one file so swapping providers (Cashfree) touches
 * nothing else. Plain `fetch` + `crypto`: no SDK dependency (D19).
 */
const API = 'https://api.razorpay.com/v1';
const TIMEOUT_MS = 10_000;

/** All three keys set = payments on. A partial config is treated as OFF, never half-on. */
export const isRazorpayConfigured = (): boolean =>
  Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);

/** Constant-time HMAC-SHA256 compare. Any malformed signature is simply a mismatch. */
export const hmacMatches = (data: string | Buffer, secret: string, signature: string): boolean => {
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(data).digest();
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/** Proof the browser got back from Checkout: HMAC(`orderId|paymentId`, key secret). */
export const verifyCheckoutSignature = (orderId: string, paymentId: string, signature: string): boolean =>
  hmacMatches(`${orderId}|${paymentId}`, env.RAZORPAY_KEY_SECRET, signature);

/** Webhook proof: HMAC of the RAW request body with the webhook secret. */
export const verifyWebhookSignature = (rawBody: Buffer, signature: string): boolean =>
  hmacMatches(rawBody, env.RAZORPAY_WEBHOOK_SECRET, signature);

export const createProviderOrder = async (params: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string }> => {
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    logger.error({ err }, 'Razorpay order request failed');
    throw new AppError(502, "Payments aren't responding. Try again in a minute.");
  }
  if (!res.ok) {
    // Never log the body of a failed auth call verbatim: keep the status only.
    logger.error({ status: res.status }, 'Razorpay rejected order creation');
    throw new AppError(502, "Payments aren't responding. Try again in a minute.");
  }
  const body = (await res.json()) as { id?: unknown };
  if (typeof body.id !== 'string') throw new AppError(502, "Payments aren't responding. Try again in a minute.");
  return { id: body.id };
};
