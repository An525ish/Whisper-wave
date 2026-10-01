import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IPendingConnectionFields, PendingConnectionSide } from '../types/match.js';

export type IPendingConnection = IPendingConnectionFields & Document;

const sideSchema = new Schema<PendingConnectionSide>(
  {
    anonId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    displayName: { type: String, required: true },
    vibeTags: { type: [String], default: [] },
  },
  { _id: false }
);

const pendingConnectionSchema = new Schema<IPendingConnection>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    sides: {
      type: [sideSchema],
      required: true,
      validate: [(v: unknown[]) => v.length === 2, 'sides must have exactly 2 entries'],
    },
    status: {
      // NOTE: 'expired' is retained for documents that were TTL-reaped before
      // the expiresAt index existed. New documents are simply deleted by TTL.
      type: String,
      enum: ['pending', 'processing', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

// Compound index to find by sessionId + status quickly in the completion flow.
pendingConnectionSchema.index({ sessionId: 1, status: 1 });

export const PendingConnection =
  (mongoose.models.PendingConnection as mongoose.Model<IPendingConnection> | undefined) ||
  model<IPendingConnection>('PendingConnection', pendingConnectionSchema);
