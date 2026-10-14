import mongoose, { Schema, model } from 'mongoose';
import type { IMemeBlock } from '../types/memeBlock.js';

/**
 * Persistent meme blocklist + report counters. One row per (source,
 * externalId): reports accumulate here and auto-block at a threshold; admins
 * can also block outright. `services/memes/blocklist.ts` caches the blocked
 * ids in memory for the feed hot path.
 */
const memeBlockSchema = new Schema<IMemeBlock>(
  {
    externalId: { type: Number, required: true },
    source: { type: String, enum: ['jokeapi'], required: true },
    reports: { type: Number, default: 0 },
    blocked: { type: Boolean, default: false },
    reason: { type: String, maxlength: 200 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

memeBlockSchema.index({ source: 1, externalId: 1 }, { unique: true });
memeBlockSchema.index({ blocked: 1 });

export const MemeBlock =
  (mongoose.models.MemeBlock as mongoose.Model<IMemeBlock> | undefined) ||
  model<IMemeBlock>('MemeBlock', memeBlockSchema);
