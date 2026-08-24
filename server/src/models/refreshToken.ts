import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export type IRefreshToken = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
} & Document;

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB TTL index auto-deletes expired tokens — no cron job needed
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken =
  (mongoose.models.RefreshToken as mongoose.Model<IRefreshToken> | undefined) ||
  model<IRefreshToken>('RefreshToken', refreshTokenSchema);
