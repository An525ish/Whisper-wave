/** Spark Pass domain types. Mirrors server/src/types/subscription.ts. */

export type PlanId = 'day' | 'week' | 'month' | 'year';

export type BoostPackId = 'boost1' | 'boost5';

/** Anything sold through checkout. */
export type ProductId = PlanId | BoostPackId;

export type BoostPack = {
  id: BoostPackId;
  label: string;
  credits: number;
  amountPaise: number;
};

export type PassPlan = {
  id: PlanId;
  label: string;
  days: number;
  amountPaise: number;
};

/** `GET /payments/plans`. `enabled` is false until the server has Razorpay keys. */
export type PlansData = {
  enabled: boolean;
  keyId: string | null;
  currency: string;
  plans: PassPlan[];
  boosts: BoostPack[];
  boostMinutes: number;
};

export type Entitlements = {
  pass: { active: boolean; planId: PlanId | null; expiresAt: string | null };
  boost: { credits: number; activeUntil: string | null };
};

export type CreatedOrder = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  planId: ProductId;
};

/** What Razorpay Checkout hands back on success. Sent to the server to verify. */
export type CheckoutProof = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  prefill?: { name?: string; email?: string };
  handler: (proof: CheckoutProof) => void;
  modal: { ondismiss: () => void; confirm_close: boolean };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', cb: (res: { error?: { description?: string } }) => void) => void;
};

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;
