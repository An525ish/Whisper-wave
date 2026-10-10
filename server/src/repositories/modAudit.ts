import { ModAudit } from '../models/modAudit.js';
import type { ModAuditFields } from '../models/modAudit.js';

export type LogModActionInput = Omit<ModAuditFields, 'createdAt'>;

/** Newest first, bounded — the admin audit view. */
export const listAudit = async (limit = 100): Promise<ModAuditFields[]> =>
  ModAudit.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<ModAuditFields[]>();

export const create = async (input: LogModActionInput): Promise<void> => {
  await ModAudit.create(input);
};
