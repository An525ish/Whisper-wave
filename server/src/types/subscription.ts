import type { Types } from 'mongoose';

export type PlanId = 'day' | 'week' | 'month' | 'year';

export type BoostPackId = 'boost1' | 'boost5';

/** Anything sold through checkout: a pass length or a boost pack. */
export type ProductId = PlanId | BoostPackId;

export type BoostPack = {
  id: BoostPackId;
  label: string;
  credits: number;
  amountPaise: number;
};

export type PassSource = 'razorpay' | 'admin';

export type PassPlan = {
  id: PlanId;
  label: string;
  days: number;
  amountPaise: number;
};

export type ISubscriptionFields = {
  user: Types.ObjectId;
  planId: PlanId;
  expiresAt: Date;
  source: PassSource;
  updatedAt: Date;
};

export type PaymentStatus = 'created' | 'paid' | 'failed';

export type IPaymentOrderFields = {
  user: Types.ObjectId;
  /** A pass plan or a boost pack id (the field kept its name so old orders still read). */
  planId: ProductId;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  createdAt: Date;
  paidAt?: Date;
};

/** What the client needs to know about an account's pass. */
export type Entitlements = {
  pass: { active: boolean; planId: PlanId | null; expiresAt: string | null };
  /** Unused boosts, and when the running one ends (null when none is running). */
  boost: { credits: number; activeUntil: string | null };
};

export type IBoostWalletFields = {
  user: Types.ObjectId;
  credits: number;
  activeUntil: Date | null;
};

/** `GET /api/payments/plans` payload. */
export type PlansResponse = {
  /** False until Razorpay keys are configured; the client hides Buy buttons. */
  enabled: boolean;
  keyId: string | null;
  currency: string;
  plans: PassPlan[];
  boosts: BoostPack[];
  /** How long one boost lasts. */
  boostMinutes: number;
};

export type CreatedOrder = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  planId: ProductId;
};

/** The three fields Razorpay Checkout hands back on success. */
export type CheckoutProof = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
