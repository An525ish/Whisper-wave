import { PaymentOrder } from '../models/paymentOrder.js';
import type { IPaymentOrderFields } from '../types/subscription.js';

export type PaymentOrderLean = IPaymentOrderFields & { _id: unknown };

export const create = async (
  input: Pick<IPaymentOrderFields, 'planId' | 'amountPaise' | 'currency' | 'razorpayOrderId'> & { user: string }
): Promise<void> => {
  await PaymentOrder.create(input);
};

export const findByProviderOrderId = async (orderId: string): Promise<PaymentOrderLean | null> =>
  PaymentOrder.findOne({ razorpayOrderId: orderId }).lean<PaymentOrderLean>();

/**
 * Atomically move `created` -> `paid`. Returns the order only for the ONE caller
 * that made the transition, so webhook retries and the browser verify call can
 * race freely and still grant exactly once. Returns null for everyone else.
 */
export const markPaid = async (
  orderId: string,
  paymentId: string,
  now: Date = new Date()
): Promise<PaymentOrderLean | null> =>
  PaymentOrder.findOneAndUpdate(
    { razorpayOrderId: orderId, status: 'created' },
    { $set: { status: 'paid', razorpayPaymentId: paymentId, paidAt: now } },
    { returnDocument: 'after' }
  ).lean<PaymentOrderLean>();

/** Undo `markPaid` when the grant that should follow it failed, so a retry can grant. */
export const revertToCreated = async (orderId: string): Promise<void> => {
  await PaymentOrder.updateOne(
    { razorpayOrderId: orderId, status: 'paid' },
    { $set: { status: 'created' }, $unset: { razorpayPaymentId: '', paidAt: '' } }
  );
};
