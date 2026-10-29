import { logger } from '../utils/logger.js';
import * as modAuditRepo from '../repositories/modAudit.js';
import type { LogModActionInput } from '../repositories/modAudit.js';

/**
 * The moderation audit trail — who did what, to whom, where.
 *
 * Best-effort by design: the trail must never break the action it records,
 * so every write is fire-and-forget with a warning on failure. Reads go
 * straight to the repository (admin surface).
 */
export const auditModAction = (input: LogModActionInput): void => {
  void modAuditRepo.create(input).catch((err: unknown) =>
    logger.warn({ err, action: input.action }, 'Failed to record moderation audit')
  );
};

export const listAuditTrail = async (limit = 100) => modAuditRepo.listAudit(limit);
