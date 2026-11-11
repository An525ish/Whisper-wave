import { z } from 'zod';
import { objectIdField } from './fields.js';

const planId = z.enum(['day', 'week', 'month', 'year'], { error: 'Pick a plan' });

const productId = z.enum(['day', 'week', 'month', 'year', 'boost1', 'boost5'], { error: 'Pick something to buy' });

export const createOrderSchema = z.object({ planId: productId });

/** The three values Razorpay Checkout returns. Lengths are bounded, shapes are checked by HMAC. */
export const confirmPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(128),
});

export const adminGrantPassSchema = z.object({ planId });

export const adminPassParamsSchema = z.object({ id: objectIdField });
