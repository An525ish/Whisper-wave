import mongoose, { Schema, model } from 'mongoose';

/**
 * One row per photo sent in an anonymous chat. The photo itself lives in R2;
 * this row is what the admin panel lists and deletes (like main-chat media).
 * `anonId` is the sender's session identity, never shown to the other user.
 */
export type IAnonImage = {
  key: string;
  url: string;
  sessionId: string;
  anonId: string;
  /** Where it came from: an anonymous chat, or a reported room message. */
  source: 'anon' | 'room';
  roomSlug?: string;
  createdAt: Date;
};

const anonImageSchema = new Schema<IAnonImage>(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    anonId: { type: String, required: true },
    source: { type: String, enum: ['anon', 'room'], default: 'anon' },
    roomSlug: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AnonImage =
  (mongoose.models.AnonImage as mongoose.Model<IAnonImage> | undefined) ||
  model<IAnonImage>('AnonImage', anonImageSchema);
