import { AppError } from '../../utils/AppError.js';
import * as pendingRepo from '../../repositories/pendingConnection.js';
import { deleteClaim, listClaims, peekClaim } from '../match/claim.js';
import { TTL } from '../match/keys.js';
import { logger } from '../../utils/logger.js';
import type { PendingConnectionItem } from '../../types/connection.js';

/**
 * Everything this account still owes a whisper connection — or is owed.
 *
 * Two sources, one list: Redis claims on this browser's `anonId` (my turn to
 * act, one per session) plus Mongo rows where I am bound and the partner is not (waiting for
 * them). Copy is neutral on purpose: the client never learns whether the
 * other side has an account.
 */
export const listPendingForUser = async (
  userId: string,
  callerAnonId: string | undefined
): Promise<PendingConnectionItem[]> => {
  const items: PendingConnectionItem[] = [];

  if (callerAnonId) {
    const claims = await listClaims(callerAnonId);
    // A claim whose session already has this account's seat bound is spent
    // (token path, or a redeem whose cleanup failed) — hide it and sweep it.
    const spent = new Set(
      await pendingRepo.findSessionIdsBoundToUser(
        userId,
        claims.map((c) => c.sessionId)
      )
    );
    for (const claim of claims) {
      if (spent.has(claim.sessionId)) {
        await deleteClaim(callerAnonId, claim.sessionId).catch((err: unknown) =>
          logger.warn({ err, sessionId: claim.sessionId }, 'Failed to sweep spent claim')
        );
        continue;
      }
      const partnerSide = claim.seat === 0 ? 1 : 0;
      items.push({
        id: `claim:${claim.sessionId}`,
        sessionId: claim.sessionId,
        origin: {
          partnerAlias: claim.originNames[partnerSide],
          tags: claim.originTags[partnerSide],
        },
        expiresAt: new Date(claim.createdAt + TTL.claim * 1000).toISOString(),
        state: 'action_needed',
      });
    }
  }

  const rows = await pendingRepo.findWaitingForUser(userId);
  for (const row of rows) {
    const mine = row.sides[0].userId?.toString() === userId ? 0 : 1;
    const partner = row.sides[mine === 0 ? 1 : 0];
    items.push({
      id: `pending:${row.sessionId}`,
      sessionId: row.sessionId,
      origin: { partnerAlias: partner.displayName, tags: partner.vibeTags },
      expiresAt: row.expiresAt.toISOString(),
      state: 'waiting_for_partner',
    });
  }

  return items;
};

/**
 * Cancel one pending item. A claim is deleted outright; a Mongo row releases
 * only my seat — the partner's side is left to expire, and they get no signal.
 */
export const cancelPending = async (
  id: string,
  userId: string,
  callerAnonId: string | undefined
): Promise<void> => {
  const separator = id.indexOf(':');
  const kind = separator === -1 ? '' : id.slice(0, separator);
  const sessionId = separator === -1 ? '' : id.slice(separator + 1);

  if (kind === 'claim') {
    if (!callerAnonId) throw new AppError(404, 'Pending connection not found');
    const claim = await peekClaim(callerAnonId, sessionId);
    if (!claim) throw new AppError(404, 'Pending connection not found');
    await deleteClaim(callerAnonId, sessionId);
    return;
  }

  if (kind === 'pending') {
    const released = await pendingRepo.unbindUser(sessionId, userId);
    if (!released) throw new AppError(404, 'Pending connection not found');
    return;
  }

  throw new AppError(404, 'Pending connection not found');
};
