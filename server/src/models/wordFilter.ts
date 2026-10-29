import mongoose, { Schema, model } from 'mongoose';

/**
 * The blocked-word settings: one document (`key: 'main'`) holding the master switch
 * and, per category, its switch and term list. Absent = built-in defaults, all on.
 */
export type IWordFilter = {
  key: 'main';
  enabled: boolean;
  categories: Array<{ id: string; enabled: boolean; terms: string[] }>;
};

const wordFilterSchema = new Schema<IWordFilter>(
  {
    key: { type: String, enum: ['main'], default: 'main', unique: true },
    enabled: { type: Boolean, default: true },
    categories: [
      new Schema({ id: String, enabled: Boolean, terms: [String] }, { _id: false }),
    ],
  },
  { timestamps: true }
);

export const WordFilter =
  (mongoose.models.WordFilter as mongoose.Model<IWordFilter> | undefined) ||
  model<IWordFilter>('WordFilter', wordFilterSchema);
