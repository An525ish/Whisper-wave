import { MemeBlock } from '../models/memeBlock.js';
import type { MemeBlockFields, MemeBlockSource } from '../types/memeBlock.js';

type MemeBlockLean = MemeBlockFields & { _id: unknown };

/** Atomic report increment (upsert). Returns the row after the increment. */
export const recordReport = async (
  externalId: number,
  source: MemeBlockSource,
  reason: string
): Promise<MemeBlockFields> => {
  const doc = await MemeBlock.findOneAndUpdate(
    { source, externalId },
    {
      $inc: { reports: 1 },
      $set: { reason, updatedAt: new Date() },
      $setOnInsert: { source, externalId, blocked: false },
    },
    { upsert: true, returnDocument: 'after' }
  ).lean<MemeBlockLean>();
  if (!doc) throw new Error('MemeBlock upsert returned no document');
  return doc;
};

/** Idempotent block (upsert) — admin add, or the report threshold tripping. */
export const setBlocked = async (
  externalId: number,
  source: MemeBlockSource,
  reason?: string
): Promise<void> => {
  await MemeBlock.updateOne(
    { source, externalId },
    {
      $set: { blocked: true, updatedAt: new Date(), ...(reason ? { reason } : {}) },
      $setOnInsert: { source, externalId, reports: 0 },
    },
    { upsert: true }
  );
};

/** Un-block and reset the counter. Returns false when it was not blocked. */
export const clearBlocked = async (
  externalId: number,
  source: MemeBlockSource
): Promise<boolean> => {
  const doc = await MemeBlock.findOneAndUpdate(
    { source, externalId, blocked: true },
    { $set: { blocked: false, reports: 0, updatedAt: new Date() } }
  ).lean<MemeBlockLean>();
  return doc !== null;
};

export const listBlockedIds = async (source: MemeBlockSource, limit: number): Promise<number[]> => {
  const rows = await MemeBlock.find({ source, blocked: true }, { externalId: 1 })
    .limit(limit)
    .lean<Array<{ externalId: number }>>();
  return rows.map((r) => r.externalId);
};

/** Admin view: blocked first, then most-reported, newest first. */
export const listForAdmin = async (limit: number): Promise<MemeBlockFields[]> =>
  MemeBlock.find({})
    .sort({ blocked: -1, reports: -1, updatedAt: -1 })
    .limit(limit)
    .lean<MemeBlockLean[]>();
