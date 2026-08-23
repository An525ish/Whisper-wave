import * as messageRepo from '../../repositories/message.js';
import * as userRepo from '../../repositories/user.js';
import type {
  AdminActivityEventsPage,
  AdminActivityPresence,
} from '../../types/admin.js';
import type { AdminActivityEventsQuery } from '../../validators/admin.js';
import {
  getOnlineUserIds,
  getPresenceSize,
} from '../presence/index.js';
import {
  cursorFromEvents,
  ONLINE_AVATAR_LIMIT,
  parseBeforeCursor,
  toMessageEvent,
  toSignupEvent,
} from './shared.js';

export const getActivityPresence = async (): Promise<AdminActivityPresence> => {
  const onlineIds = getOnlineUserIds().slice(0, ONLINE_AVATAR_LIMIT);
  const rawOnlineUsers =
    onlineIds.length > 0
      ? await userRepo.findManyByIdsNameAvatar(onlineIds)
      : [];

  return {
    onlineCount: getPresenceSize(),
    onlineUsers: rawOnlineUsers as AdminActivityPresence['onlineUsers'],
  };
};

export const getActivityEvents = async (
  input: AdminActivityEventsQuery
): Promise<AdminActivityEventsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;

  if (input.type === 'messages') {
    const rows = await messageRepo.listRecentForActivity({ limit: fetchLimit, before });
    const events = rows.slice(0, limit).map(toMessageEvent);
    return {
      events,
      nextCursor: rows.length > limit ? cursorFromEvents(events) : null,
      hasMore: rows.length > limit,
    };
  }

  if (input.type === 'signups') {
    const rows = await userRepo.listRecentSignupsForActivity({ limit: fetchLimit, before });
    const events = rows.slice(0, limit).map(toSignupEvent);
    return {
      events,
      nextCursor: rows.length > limit ? cursorFromEvents(events) : null,
      hasMore: rows.length > limit,
    };
  }

  // Fetch generously from both collections and merge by timestamp.
  // We request `limit * 2 + 1` from each collection so that after merging
  // and slicing to `limit` we still reliably detect hasMore without
  // re-fetching, even when events cluster around the same timestamp.
  const bigFetch = limit * 2 + 1;
  const [messages, signups] = await Promise.all([
    messageRepo.listRecentForActivity({ limit: bigFetch, before }),
    userRepo.listRecentSignupsForActivity({ limit: bigFetch, before }),
  ]);

  const merged = [
    ...messages.map(toMessageEvent),
    ...signups.map(toSignupEvent),
  ].sort((a, b) => b.ts - a.ts);

  const events = merged.slice(0, limit);
  // hasMore is true when either collection still had rows beyond what we
  // returned, OR the merged result had more than limit items.
  const hasMore =
    merged.length > limit ||
    messages.length >= bigFetch ||
    signups.length >= bigFetch;

  // Cursor is the timestamp of the *oldest* event on this page. Using strict
  // `$lt` means the next page won't replay it even at millisecond ties.
  return {
    events,
    nextCursor: hasMore ? cursorFromEvents(events) : null,
    hasMore,
  };
};
