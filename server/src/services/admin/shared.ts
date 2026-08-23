import { timingSafeEqual } from 'node:crypto';
import * as messageRepo from '../../repositories/message.js';
import type {
  AdminActivityEvent,
  AdminActivityMessage,
  AdminActivitySignup,
  AdminUserListItem,
} from '../../types/admin.js';
import { AppError } from '../../utils/AppError.js';

export const ONLINE_AVATAR_LIMIT = 12;

export const secretsEqual = (provided: string, expected: string): boolean => {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
};

export const parseBeforeCursor = (before?: string): Date | undefined => {
  if (!before) return undefined;
  const date = new Date(before);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Invalid cursor');
  }
  return date;
};

export const toMessageEvent = (
  row: Awaited<ReturnType<typeof messageRepo.listRecentForActivity>>[number]
): AdminActivityEvent => {
  const createdAt = row.createdAt ? new Date(row.createdAt) : new Date(0);
  return {
    kind: 'message',
    data: row as unknown as AdminActivityMessage,
    ts: createdAt.getTime(),
  };
};

export const toSignupEvent = (row: AdminUserListItem): AdminActivityEvent => ({
  kind: 'signup',
  data: row as unknown as AdminActivitySignup,
  ts: new Date(row.createdAt).getTime(),
});

export const cursorFromEvents = (events: AdminActivityEvent[]): string | null => {
  const last = events[events.length - 1];
  if (!last) return null;
  return new Date(last.ts).toISOString();
};
