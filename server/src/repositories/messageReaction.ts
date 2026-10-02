import type { Types } from 'mongoose';
import { Message } from '../models/message.js';
import type { MessageReactionDb } from '../types/message.js';

/**
 * Persistence for the message `reactions` sub-document.
 *
 * Split out from `repositories/message.ts` by concern, not by collection: the
 * reaction toggle is the one write path on a message that has to reason about
 * arrayFilters and prune-empty-entries, and it needs none of the pagination,
 * search, receipts or admin-listing machinery that file has grown into.
 */

/** The two fields the toggle reads: which chat the message is in, and its reactions. */
export type ReactionState = {
  chat: Types.ObjectId;
  reactions?: MessageReactionDb[];
};

export const findReactionState = async (id: string): Promise<ReactionState | null> =>
  Message.findById(id).select('reactions chat').lean<ReactionState>();

/** Drop one user from the entry for `emoji`. Leaves the entry itself in place. */
export const pullUserFromEmoji = async (
  id: string,
  emoji: string,
  userId: string
): Promise<void> => {
  await Message.updateOne(
    { _id: id },
    { $pull: { 'reactions.$[elem].users': userId } },
    { arrayFilters: [{ 'elem.emoji': emoji }] }
  );
};

/**
 * Remove the entry for `emoji` outright.
 *
 * Callers must invoke this only once the entry has no users left — an orphaned
 * `{ emoji, users: [] }` renders as a reaction bubble nothing can ever toggle.
 */
export const pruneEmoji = async (id: string, emoji: string): Promise<void> => {
  await Message.updateOne({ _id: id }, { $pull: { reactions: { emoji } } });
};

/** Add one user to the existing entry for `emoji`. No-op if the entry is absent. */
export const addUserToEmoji = async (
  id: string,
  emoji: string,
  userId: string
): Promise<void> => {
  await Message.updateOne(
    { _id: id },
    { $addToSet: { 'reactions.$[elem].users': userId } },
    { arrayFilters: [{ 'elem.emoji': emoji }] }
  );
};

/** Create the entry for `emoji` holding its first user. */
export const pushEmojiWithUser = async (
  id: string,
  emoji: string,
  userId: string
): Promise<void> => {
  await Message.updateOne({ _id: id }, { $push: { reactions: { emoji, users: [userId] } } });
};

/** Re-read after a write, for the broadcast payload. */
export const findReactions = async (id: string): Promise<MessageReactionDb[]> => {
  const msg = await Message.findById(id)
    .select('reactions')
    .lean<{ reactions?: MessageReactionDb[] }>();
  return msg?.reactions ?? [];
};