import mongoose, { Schema, model } from 'mongoose';
import type { IConnectionFields } from '../types/match.js';

const connectionSchema = new Schema<IConnectionFields>(
  {
    // Exactly two users — enforced at the service layer too.
    users: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [(v: unknown[]) => v.length === 2, 'users must have exactly 2 entries'],
    },
    // Order-independent unique key for the pair. This is what enforces "one
    // connection per pair" — a `unique` index on the `users` array would be a
    // multikey index and wrongly forbid a user from ever having two connections.
    pairKey: { type: String, required: true, unique: true },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    // The Redis roomId — kept for the "how we met" origin story.
    originAnonSession: { type: String, required: true },
    // Vibe names used during the anonymous session.
    originNames: {
      type: [String],
      required: true,
      validate: [(v: unknown[]) => v.length === 2, 'originNames must have exactly 2 entries'],
    },
    originVibeTags: {
      type: [[String]],
      required: true,
      validate: [(v: unknown[]) => v.length === 2, 'originVibeTags must have exactly 2 entries'],
    },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Non-unique multikey index for "find all connections for a user" lookups.
connectionSchema.index({ users: 1 });

export const Connection =
  (mongoose.models.Connection as
    | mongoose.Model<IConnectionFields>
    | undefined) || model<IConnectionFields>('Connection', connectionSchema);
