import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IPaymentOrderFields } from '../types/subscription.js';

export type IPaymentOrder = IPaymentOrderFields & Document;

/** One row per checkout attempt. The provider order id is the join key for webhooks. */
const paymentOrderSchema = new Schema<IPaymentOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: String, enum: ['day', 'week', 'month', 'year', 'boost1', 'boost5'], required: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    // Sparse unique: a payment id can only ever belong to one order, so a replayed
    // webhook cannot grant twice even across two order rows.
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    paidAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PaymentOrder =
  (mongoose.models.PaymentOrder as mongoose.Model<IPaymentOrder> | undefined) ||
  model<IPaymentOrder>('PaymentOrder', paymentOrderSchema);
