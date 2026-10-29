import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export type IMemeSaveFields = {
  user: Types.ObjectId;
  /** Content source — only 'jokeapi' today; the field keeps multi-source honest. */
  source: string;
  /** Provider-side id (JokeAPI numeric id). */
  externalId: number;
  createdAt: Date;
};

export type IMemeSave = IMemeSaveFields & Document;

/**
 * Member-synced meme saves. Guests keep saves on-device (localStorage);
 * members get this tiny collection so saves survive browsers. One row per
 * (user, source, externalId) — save is idempotent by construction.
 */
const memeSaveSchema = new Schema<IMemeSave>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, required: true },
    externalId: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

memeSaveSchema.index({ user: 1, source: 1, externalId: 1 }, { unique: true });
memeSaveSchema.index({ user: 1, createdAt: -1 });

export const MemeSave =
  (mongoose.models.MemeSave as mongoose.Model<IMemeSave> | undefined) ||
  model<IMemeSave>('MemeSave', memeSaveSchema);
