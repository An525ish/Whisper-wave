import mongoose, { Schema, model, type Document } from 'mongoose';
import type { FeatureOverrideFields } from '../types/hub.js';

export type IFeatureOverride = FeatureOverrideFields & Document;

/**
 * Runtime kill-switch overrides, one row per surface. Absent row = follow env.
 * Persisted so a restart never silently re-enables a surface an admin shut off.
 */
const featureOverrideSchema = new Schema<IFeatureOverride>(
  {
    feature: { type: String, enum: ['rooms', 'games', 'memes', 'privateRooms'], required: true, unique: true },
    enabled: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const FeatureOverride =
  (mongoose.models.FeatureOverride as mongoose.Model<IFeatureOverride> | undefined) ||
  model<IFeatureOverride>('FeatureOverride', featureOverrideSchema);
